import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, PackageSearch, Phone } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePublicSettings } from '@/hooks/useSettings';
import { api } from '@/lib/api';
import { formatDate, formatMoney, formatStatusLabel } from '@/lib/format';
import { readMyOrdersPhone, saveMyOrdersPhone } from '@/lib/session';
import { ApiError } from '@/types/api';
import type { CustomerOrderSummary, TrackingView } from '@/types/models';
import { cn } from '@/lib/cn';

export function MyOrders() {
  const { data: settings } = usePublicSettings();
  const brand = settings?.business_name || 'BanaGifts';
  const [phone, setPhone] = useState(readMyOrdersPhone);
  const [orders, setOrders] = useState<CustomerOrderSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detail, setDetail] = useState<TrackingView | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function lookup(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = phone.trim();
    if (trimmed.length < 8) {
      setError('Enter the phone number you used when ordering.');
      return;
    }
    setLoading(true);
    setError(null);
    setOrders(null);
    setExpanded(null);
    setDetail(null);
    try {
      const res = await api.orders.my(trimmed);
      saveMyOrdersPhone(trimmed);
      setOrders(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load orders. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleDetail(reference: string) {
    if (expanded === reference) {
      setExpanded(null);
      setDetail(null);
      return;
    }
    setExpanded(reference);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await api.orders.myDetail(phone.trim(), reference);
      setDetail(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load order details.');
      setExpanded(null);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="container-prose px-3 py-8 xs:px-4 sm:px-6 sm:py-12">
      <PageMeta title="My orders" description={`Find your ${brand} gift orders with your phone number.`} />

      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="" className="h-11 w-11 rounded-sm object-cover" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{brand}</p>
          <h1 className="font-serif text-3xl text-text sm:text-4xl">My orders</h1>
        </div>
      </div>
      <p className="mt-3 max-w-lg text-sm text-muted">
        Enter the phone number you used at checkout to see all your gift orders. No account needed.
      </p>

      <form onSubmit={lookup} className="mt-6 max-w-md space-y-3 sm:mt-8">
        <div>
          <Label htmlFor="my-orders-phone" required>
            Your phone number
          </Label>
          <Input
            id="my-orders-phone"
            type="tel"
            placeholder="09xxxxxxxx or +2519xxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </div>
        <Button type="submit" isLoading={loading} className="min-h-11 w-full sm:w-auto">
          <Phone className="mr-2 h-4 w-4" /> Find my orders
        </Button>
      </form>

      {error && <p className="mt-4 text-sm text-danger">{error}</p>}

      {loading && (
        <div className="mt-10 flex justify-center">
          <Spinner />
        </div>
      )}

      {!loading && orders && orders.length === 0 && (
        <div className="mt-10">
          <EmptyState
            icon={PackageSearch}
            title="No orders found"
            description="We couldn’t find orders for that number. Check the digits, or place a gift request first."
            action={
              <Link to="/gifts">
                <Button>Browse gifts</Button>
              </Link>
            }
          />
        </div>
      )}

      {!loading && orders && orders.length > 0 && (
        <ul className="mt-8 divide-y divide-border border border-border bg-white">
          {orders.map((order) => {
            const open = expanded === order.order_reference;
            return (
              <li key={order.order_reference}>
                <button
                  type="button"
                  onClick={() => void toggleDetail(order.order_reference)}
                  className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-surface/60 xs:px-5"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-text">{order.order_reference}</p>
                    <p className="mt-1 text-xs text-muted">
                      To {order.recipient_name} · {order.city} · {formatDate(order.delivery_date)}
                    </p>
                    <p className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded border border-border px-2 py-0.5 text-text">
                        {formatStatusLabel(order.order_status)}
                      </span>
                      <span className="rounded border border-border px-2 py-0.5 text-muted">
                        {formatStatusLabel(order.payment_status)}
                      </span>
                      <span className="text-muted">
                        {order.item_count} item{order.item_count === 1 ? '' : 's'}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="font-medium text-accent">{formatMoney(order.total, order.currency)}</span>
                    {open ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
                  </div>
                </button>

                <div className={cn('border-t border-border bg-surface/40 px-4 py-4 xs:px-5', !open && 'hidden')}>
                  {detailLoading && expanded === order.order_reference && (
                    <div className="flex justify-center py-4">
                      <Spinner />
                    </div>
                  )}
                  {detail && detail.order_reference === order.order_reference && (
                    <div className="space-y-4 text-sm">
                      <ul className="divide-y divide-border">
                        {detail.items.map((item, idx) => (
                          <li key={`${item.product_name}-${idx}`} className="flex justify-between gap-3 py-2">
                            <span>
                              {item.product_name} × {item.quantity}
                            </span>
                            <span>{formatMoney(item.line_subtotal, detail.currency)}</span>
                          </li>
                        ))}
                      </ul>
                      <dl className="grid gap-2 sm:grid-cols-2">
                        <div className="flex justify-between gap-2 sm:block">
                          <dt className="text-muted">Subtotal</dt>
                          <dd>{formatMoney(detail.subtotal, detail.currency)}</dd>
                        </div>
                        <div className="flex justify-between gap-2 sm:block">
                          <dt className="text-muted">Delivery fee</dt>
                          <dd>{formatMoney(detail.delivery_fee, detail.currency)}</dd>
                        </div>
                        <div className="flex justify-between gap-2 sm:block">
                          <dt className="text-muted">Total</dt>
                          <dd className="font-medium text-accent">{formatMoney(detail.total, detail.currency)}</dd>
                        </div>
                        {detail.delivery_time_window && (
                          <div className="flex justify-between gap-2 sm:block">
                            <dt className="text-muted">Time window</dt>
                            <dd>{detail.delivery_time_window}</dd>
                          </div>
                        )}
                      </dl>
                      {detail.status_history.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Status history</p>
                          <ol className="mt-2 space-y-1.5">
                            {detail.status_history.map((h, i) => (
                              <li key={`${h.status}-${h.created_at}-${i}`} className="text-xs text-muted">
                                <span className="font-medium text-text">{formatStatusLabel(h.status)}</span>
                                {' · '}
                                {formatDate(h.created_at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {settings?.contact_phone && (
                        <a
                          href={`tel:${settings.contact_phone}`}
                          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-accent hover:underline"
                        >
                          <Phone className="h-4 w-4" /> Call shop about this order
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-8 text-xs text-muted">
        Prefer a tracking link?{' '}
        <Link to="/track" className="text-accent underline">
          Track with token
        </Link>
      </p>
    </div>
  );
}
