import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAdminOrders } from '@/hooks/useAdmin';
import { formatMoney, formatDate, formatStatusLabel } from '@/lib/format';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@/types/models';
import { orderStatusTone, paymentStatusTone } from '@/components/admin/statusTone';

const PAGE_SIZE = 20;

export function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const page = Number(searchParams.get('page') ?? '1');

  const filters = {
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    payment_status: searchParams.get('payment_status') || undefined,
    date_from: searchParams.get('date_from') || undefined,
    date_to: searchParams.get('date_to') || undefined,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isFetching, isError, refetch } = useAdminOrders(filters);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  }

  const total = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageMeta title="Orders" noIndex />
      <h1 className="font-serif text-3xl text-text">Orders</h1>

      <div className="mt-6 flex flex-col gap-3 border border-border bg-white p-4 md:flex-row md:items-center md:justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateParam('search', searchInput.trim());
          }}
          className="flex w-full max-w-sm gap-2"
        >
          <Input
            placeholder="Search by reference, name, phone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search orders"
          />
          <Button type="submit" variant="outline" aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div className="flex flex-wrap gap-3">
          <Select
            value={searchParams.get('status') ?? ''}
            onChange={(e) => updateParam('status', e.target.value)}
            aria-label="Filter by order status"
            className="min-w-[9rem]"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatusLabel(s)}
              </option>
            ))}
          </Select>
          <Select
            value={searchParams.get('payment_status') ?? ''}
            onChange={(e) => updateParam('payment_status', e.target.value)}
            aria-label="Filter by payment status"
            className="min-w-[10rem]"
          >
            <option value="">All payment statuses</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatStatusLabel(s)}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            value={searchParams.get('date_from') ?? ''}
            onChange={(e) => updateParam('date_from', e.target.value)}
            aria-label="Orders from date"
            className="min-w-[9rem]"
          />
          <Input
            type="date"
            value={searchParams.get('date_to') ?? ''}
            onChange={(e) => updateParam('date_to', e.target.value)}
            aria-label="Orders to date"
            className="min-w-[9rem]"
          />
        </div>
      </div>

      <div className="mt-6 border border-border bg-white">
        {isError ? (
          <div className="p-6">
            <ErrorState message="Couldn't load orders." onRetry={() => refetch()} />
          </div>
        ) : isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (data?.data ?? []).length === 0 ? (
          <div className="p-6">
            <EmptyState title="No orders found" description="Try adjusting your filters." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Delivery date</th>
                  <th className="px-5 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-b-0 hover:bg-surface/60">
                    <td className="px-5 py-3">
                      <Link to={`/orders/${order.id}`} className="font-medium text-accent hover:underline">
                        {order.order_reference}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <p>{order.customer_name}</p>
                      <p className="text-xs text-muted">{order.customer_phone}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={orderStatusTone(order.order_status)}>{formatStatusLabel(order.order_status)}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={paymentStatusTone(order.payment_status)}>{formatStatusLabel(order.payment_status)}</Badge>
                    </td>
                    <td className="px-5 py-3">{formatDate(order.delivery_date)}</td>
                    <td className="px-5 py-3 font-medium">{formatMoney(order.total, order.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-muted">
            Page {page} of {totalPages} · {total} order{total === 1 ? '' : 's'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || isFetching} onClick={() => goToPage(page - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isFetching}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
