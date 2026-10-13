import type { BadgeTone } from '@/components/ui/Badge';
import type { OrderStatus, PaymentStatus, SupplierStatus } from '@/types/models';

export function orderStatusTone(status: OrderStatus): BadgeTone {
  switch (status) {
    case 'delivered':
      return 'success';
    case 'cancelled':
      return 'danger';
    case 'pending':
      return 'warning';
    case 'confirmed':
    case 'preparing':
    case 'out_for_delivery':
      return 'accent';
    default:
      return 'neutral';
  }
}

export function paymentStatusTone(status: PaymentStatus): BadgeTone {
  switch (status) {
    case 'paid':
      return 'success';
    case 'refunded':
      return 'danger';
    case 'unpaid':
      return 'neutral';
    case 'pending_confirmation':
    case 'partially_paid':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function supplierStatusTone(status: SupplierStatus): BadgeTone {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'unavailable':
      return 'danger';
    case 'awaiting_supplier':
      return 'warning';
    default:
      return 'neutral';
  }
}
