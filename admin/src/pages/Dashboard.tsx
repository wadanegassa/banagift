import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge } from '@/components/ui/Badge';
import { useAdminDashboard } from '@/hooks/useAdmin';
import { formatMoney, formatDateTime, formatStatusLabel } from '@/lib/format';
import { orderStatusTone } from '@/components/admin/statusTone';

export function Dashboard() {
  const { data, isLoading, isError, refetch } = useAdminDashboard();
  const summary = data?.data;

  return (
    <div>
      <PageMeta title="Admin Dashboard" noIndex />
      <h1 className="font-serif text-3xl text-text">Dashboard</h1>

      {isError && <ErrorState message="Couldn't load dashboard data." onRetry={() => refetch()} />}

      {isLoading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {summary && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total orders" value={String(summary.totals.orders)} />
            <StatCard label="Orders today" value={String(summary.totals.ordersToday)} />
            <StatCard label="Pending orders" value={String(summary.totals.pendingOrders)} />
            <StatCard label="Revenue (paid)" value={formatMoney(summary.totals.revenue)} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="border border-border bg-white p-5">
              <h2 className="font-serif text-xl text-text">Orders by status</h2>
              <dl className="mt-4 space-y-2 text-sm">
                {Object.entries(summary.statusCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <dt className="text-muted">{formatStatusLabel(status)}</dt>
                    <dd className="font-medium text-text">{count}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="border border-border bg-white p-5">
              <h2 className="font-serif text-xl text-text">Payments by status</h2>
              <dl className="mt-4 space-y-2 text-sm">
                {Object.entries(summary.paymentCounts).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <dt className="text-muted">{formatStatusLabel(status)}</dt>
                    <dd className="font-medium text-text">{count}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="mt-8 border border-border bg-white">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-serif text-xl text-text">Recent orders</h2>
              <Link to="/orders" className="text-sm text-accent hover:underline">
                View all
              </Link>
            </div>
            {summary.recentOrders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">No orders yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                      <th className="px-5 py-3">Reference</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Payment</th>
                      <th className="px-5 py-3">Total</th>
                      <th className="px-5 py-3">Placed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border last:border-b-0 hover:bg-surface/60">
                        <td className="px-5 py-3">
                          <Link to={`/orders/${order.id}`} className="font-medium text-accent hover:underline">
                            {order.order_reference}
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          <Badge tone={orderStatusTone(order.order_status)}>{formatStatusLabel(order.order_status)}</Badge>
                        </td>
                        <td className="px-5 py-3">{formatStatusLabel(order.payment_status)}</td>
                        <td className="px-5 py-3">{formatMoney(order.total, order.currency)}</td>
                        <td className="px-5 py-3 text-muted">{formatDateTime(order.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl text-text">{value}</p>
    </div>
  );
}
