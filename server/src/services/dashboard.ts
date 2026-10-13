import { config } from '../config.js';
import { mockOrders } from '../lib/mockDb.js';
import { getSupabaseAdmin } from '../lib/supabase.js';
import type { Order, OrderStatus, PaymentStatus } from '../types/models.js';

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

const EMPTY_STATUS_COUNTS: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 0,
  preparing: 0,
  out_for_delivery: 0,
  delivered: 0,
  cancelled: 0,
};

const EMPTY_PAYMENT_COUNTS: Record<PaymentStatus, number> = {
  unpaid: 0,
  pending_confirmation: 0,
  paid: 0,
  partially_paid: 0,
  refunded: 0,
};

function isToday(isoDate: string): boolean {
  const d = new Date(isoDate);
  const now = new Date();
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  );
}

function summarize(orders: Order[]): DashboardSummary {
  const statusCounts = { ...EMPTY_STATUS_COUNTS };
  const paymentCounts = { ...EMPTY_PAYMENT_COUNTS };
  let revenue = 0;
  let pendingOrders = 0;
  let ordersToday = 0;

  for (const order of orders) {
    statusCounts[order.order_status] += 1;
    paymentCounts[order.payment_status] += 1;
    if (order.payment_status === 'paid') revenue += order.total;
    if (order.order_status === 'pending') pendingOrders += 1;
    if (isToday(order.created_at)) ordersToday += 1;
  }

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map((o) => ({
      id: o.id,
      order_reference: o.order_reference,
      order_status: o.order_status,
      payment_status: o.payment_status,
      total: o.total,
      currency: o.currency,
      created_at: o.created_at,
    }));

  return {
    totals: {
      orders: orders.length,
      revenue: Math.round(revenue * 100) / 100,
      pendingOrders,
      ordersToday,
    },
    statusCounts,
    paymentCounts,
    recentOrders,
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (config.useMockDb) {
    return summarize(mockOrders.listAll());
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from('orders').select('*');
  if (error) throw error;
  return summarize((data ?? []) as Order[]);
}
