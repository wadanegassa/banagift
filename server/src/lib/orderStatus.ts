import type { OrderStatus } from '../types/models.js';

/** Server-enforced order status state machine. */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  return ORDER_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Maps a new order status to the corresponding timestamp column to stamp. */
export const ORDER_STATUS_TIMESTAMP_COLUMN: Partial<Record<OrderStatus, keyof import('../types/models.js').Order>> = {
  confirmed: 'confirmed_at',
  preparing: 'preparing_at',
  out_for_delivery: 'out_for_delivery_at',
  delivered: 'delivered_at',
  cancelled: 'cancelled_at',
};
