import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Phone, ChevronLeft } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PaymentForm } from '@/components/admin/PaymentForm';
import { FulfillmentForm } from '@/components/admin/FulfillmentForm';
import { NotesPanel } from '@/components/admin/NotesPanel';
import { orderStatusTone, paymentStatusTone } from '@/components/admin/statusTone';
import {
  useAddOrderNote,
  useAdminOrder,
  useUpdateOrderFulfillment,
  useUpdateOrderPayment,
  useUpdateOrderStatus,
} from '@/hooks/useAdmin';
import { useToast } from '@/components/ui/Toast';
import { formatDate, formatDateTime, formatMoney, formatStatusLabel } from '@/lib/format';
import { nextStatusOptions } from '@/lib/orderStatus';
import type { OrderStatus } from '@/types/models';
import { ApiError } from '@/types/api';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useAdminOrder(id);
  const { show } = useToast();
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

  const updateStatus = useUpdateOrderStatus(id ?? '');
  const updatePayment = useUpdateOrderPayment(id ?? '');
  const updateFulfillment = useUpdateOrderFulfillment(id ?? '');
  const addNote = useAddOrderNote(id ?? '');

  if (isLoading) return <Spinner />;
  if (isError || !data) {
    return <ErrorState message="Couldn't load this order." onRetry={() => refetch()} />;
  }

  const order = data.data;

  async function confirmStatusChange() {
    if (!pendingStatus) return;
    try {
      await updateStatus.mutateAsync({ status: pendingStatus });
      show({ tone: 'success', title: `Order marked ${formatStatusLabel(pendingStatus)}` });
      setPendingStatus(null);
    } catch (err) {
      show({ tone: 'error', title: 'Could not update status', description: err instanceof ApiError ? err.message : undefined });
    }
  }

  return (
    <div>
      <PageMeta title={`Order ${order.order_reference}`} noIndex />
      <Link to="/orders" className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
        <ChevronLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-text">{order.order_reference}</h1>
          <p className="text-sm text-muted">Placed {formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <Badge tone={orderStatusTone(order.order_status)}>{formatStatusLabel(order.order_status)}</Badge>
          <Badge tone={paymentStatusTone(order.payment_status)}>{formatStatusLabel(order.payment_status)}</Badge>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {nextStatusOptions(order.order_status).map((status) => (
          <Button
            key={status}
            variant={status === 'cancelled' ? 'danger' : 'outline'}
            size="sm"
            onClick={() => setPendingStatus(status)}
          >
            Mark as {formatStatusLabel(status)}
          </Button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="border border-border bg-white p-5">
            <h2 className="font-serif text-xl text-text">Customer &amp; recipient</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">Customer</p>
                <p className="mt-1 text-sm text-text">{order.customer_name}</p>
                <a href={`tel:${order.customer_phone}`} className="flex items-center gap-1 text-sm text-accent hover:underline">
                  <Phone className="h-3.5 w-3.5" /> {order.customer_phone}
                </a>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">Recipient</p>
                <p className="mt-1 text-sm text-text">{order.recipient_name}</p>
                {order.recipient_phone && (
                  <a href={`tel:${order.recipient_phone}`} className="flex items-center gap-1 text-sm text-accent hover:underline">
                    <Phone className="h-3.5 w-3.5" /> {order.recipient_phone}
                  </a>
                )}
              </div>
            </div>
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="font-serif text-xl text-text">Delivery</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">City</dt>
                <dd>{order.city}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Address</dt>
                <dd className="text-right">{order.delivery_address}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Date</dt>
                <dd>{formatDate(order.delivery_date)}</dd>
              </div>
              {order.delivery_time_window && (
                <div className="flex justify-between">
                  <dt className="text-muted">Time window</dt>
                  <dd>{order.delivery_time_window}</dd>
                </div>
              )}
              {order.delivery_instructions && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Instructions</dt>
                  <dd className="text-right">{order.delivery_instructions}</dd>
                </div>
              )}
              {order.gift_message && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Gift message</dt>
                  <dd className="text-right italic">"{order.gift_message}"</dd>
                </div>
              )}
              {order.special_request && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Special request</dt>
                  <dd className="text-right">{order.special_request}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="font-serif text-xl text-text">Items</h2>
            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2">Item</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2 text-right">Unit price</th>
                  <th className="py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-b-0">
                    <td className="py-2">{item.product_name}</td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2 text-right">{formatMoney(item.unit_price, order.currency)}</td>
                    <td className="py-2 text-right">{formatMoney(item.line_subtotal, order.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatMoney(order.subtotal, order.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Delivery</span>
                <span>{formatMoney(order.delivery_fee, order.currency)}</span>
              </div>
              <div className="flex justify-between font-medium text-text">
                <span>Total</span>
                <span>{formatMoney(order.total, order.currency)}</span>
              </div>
            </div>
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="font-serif text-xl text-text">Status history</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {order.status_history.map((entry) => (
                <li key={entry.id} className="flex justify-between border-b border-border pb-2 last:border-b-0">
                  <span>
                    {entry.previous_status ? `${formatStatusLabel(entry.previous_status)} → ` : ''}
                    {formatStatusLabel(entry.new_status)}
                  </span>
                  <span className="text-muted">{formatDateTime(entry.created_at)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="border border-border bg-white p-5">
            <h2 className="font-serif text-xl text-text">Payment</h2>
            <div className="mt-4">
              <PaymentForm
                order={order}
                isSubmitting={updatePayment.isPending}
                onSubmit={async (patch) => {
                  try {
                    await updatePayment.mutateAsync(patch);
                    show({ tone: 'success', title: 'Payment details updated' });
                  } catch (err) {
                    show({ tone: 'error', title: 'Could not update payment', description: err instanceof ApiError ? err.message : undefined });
                  }
                }}
              />
            </div>
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="font-serif text-xl text-text">Fulfillment</h2>
            <div className="mt-4">
              <FulfillmentForm
                order={order}
                isSubmitting={updateFulfillment.isPending}
                onSubmit={async (patch) => {
                  try {
                    await updateFulfillment.mutateAsync(patch);
                    show({ tone: 'success', title: 'Fulfillment details updated' });
                  } catch (err) {
                    show({ tone: 'error', title: 'Could not update fulfillment', description: err instanceof ApiError ? err.message : undefined });
                  }
                }}
              />
            </div>
          </section>

          <section className="border border-border bg-white p-5">
            <h2 className="font-serif text-xl text-text">Internal notes</h2>
            <div className="mt-4">
              <NotesPanel
                notes={order.notes}
                isSubmitting={addNote.isPending}
                onAddNote={async (text) => {
                  try {
                    await addNote.mutateAsync(text);
                  } catch (err) {
                    show({ tone: 'error', title: 'Could not add note', description: err instanceof ApiError ? err.message : undefined });
                  }
                }}
              />
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        isOpen={pendingStatus !== null}
        title={pendingStatus ? `Mark order as ${formatStatusLabel(pendingStatus)}?` : ''}
        confirmLabel="Confirm"
        tone={pendingStatus === 'cancelled' ? 'danger' : 'primary'}
        isLoading={updateStatus.isPending}
        onConfirm={confirmStatusChange}
        onCancel={() => setPendingStatus(null)}
      />
    </div>
  );
}
