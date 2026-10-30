// Domain model types mirroring the Supabase schema
// (supabase/migrations/20261013120000_initial_schema.sql)

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

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_path: string | null;
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
  /** Units remaining; 0 means out of stock (usually paired with is_available=false). */
  stock_quantity: number;
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
  tracking_token_hash: string;

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

  idempotency_key: string | null;

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

export type BusinessSettingsMap = Record<string, unknown>;
