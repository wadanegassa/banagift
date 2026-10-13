import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ProductImage } from '@/components/products/ProductImage';
import { useAdminProducts, useAdminCategories, useArchiveProduct } from '@/hooks/useAdmin';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/lib/format';
import { ApiError } from '@/types/api';

const PAGE_SIZE = 20;

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') ?? '');
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
  const { show } = useToast();

  const page = Number(searchParams.get('page') ?? '1');
  const filters = {
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isError, refetch } = useAdminProducts(filters);
  const { data: categoriesRes } = useAdminCategories();
  const archiveProduct = useArchiveProduct();

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

  async function handleArchive() {
    if (!archiveTarget) return;
    try {
      await archiveProduct.mutateAsync(archiveTarget);
      show({ tone: 'success', title: 'Product archived' });
      setArchiveTarget(null);
    } catch (err) {
      show({ tone: 'error', title: 'Could not archive product', description: err instanceof ApiError ? err.message : undefined });
    }
  }

  const total = data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageMeta title="Products" noIndex />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-text">Products</h1>
        <Link to="/products/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add product
          </Button>
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-3 border border-border bg-white p-4 md:flex-row md:items-center md:justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateParam('search', searchInput.trim());
          }}
          className="flex w-full max-w-sm gap-2"
        >
          <Input
            placeholder="Search products…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search products"
          />
          <Button type="submit" variant="outline" aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <Select
          value={searchParams.get('category') ?? ''}
          onChange={(e) => updateParam('category', e.target.value)}
          aria-label="Filter by category"
          className="min-w-[10rem]"
        >
          <option value="">All categories</option>
          {(categoriesRes?.data ?? []).map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-6 border border-border bg-white">
        {isError ? (
          <div className="p-6">
            <ErrorState message="Couldn't load products." onRetry={() => refetch()} />
          </div>
        ) : isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : (data?.data ?? []).length === 0 ? (
          <div className="p-6">
            <EmptyState title="No products yet" description="Add your first product to get started." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((product) => {
                  const image = [...product.images].sort((a, b) => a.sort_order - b.sort_order)[0];
                  return (
                    <tr key={product.id} className="border-b border-border last:border-b-0 hover:bg-surface/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden border border-border">
                            <ProductImage src={image?.url} alt={product.name} className="h-full w-full" />
                          </div>
                          <Link to={`/products/${product.id}/edit`} className="font-medium text-accent hover:underline">
                            {product.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-5 py-3">{product.category?.name ?? '—'}</td>
                      <td className="px-5 py-3">{formatMoney(product.price)}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          <Badge tone={product.is_available ? 'success' : 'neutral'}>
                            {product.is_available ? 'Available' : 'Unavailable'}
                          </Badge>
                          {product.is_featured && <Badge tone="accent">Featured</Badge>}
                          {product.archived_at && <Badge tone="danger">Archived</Badge>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/products/${product.id}/edit`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                          {!product.archived_at && (
                            <Button variant="ghost" size="sm" onClick={() => setArchiveTarget(product.id)}>
                              Archive
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-muted">
            Page {page} of {totalPages} · {total} product{total === 1 ? '' : 's'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={archiveTarget !== null}
        title="Archive this product?"
        description="Archived products are hidden from the storefront but can be referenced in past orders."
        confirmLabel="Archive"
        tone="danger"
        isLoading={archiveProduct.isPending}
        onConfirm={handleArchive}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
