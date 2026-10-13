import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Search } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { useTrackOrder } from '@/hooks/useOrders';
import { usePublicSettings } from '@/hooks/useSettings';
import { formatDate, formatMoney, formatStatusLabel } from '@/lib/format';
import { ORDER_STATUSES } from '@/types/models';
import { cn } from '@/lib/cn';

export function Track() {
  const { token: tokenParam } = useParams<{ token?: string }>();
  const navigate = useNavigate();
  const { data: settings } = usePublicSettings();
  const [tokenInput, setTokenInput] = useState(tokenParam ?? '');

  const { data, isLoading, isError, error } = useTrackOrder(tokenParam);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = tokenInput.trim();
    if (trimmed) navigate(`/track/${trimmed}`);
  }

  const order = data?.data;
  const activeStepIndex = order ? ORDER_STATUSES.indexOf(order.order_status) : -1;
  const isCancelled = order?.order_status === 'cancelled';

  const brand = settings?.business_name || 'BanaGifts';

  return (
    <div className="container-prose px-3 py-8 xs:px-4 sm:px-6 sm:py-12">
      <PageMeta title="Track your order" description={`Look up the status of your ${brand} order.`} />
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="" className="h-11 w-11 rounded-sm object-cover" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{brand}</p>
          <h1 className="font-serif text-3xl text-text sm:text-4xl">Track your order</h1>
        </div>
      </div>
      <p className="mt-3 max-w-md text-sm text-muted">
        Enter the tracking link or token you received after placing your order.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex max-w-md flex-col gap-2 xs:flex-row sm:mt-8">
        <div className="min-w-0 flex-1">
          <Label htmlFor="token" className="sr-only">
            Tracking token
          </Label>
          <Input
            id="token"
            placeholder="Paste your tracking token"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
          />
        </div>
        <Button type="submit" className="flex min-h-11 items-center justify-center gap-2 xs:shrink-0">
          <Search className="h-4 w-4" /> Track
        </Button>
      </form>

      {tokenParam && (
        <div className="mt-10">
          {isLoading && <Spinner />}

          {isError && (
            <ErrorState
              title="Order not found"
              message={
                error instanceof Error && error.message
                  ? error.message
                  : "We couldn't find an order with that tracking token. Double-check the link and try again."
              }
            />
          )}

          {order && (
            <div className="space-y-8">
              <div className="border border-border bg-white p-4 xs:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wide text-muted">Order reference</p>
                    <p className="break-all font-serif text-xl text-text sm:text-2xl">{order.order_reference}</p>
                  </div>
                  <p className="text-sm text-muted">Placed {formatDate(order.created_at)}</p>
                </div>

                {!isCancelled ? (
                  <ol className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-2 sm:mt-8 sm:flex-wrap sm:gap-y-4 sm:overflow-visible sm:pb-0">
                    {ORDER_STATUSES.filter((s) => s !== 'cancelled').map((status, idx) => {
                      const reached = idx <= activeStepIndex;
                      return (
                        <li key={status} className="flex min-w-[4.75rem] flex-1 flex-col items-center text-center sm:min-w-[7rem]">
                          <div
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium',
                              reached ? 'border-accent bg-accent text-white' : 'border-border text-muted',
                            )}
                          >
                            {reached ? <Check className="h-4 w-4" /> : idx + 1}
                          </div>
                          <p className={cn('mt-2 text-[10px] leading-tight sm:text-xs', reached ? 'text-text' : 'text-muted')}>
                            {formatStatusLabel(status)}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="mt-6 text-sm text-danger">This order was cancelled.</p>
                )}
              </div>

              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                <div className="border border-border bg-white p-4 xs:p-6">
                  <h2 className="font-serif text-lg text-text sm:text-xl">Delivery</h2>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="shrink-0 text-muted">Recipient</dt>
                      <dd className="text-right">{order.recipient_name}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="shrink-0 text-muted">City</dt>
                      <dd className="text-right">{order.city}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="shrink-0 text-muted">Date</dt>
                      <dd className="text-right">{formatDate(order.delivery_date)}</dd>
                    </div>
                    {order.delivery_time_window && (
                      <div className="flex justify-between gap-3">
                        <dt className="shrink-0 text-muted">Time window</dt>
                        <dd className="text-right">{order.delivery_time_window}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="border border-border bg-white p-4 xs:p-6">
                  <h2 className="font-serif text-lg text-text sm:text-xl">Payment</h2>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Status</dt>
                      <dd>{formatStatusLabel(order.payment_status)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Subtotal</dt>
                      <dd>{formatMoney(order.subtotal, order.currency)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted">Delivery</dt>
                      <dd>{formatMoney(order.delivery_fee, order.currency)}</dd>
                    </div>
                    <div className="flex justify-between gap-3 font-medium text-text">
                      <dt>Total</dt>
                      <dd>{formatMoney(order.total, order.currency)}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="border border-border bg-white p-4 xs:p-6">
                <h2 className="font-serif text-lg text-text sm:text-xl">Items</h2>
                <ul className="mt-4 divide-y divide-border text-sm">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between gap-3 py-2">
                      <span className="min-w-0">
                        {item.product_name} × {item.quantity}
                      </span>
                      <span className="shrink-0">{formatMoney(item.line_subtotal, order.currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {settings?.contact_phone && (
                <p className="text-sm text-muted">
                  Questions about this order? Call us at{' '}
                  <a href={`tel:${settings.contact_phone}`} className="text-accent underline">
                    {settings.contact_phone}
                  </a>
                  .
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
