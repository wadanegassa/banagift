import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductCardSkeleton } from '@/components/products/ProductCardSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { usePublicSettings } from '@/hooks/useSettings';
import type { ProductWithRelations } from '@/types/models';

const PAGE_SIZE = 12;

export function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: settings } = usePublicSettings();
  const { data: categoriesRes } = useCategories();

  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';
  const sort = (searchParams.get('sort') as 'price_asc' | 'price_desc' | 'newest' | null) ?? 'newest';

  const [searchInput, setSearchInput] = useState(search);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [search, category, sort]);

  const params = useMemo(
    () => ({
      search: search || undefined,
      category: category || undefined,
      sort,
      page,
      limit: PAGE_SIZE,
    }),
    [search, category, sort, page],
  );

  const { data, isLoading, isFetching, isError, refetch } = useProducts(params);

  const [accumulated, setAccumulated] = useState<ProductWithRelations[]>([]);

  useEffect(() => {
    if (!data) return;
    setAccumulated((prev) => (page === 1 ? data.data : [...prev, ...data.data]));
  }, [data, page]);

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    updateParam('search', searchInput.trim());
  }

  const total = data?.meta?.total ?? 0;
  const hasMore = accumulated.length < total;
  const currency = settings?.currency ?? 'ETB';
  const brand = settings?.business_name || 'BanaGifts';

  return (
    <div className="container-prose px-3 py-8 xs:px-4 sm:px-6 sm:py-12">
      <PageMeta title="Gifts" description={`Browse ${brand} gifts — flowers, boxes, chocolates, and more in ETB.`} />

      <div className="flex items-start gap-3 border-b border-border pb-6 sm:pb-8">
        <img src="/logo.png" alt="" className="mt-0.5 h-11 w-11 shrink-0 rounded-sm object-cover sm:h-12 sm:w-12" />
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{brand}</p>
          <h1 className="font-serif text-3xl text-text sm:text-4xl">Gifts</h1>
          <p className="text-sm text-muted">Arranged by hand, organized by occasion. Prices in ETB.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex w-full gap-2 md:max-w-sm">
          <Input
            type="search"
            placeholder="Search gifts…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search gifts"
            className="min-w-0 flex-1"
          />
          <Button type="submit" variant="outline" aria-label="Search" className="shrink-0">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
          <Select
            value={category}
            onChange={(e) => updateParam('category', e.target.value)}
            aria-label="Filter by category"
            className="min-w-0 w-full sm:min-w-[10rem] sm:w-auto"
          >
            <option value="">All categories</option>
            {(categoriesRes?.data ?? []).map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            aria-label="Sort by"
            className="min-w-0 w-full sm:min-w-[9rem] sm:w-auto"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </Select>
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        {isError && accumulated.length === 0 ? (
          <ErrorState message="We couldn't load gifts right now." onRetry={() => refetch()} />
        ) : isLoading && page === 1 ? (
          <div className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : accumulated.length === 0 ? (
          <EmptyState
            title="No gifts match your search"
            description="Try a different search term or clear your filters."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearchInput('');
                  setSearchParams({});
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {accumulated.map((product) => (
                <ProductCard key={product.id} product={product} currency={currency} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-8 flex justify-center sm:mt-10">
                <Button variant="outline" isLoading={isFetching} onClick={() => setPage((p) => p + 1)} className="min-h-11 w-full max-w-xs">
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
