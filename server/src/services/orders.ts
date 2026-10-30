import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { generateOrderReference, generateTrackingToken, hashTrackingToken } from '../lib/crypto.js';
import { addCalendarDays, calendarDateInTimeZone, isValidIsoDate } from '../lib/dates.js';
import { badRequest, notFound } from '../lib/errors.js';
import { computeOrderTotals } from '../lib/money.js';
import { mockOrders, mockProducts } from '../lib/mockDb.js';
import { canTransitionOrderStatus, ORDER_STATUS_TIMESTAMP_COLUMN } from '../lib/orderStatus.js';
import { phoneMatchKey, phonesMatch } from '../lib/phone.js';
import { getSupabaseAdmin } from '../lib/supabase.js';
import type {
  Order,
  OrderItem,
  OrderNote,
  OrderStatus,
  OrderStatusHistoryEntry,
  OrderWithRelations,
  PaymentStatus,
  SupplierStatus,
} from '../types/models.js';
import { getProductsByIds } from './products.js';
import { getAllSettings } from './settings.js';

/** Merge duplicate product lines so stock checks and totals stay accurate. */
function mergeOrderItems(items: OrderItemInput[]): OrderItemInput[] {
  const merged = new Map<string, number>();
  for (const item of items) {
    merged.set(item.product_id, (merged.get(item.product_id) ?? 0) + item.quantity);
  }
  return [...merged.entries()].map(([product_id, quantity]) => ({ product_id, quantity }));
}

async function decrementStockForLines(
  lines: Array<{ product_id: string; quantity: number }>,
): Promise<void> {
  if (config.useMockDb) {
    const applied: Array<{ product_id: string; quantity: number }> = [];
    for (const line of lines) {
      const ok = mockProducts.decrementStock(line.product_id, line.quantity);
      if (!ok) {
        for (const prev of applied) mockProducts.restoreStock(prev.product_id, prev.quantity);
        throw badRequest('INSUFFICIENT_STOCK', 'Not enough stock for one or more items', {
          items: [{ product_id: line.product_id, reason: 'insufficient_stock' }],
        });
      }
      applied.push(line);
    }
    return;
  }

  const supabase = getSupabaseAdmin();
  const applied: Array<{ product_id: string; quantity: number }> = [];
  for (const line of lines) {
    const { error } = await supabase.rpc('decrement_product_stock', {
      p_id: line.product_id,
      p_qty: line.quantity,
    });
    if (error) {
      for (const prev of applied) {
        await supabase.rpc('restore_product_stock', { p_id: prev.product_id, p_qty: prev.quantity });
      }
      throw badRequest('INSUFFICIENT_STOCK', 'Not enough stock for one or more items', {
        items: [{ product_id: line.product_id, reason: 'insufficient_stock' }],
      });
    }
    applied.push(line);
  }
}

async function restoreStockForOrder(orderId: string): Promise<void> {
  if (config.useMockDb) {
    for (const item of mockOrders.itemsForOrder(orderId)) {
      if (item.product_id) mockProducts.restoreStock(item.product_id, item.quantity);
    }
    return;
  }

  const supabase = getSupabaseAdmin();
  const { data: items, error } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId);
  if (error) throw error;
  for (const item of items ?? []) {
    if (!item.product_id) continue;
    await supabase.rpc('restore_product_stock', {
      p_id: item.product_id,
      p_qty: item.quantity,
    });
  }
}

export interface OrderItemInput {
  product_id: string;
  quantity: number;
}

export interface CreateOrderInput {
  customer_name: string;
  customer_phone: string;
  recipient_name: string;
  recipient_phone?: string | null;
  city: string;
  delivery_address: string;
  delivery_date: string;
  delivery_time_window?: string | null;
  delivery_instructions?: string | null;
  gift_message?: string | null;
  special_request?: string | null;
  items: OrderItemInput[];
}

export interface CreateOrderResult {
  order: Order;
  items: OrderItem[];
  trackingToken: string;
}

const MAX_REFERENCE_ATTEMPTS = 8;

async function referenceIsTaken(reference: string): Promise<boolean> {
  if (config.useMockDb) return mockOrders.referenceExists(reference);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('order_reference', reference)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

async function generateUniqueReference(): Promise<string> {
  for (let i = 0; i < MAX_REFERENCE_ATTEMPTS; i += 1) {
    const reference = generateOrderReference();
    if (!(await referenceIsTaken(reference))) return reference;
  }
  throw new Error('Unable to generate a unique order reference');
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (input.items.length === 0) {
    throw badRequest('EMPTY_ORDER', 'An order must contain at least one item');
  }

  const mergedItems = mergeOrderItems(input.items);

  // --- Recalculate everything from the database. Never trust client prices. ---
  const uniqueProductIds = mergedItems.map((i) => i.product_id);
  const products = await getProductsByIds(uniqueProductIds);
  const productsById = new Map(products.map((p) => [p.id, p]));

  const unavailable: Array<{ product_id: string; reason: string; available?: number }> = [];
  for (const item of mergedItems) {
    const product = productsById.get(item.product_id);
    if (!product) {
      unavailable.push({ product_id: item.product_id, reason: 'not_found' });
    } else if (product.archived_at !== null) {
      unavailable.push({ product_id: item.product_id, reason: 'archived' });
    } else if (!product.is_available || product.stock_quantity <= 0) {
      unavailable.push({ product_id: item.product_id, reason: 'unavailable', available: 0 });
    } else if (item.quantity > product.stock_quantity) {
      unavailable.push({
        product_id: item.product_id,
        reason: 'insufficient_stock',
        available: product.stock_quantity,
      });
    }
  }
  if (unavailable.length > 0) {
    const hasStockIssue = unavailable.some((u) => u.reason === 'insufficient_stock');
    throw badRequest(
      hasStockIssue ? 'INSUFFICIENT_STOCK' : 'PRODUCT_UNAVAILABLE',
      hasStockIssue
        ? 'Not enough stock for one or more items'
        : 'One or more items are no longer available',
      { items: unavailable },
    );
  }

  const settings = await getAllSettings();
  const minLeadDays = Number(settings.min_lead_time_days ?? 0);
  const defaultDeliveryFee = Number(settings.default_delivery_fee ?? 0);
  const freeThreshold =
    settings.free_delivery_threshold === null || settings.free_delivery_threshold === undefined
      ? null
      : Number(settings.free_delivery_threshold);
  const currency = typeof settings.currency === 'string' ? settings.currency : 'ETB';

  if (!isValidIsoDate(input.delivery_date)) {
    throw badRequest('INVALID_DELIVERY_DATE', 'delivery_date must be a valid date (YYYY-MM-DD)');
  }
  const today = calendarDateInTimeZone(new Date());
  const earliestAllowed = addCalendarDays(today, minLeadDays);
  if (input.delivery_date < earliestAllowed) {
    throw badRequest(
      'LEAD_TIME_TOO_SHORT',
      `Delivery date must be at least ${minLeadDays} day(s) from today`,
      { minLeadTimeDays: minLeadDays, earliestAllowed },
    );
  }

  const lines = mergedItems.map((item) => {
    const product = productsById.get(item.product_id)!;
    return { unitPrice: product.price, quantity: item.quantity, product };
  });
  const totals = computeOrderTotals(
    lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
    defaultDeliveryFee,
  );
  const deliveryFee = freeThreshold !== null && totals.subtotal >= freeThreshold ? 0 : totals.deliveryFee;
  const total = Math.round((totals.subtotal + deliveryFee) * 100) / 100;

  // Reserve stock before persisting the order so we never oversell.
  await decrementStockForLines(mergedItems);

  const orderReference = await generateUniqueReference();
  const trackingToken = generateTrackingToken();
  const trackingTokenHash = hashTrackingToken(trackingToken);
  const nowIso = new Date().toISOString();

  const orderId = randomUUID();
  const order: Order = {
    id: orderId,
    order_reference: orderReference,
    tracking_token_hash: trackingTokenHash,
    customer_name: input.customer_name,
    customer_phone: input.customer_phone,
    recipient_name: input.recipient_name,
    recipient_phone: input.recipient_phone ?? null,
    city: input.city,
    delivery_address: input.delivery_address,
    delivery_date: input.delivery_date,
    delivery_time_window: input.delivery_time_window ?? null,
    delivery_instructions: input.delivery_instructions ?? null,
    gift_message: input.gift_message ?? null,
    special_request: input.special_request ?? null,
    order_status: 'pending',
    payment_status: 'unpaid',
    supplier_status: 'not_contacted',
    subtotal: totals.subtotal,
    delivery_fee: deliveryFee,
    total,
    currency,
    payment_method: null,
    amount_paid: 0,
    payment_notes: null,
    payment_confirmed_at: null,
    supplier_contact: null,
    supplier_notes: null,
    delivery_person_name: null,
    delivery_person_phone: null,
    delivery_arrangement_notes: null,
    confirmed_at: null,
    preparing_at: null,
    out_for_delivery_at: null,
    delivered_at: null,
    cancelled_at: null,
    idempotency_key: null,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const orderItems: OrderItem[] = lines.map((line) => {
    const primaryImage = [...(line.product.images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
    return {
      id: randomUUID(),
      order_id: orderId,
      product_id: line.product.id,
      product_name: line.product.name,
      product_image_path: primaryImage?.storage_path ?? primaryImage?.url ?? null,
      unit_price: line.unitPrice,
      quantity: line.quantity,
      line_subtotal: Math.round(line.unitPrice * line.quantity * 100) / 100,
    };
  });

  const historyEntry: OrderStatusHistoryEntry = {
    id: randomUUID(),
    order_id: orderId,
    previous_status: null,
    new_status: 'pending',
    actor_id: null,
    note: null,
    created_at: nowIso,
  };

  if (config.useMockDb) {
    mockOrders.create(order, orderItems, historyEntry);
    return { order, items: orderItems, trackingToken };
  }

  const supabase = getSupabaseAdmin();

  // Always send concrete UUIDs. Some remote schemas omit column defaults, and
  // PostgREST will persist `undefined` as SQL NULL if an `id` key is present.
  const orderPayload = {
    id: order.id,
    order_reference: order.order_reference,
    tracking_token_hash: order.tracking_token_hash,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    recipient_name: order.recipient_name,
    recipient_phone: order.recipient_phone,
    city: order.city,
    delivery_address: order.delivery_address,
    delivery_date: order.delivery_date,
    delivery_time_window: order.delivery_time_window,
    delivery_instructions: order.delivery_instructions,
    gift_message: order.gift_message,
    special_request: order.special_request,
    order_status: order.order_status,
    payment_status: order.payment_status,
    supplier_status: order.supplier_status,
    subtotal: order.subtotal,
    delivery_fee: order.delivery_fee,
    total: order.total,
    currency: order.currency,
    amount_paid: order.amount_paid,
  };

  try {
    const { data: inserted, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select('*')
      .single();
    if (orderError) throw orderError;

    const finalOrder = inserted as Order;
    const itemsToInsert = orderItems.map((item) => ({
      id: item.id,
      order_id: finalOrder.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image_path: item.product_image_path,
      unit_price: item.unit_price,
      quantity: item.quantity,
      line_subtotal: item.line_subtotal,
    }));
    const { data: insertedItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)
      .select('*');
    if (itemsError) throw itemsError;

    const { error: historyError } = await supabase.from('order_status_history').insert({
      id: randomUUID(),
      order_id: finalOrder.id,
      previous_status: null,
      new_status: 'pending',
    });
    if (historyError) throw historyError;

    return { order: finalOrder, items: (insertedItems ?? []) as OrderItem[], trackingToken };
  } catch (err) {
    // Roll stock back if order persistence fails after reservation.
    for (const line of mergedItems) {
      try {
        await supabase.rpc('restore_product_stock', { p_id: line.product_id, p_qty: line.quantity });
      } catch {
        // Best-effort rollback; surface the original order error below.
      }
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Tracking (public)
// ---------------------------------------------------------------------------

export interface TrackingView {
  order_reference: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  city: string;
  recipient_name: string;
  delivery_date: string;
  delivery_time_window: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  currency: string;
  items: Array<Pick<OrderItem, 'product_name' | 'unit_price' | 'quantity' | 'line_subtotal'>>;
  status_history: Array<{ status: OrderStatus; created_at: string }>;
  created_at: string;
}

function toTrackingView(order: Order, items: OrderItem[], history: OrderStatusHistoryEntry[]): TrackingView {
  return {
    order_reference: order.order_reference,
    order_status: order.order_status,
    payment_status: order.payment_status,
    city: order.city,
    recipient_name: order.recipient_name,
    delivery_date: order.delivery_date,
    delivery_time_window: order.delivery_time_window,
    subtotal: order.subtotal,
    delivery_fee: order.delivery_fee,
    total: order.total,
    currency: order.currency,
    items: items.map((i) => ({
      product_name: i.product_name,
      unit_price: i.unit_price,
      quantity: i.quantity,
      line_subtotal: i.line_subtotal,
    })),
    status_history: history.map((h) => ({ status: h.new_status, created_at: h.created_at })),
    created_at: order.created_at,
  };
}

export async function getOrderByTrackingToken(token: string): Promise<TrackingView> {
  const hash = hashTrackingToken(token);

  if (config.useMockDb) {
    const order = mockOrders.findByTrackingHash(hash);
    if (!order) throw notFound('Order not found');
    const items = mockOrders.itemsForOrder(order.id);
    const history = mockOrders.historyForOrder(order.id);
    return toTrackingView(order, items, history);
  }

  const supabase = getSupabaseAdmin();
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('tracking_token_hash', hash)
    .maybeSingle();
  if (error) throw error;
  if (!order) throw notFound('Order not found');

  const [{ data: items }, { data: history }] = await Promise.all([
    supabase.from('order_items').select('*').eq('order_id', order.id),
    supabase.from('order_status_history').select('*').eq('order_id', order.id).order('created_at'),
  ]);

  return toTrackingView(order as Order, (items ?? []) as OrderItem[], (history ?? []) as OrderStatusHistoryEntry[]);
}

/** Public summary for “My Orders” (no private fulfillment fields). */
export interface CustomerOrderSummary {
  order_reference: string;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  city: string;
  recipient_name: string;
  delivery_date: string;
  total: number;
  currency: string;
  item_count: number;
  created_at: string;
}

function toCustomerSummary(order: Order, itemCount: number): CustomerOrderSummary {
  return {
    order_reference: order.order_reference,
    order_status: order.order_status,
    payment_status: order.payment_status,
    city: order.city,
    recipient_name: order.recipient_name,
    delivery_date: order.delivery_date,
    total: order.total,
    currency: order.currency,
    item_count: itemCount,
    created_at: order.created_at,
  };
}

/** List orders for a guest by the phone number used at checkout. */
export async function listOrdersByCustomerPhone(phone: string): Promise<CustomerOrderSummary[]> {
  const key = phoneMatchKey(phone);
  if (key.length < 8) {
    throw badRequest('INVALID_PHONE', 'Enter a valid phone number');
  }

  if (config.useMockDb) {
    const matched = mockOrders
      .list({ page: 1, limit: 500 })
      .items.filter((o) => phonesMatch(o.customer_phone, phone))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);
    return matched.map((o) => toCustomerSummary(o, mockOrders.itemsForOrder(o.id).length));
  }

  const supabase = getSupabaseAdmin();
  // Broad filter, then normalize-match in app (handles 09… vs +251…).
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(id)')
    .ilike('customer_phone', `%${key}%`)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;

  const rows = ((data ?? []) as Array<Order & { order_items?: Array<{ id: string }> }>).filter((o) =>
    phonesMatch(o.customer_phone, phone),
  );

  return rows.slice(0, 50).map((o) => toCustomerSummary(o, o.order_items?.length ?? 0));
}

/** Full public tracking view when phone matches the order’s customer phone. */
export async function getOrderByPhoneAndReference(
  phone: string,
  orderReference: string,
): Promise<TrackingView> {
  const key = phoneMatchKey(phone);
  if (key.length < 8) {
    throw badRequest('INVALID_PHONE', 'Enter a valid phone number');
  }

  const reference = orderReference.trim().toUpperCase();

  if (config.useMockDb) {
    const order = mockOrders.list({ page: 1, limit: 500 }).items.find((o) => o.order_reference === reference);
    if (!order || !phonesMatch(order.customer_phone, phone)) throw notFound('Order not found');
    return toTrackingView(order, mockOrders.itemsForOrder(order.id), mockOrders.historyForOrder(order.id));
  }

  const supabase = getSupabaseAdmin();
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_reference', reference)
    .maybeSingle();
  if (error) throw error;
  if (!order || !phonesMatch((order as Order).customer_phone, phone)) {
    throw notFound('Order not found');
  }

  const [{ data: items }, { data: history }] = await Promise.all([
    supabase.from('order_items').select('*').eq('order_id', order.id),
    supabase.from('order_status_history').select('*').eq('order_id', order.id).order('created_at'),
  ]);

  return toTrackingView(order as Order, (items ?? []) as OrderItem[], (history ?? []) as OrderStatusHistoryEntry[]);
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface AdminOrderFilters {
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  limit: number;
}

export async function listOrdersAdmin(filters: AdminOrderFilters): Promise<{ items: Order[]; total: number }> {
  if (config.useMockDb) {
    return mockOrders.list({
      search: filters.search,
      status: filters.status,
      paymentStatus: filters.paymentStatus,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      page: filters.page,
      limit: filters.limit,
    });
  }

  const supabase = getSupabaseAdmin();
  let query = supabase.from('orders').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (filters.status) query = query.eq('order_status', filters.status);
  if (filters.paymentStatus) query = query.eq('payment_status', filters.paymentStatus);
  if (filters.dateFrom) query = query.gte('delivery_date', filters.dateFrom);
  if (filters.dateTo) query = query.lte('delivery_date', filters.dateTo);
  if (filters.search) {
    const term = filters.search.replace(/[%,]/g, '');
    query = query.or(
      `order_reference.ilike.%${term}%,customer_name.ilike.%${term}%,recipient_name.ilike.%${term}%,customer_phone.ilike.%${term}%`,
    );
  }
  const start = (filters.page - 1) * filters.limit;
  query = query.range(start, start + filters.limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: (data ?? []) as Order[], total: count ?? 0 };
}

async function fetchOrderOrThrow(id: string): Promise<Order> {
  if (config.useMockDb) {
    const order = mockOrders.findById(id);
    if (!order) throw notFound('Order not found');
    return order;
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) throw notFound('Order not found');
  return data as Order;
}

export async function getOrderAdminById(id: string): Promise<OrderWithRelations> {
  const order = await fetchOrderOrThrow(id);

  if (config.useMockDb) {
    return {
      ...order,
      items: mockOrders.itemsForOrder(order.id),
      status_history: mockOrders.historyForOrder(order.id),
      notes: mockOrders.notesForOrder(order.id),
    };
  }

  const supabase = getSupabaseAdmin();
  const [{ data: items }, { data: history }, { data: notes }] = await Promise.all([
    supabase.from('order_items').select('*').eq('order_id', order.id),
    supabase.from('order_status_history').select('*').eq('order_id', order.id).order('created_at'),
    supabase.from('order_notes').select('*').eq('order_id', order.id).order('created_at', { ascending: false }),
  ]);

  return {
    ...order,
    items: (items ?? []) as OrderItem[],
    status_history: (history ?? []) as OrderStatusHistoryEntry[],
    notes: (notes ?? []) as OrderNote[],
  };
}

export async function updateOrderStatus(
  id: string,
  newStatus: OrderStatus,
  actorId: string | null,
  note?: string | null,
): Promise<Order> {
  const order = await fetchOrderOrThrow(id);

  if (!canTransitionOrderStatus(order.order_status, newStatus)) {
    throw badRequest(
      'INVALID_STATUS_TRANSITION',
      `Cannot transition order from "${order.order_status}" to "${newStatus}"`,
      { from: order.order_status, to: newStatus },
    );
  }

  const timestampColumn = ORDER_STATUS_TIMESTAMP_COLUMN[newStatus];
  const patch: Partial<Order> = { order_status: newStatus };
  if (timestampColumn) {
    (patch as Record<string, unknown>)[timestampColumn] = new Date().toISOString();
  }

  const historyEntry: OrderStatusHistoryEntry = {
    id: randomUUID(),
    order_id: order.id,
    previous_status: order.order_status,
    new_status: newStatus,
    actor_id: actorId,
    note: note ?? null,
    created_at: new Date().toISOString(),
  };

  if (config.useMockDb) {
    const updated = mockOrders.update(order.id, patch);
    mockOrders.appendHistory(historyEntry);
    if (newStatus === 'cancelled') {
      await restoreStockForOrder(order.id);
    }
    return updated!;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('orders').update(patch).eq('id', order.id).select('*').single();
  if (error) throw error;
  await supabase.from('order_status_history').insert({
    order_id: order.id,
    previous_status: historyEntry.previous_status,
    new_status: historyEntry.new_status,
    actor_id: historyEntry.actor_id,
    note: historyEntry.note,
  });
  if (newStatus === 'cancelled') {
    await restoreStockForOrder(order.id);
  }
  return data as Order;
}

export interface PaymentUpdateInput {
  payment_status?: PaymentStatus;
  amount_paid?: number;
  payment_method?: string | null;
  payment_notes?: string | null;
}

export async function updateOrderPayment(id: string, input: PaymentUpdateInput): Promise<Order> {
  const order = await fetchOrderOrThrow(id);
  const patch: Partial<Order> = { ...input };
  if (input.payment_status === 'paid' && order.payment_status !== 'paid') {
    patch.payment_confirmed_at = new Date().toISOString();
  }

  if (config.useMockDb) {
    const updated = mockOrders.update(order.id, patch);
    return updated!;
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('orders').update(patch).eq('id', order.id).select('*').single();
  if (error) throw error;
  return data as Order;
}

export interface FulfillmentUpdateInput {
  supplier_status?: SupplierStatus;
  supplier_contact?: string | null;
  supplier_notes?: string | null;
  delivery_person_name?: string | null;
  delivery_person_phone?: string | null;
  delivery_arrangement_notes?: string | null;
}

export async function updateOrderFulfillment(id: string, input: FulfillmentUpdateInput): Promise<Order> {
  await fetchOrderOrThrow(id);
  if (config.useMockDb) {
    const updated = mockOrders.update(id, input);
    return updated!;
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('orders').update(input).eq('id', id).select('*').single();
  if (error) throw error;
  return data as Order;
}

export async function addOrderNote(id: string, authorId: string | null, noteText: string): Promise<OrderNote> {
  await fetchOrderOrThrow(id);
  const note: OrderNote = {
    id: randomUUID(),
    order_id: id,
    author_id: authorId,
    note_text: noteText,
    created_at: new Date().toISOString(),
  };

  if (config.useMockDb) {
    mockOrders.addNote(note);
    return note;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('order_notes')
    .insert({ order_id: id, author_id: authorId, note_text: noteText })
    .select('*')
    .single();
  if (error) throw error;
  return data as OrderNote;
}
