import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Copy, Phone } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Button } from '@/components/ui/Button';
import { usePublicSettings } from '@/hooks/useSettings';
import { readLastOrder, type LastOrderInfo } from '@/lib/session';
import { formatMoney, formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/Toast';

export function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: settings } = usePublicSettings();
  const { show } = useToast();
  const [order, setOrder] = useState<LastOrderInfo | null>(null);

  useEffect(() => {
    const fromState = location.state as LastOrderInfo | undefined;
    if (fromState?.order_reference) {
      setOrder(fromState);
      return;
    }
    const stored = readLastOrder();
    if (stored) {
      setOrder(stored);
    } else {
      navigate('/', { replace: true });
    }
  }, [location.state, navigate]);

  if (!order) return null;

  function copyToken() {
    if (!order) return;
    navigator.clipboard?.writeText(order.tracking_token).then(() => {
      show({ tone: 'success', title: 'Tracking link copied' });
    });
  }

  const phone = settings?.contact_phone;

  const brand = settings?.business_name || 'BanaGifts';

  return (
    <div className="container-prose px-3 py-10 xs:px-4 sm:px-6 sm:py-16">
      <PageMeta title="Order received" />
      <div className="mx-auto max-w-xl text-center">
        <img src="/logo.png" alt={brand} className="mx-auto h-16 w-16 rounded-sm object-cover" />
        <CheckCircle2 className="mx-auto mt-4 h-10 w-10 text-success" aria-hidden="true" />
        <h1 className="mt-5 font-serif text-3xl text-text sm:text-4xl">Order received — please call us</h1>
        <p className="mt-3 text-sm text-muted">
          Your request is saved with {brand}. Call the shop to confirm the gift, delivery location, price in ETB, and
          payment. Nothing is charged online.
        </p>

        {phone && (
          <a
            href={`tel:${phone}`}
            className="mt-6 inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-2 border border-accent bg-accent px-6 py-3 text-sm font-medium uppercase tracking-wide text-white"
          >
            <Phone className="h-4 w-4" /> Call {phone}
          </a>
        )}

        <div className="mt-8 border border-border bg-white p-6 text-left">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Order reference</dt>
              <dd className="font-medium text-text">{order.order_reference}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Requested delivery</dt>
              <dd className="font-medium text-text">{formatDate(order.delivery_date)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Estimated total</dt>
              <dd className="font-medium text-accent">{formatMoney(order.total, order.currency || 'ETB')}</dd>
            </div>
          </dl>

          <div className="mt-5 flex items-center justify-between gap-3 rounded border border-border bg-surface/60 p-3">
            <p className="truncate text-xs text-muted">Tracking: {order.tracking_token}</p>
            <button type="button" onClick={copyToken} aria-label="Copy tracking token" className="text-muted hover:text-accent">
              <Copy className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 space-y-2">
            <Link to={`/track/${order.tracking_token}`}>
              <Button fullWidth variant="outline">
                Check order status
              </Button>
            </Link>
            <Link to="/orders">
              <Button fullWidth>View my orders</Button>
            </Link>
          </div>
        </div>

        <Link to="/gifts" className="mt-8 inline-block text-sm text-muted hover:text-accent">
          Continue browsing
        </Link>
      </div>
    </div>
  );
}
