// Domain model types — mirrors server/src/types/models.ts

export type UserRole = 'customer' | 'admin';

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'unpaid',
  'pending_confirmation',
  'paid',
  'partially_paid',
  'refunded',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const SUPPLIER_STATUSES = [
  'not_contacted',
  'awaiting_supplier',
  'confirmed',
  'unavailable',
] as const;
export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
  /** Resolved public/demo image URL from the API (optional). */
  image_url?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string;
  price: number;
  is_available: boolean;
  is_featured: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProductWithRelations extends Product {
  category: Pick<Category, 'id' | 'name' | 'slug'> | null;
  images: ProductImage[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image_path: string | null;
  unit_price: number;
  quantity: number;
  line_subtotal: number;
}

export interface OrderStatusHistoryEntry {
  id: string;
  order_id: string;
  previous_status: OrderStatus | null;
  new_status: OrderStatus;
  actor_id: string | null;
  note: string | null;
  created_at: string;
}

export interface OrderNote {
  id: string;
  order_id: string;
  author_id: string | null;
  note_text: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_reference: string;

  customer_name: string;
  customer_phone: string;

  recipient_name: string;
  recipient_phone: string | null;

  city: string;
  delivery_address: string;
  delivery_date: string;
  delivery_time_window: string | null;
  delivery_instructions: string | null;
  gift_message: string | null;
  special_request: string | null;

  order_status: OrderStatus;
  payment_status: PaymentStatus;
  supplier_status: SupplierStatus;

  subtotal: number;
  delivery_fee: number;
  total: number;
  currency: string;
  payment_method: string | null;
  amount_paid: number;
  payment_notes: string | null;
  payment_confirmed_at: string | null;

  supplier_contact: string | null;
  supplier_notes: string | null;
  delivery_person_name: string | null;
  delivery_person_phone: string | null;
  delivery_arrangement_notes: string | null;

  confirmed_at: string | null;
  preparing_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface OrderWithRelations extends OrderWithItems {
  status_history: OrderStatusHistoryEntry[];
  notes: OrderNote[];
}

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

/** Summary returned by phone lookup on My Orders. */
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

export interface CreateOrderResponseData {
  order_reference: string;
  tracking_token: string;
  order_status: string;
  payment_status: string;
  delivery_date: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  currency: string;
  items: Array<{ product_name: string; unit_price: number; quantity: number; line_subtotal: number }>;
}

export type BusinessSettingsMap = Record<string, unknown>;

export interface PublicSettings {
  business_name?: string;
  tagline?: string;
  contact_phone?: string;
  contact_email?: string;
  currency?: string;
  default_delivery_fee?: number;
  free_delivery_threshold?: number | null;
  delivery_areas?: string[];
  min_lead_time_days?: number;
  announcement?: string;
  privacy_notice?: string;
  policy_text?: string;
}

export interface DashboardSummary {
  totals: {
    orders: number;
    revenue: number;
    pendingOrders: number;
    ordersToday: number;
  };
  statusCounts: Record<OrderStatus, number>;
  paymentCounts: Record<PaymentStatus, number>;
  recentOrders: Array<
    Pick<Order, 'id' | 'order_reference' | 'order_status' | 'payment_status' | 'total' | 'currency' | 'created_at'>
  >;
}
