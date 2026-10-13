import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, ChevronLeft } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProductImage } from '@/components/products/ProductImage';
import { ProductCard } from '@/components/products/ProductCard';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { usePublicSettings } from '@/hooks/useSettings';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/components/ui/Toast';
import { formatMoney } from '@/lib/format';
import { productToCartItem } from '@/lib/cart';

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError, refetch } = useProduct(slug);
  const { data: settings } = usePublicSettings();
  const { addToCart } = useCart();
  const { show } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const currency = settings?.currency ?? 'ETB';
  const product = data?.data;

  const { data: relatedRes } = useProducts(
    { category: product?.category?.slug, limit: 5 },
  );
  const related = (relatedRes?.data ?? []).filter((p) => p.id !== product?.id).slice(0, 4);

  if (isLoading) {
    return (
      <div className="container-prose grid gap-10 px-4 py-12 sm:px-6 md:grid-cols-2">
        <Skeleton className="aspect-[4/5] w-full" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="container-prose px-4 py-16 sm:px-6">
        <ErrorState title="Gift not found" message="This item may have been removed." onRetry={() => refetch()} />
      </div>
    );
  }

  const images = [...product.images].sort((a, b) => a.sort_order - b.sort_order);
  const activeImageData = images[activeImage];

  function handleAddToCart() {
    if (!product) return;
    addToCart(productToCartItem(product, quantity));
    show({ tone: 'success', title: 'Added to cart', description: `${product.name} × ${quantity}` });
  }

  return (
    <div className="container-prose px-3 py-8 xs:px-4 sm:px-6 sm:py-10">
      <PageMeta title={product.name} description={product.description.slice(0, 150)} />

      <Link to="/gifts" className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent">
        <ChevronLeft className="h-4 w-4" /> Back to gifts
      </Link>

      <div className="mt-4 grid gap-8 sm:mt-6 sm:gap-10 md:grid-cols-2">
        <div>
          <div className="aspect-square w-full overflow-hidden border border-border sm:aspect-[4/5]">
            <ProductImage
              src={activeImageData?.url}
              alt={activeImageData?.alt_text || product.name}
              className="h-full w-full"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(idx)}
                  aria-label={`View image ${idx + 1}`}
                  className={`h-14 w-14 shrink-0 overflow-hidden border sm:h-16 sm:w-16 ${
                    idx === activeImage ? 'border-accent' : 'border-border'
                  }`}
                >
                  <ProductImage src={img.url} alt={img.alt_text || product.name} className="h-full w-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category && (
            <Link
              to={`/gifts?category=${product.category.slug}`}
              className="text-xs font-semibold uppercase tracking-wide text-sage hover:text-accent"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="mt-2 font-serif text-3xl text-text sm:text-4xl">{product.name}</h1>
          <p className="mt-3 text-xl font-medium text-accent sm:text-2xl">{formatMoney(product.price, currency)}</p>

          {!product.is_available && (
            <Badge tone="neutral" className="mt-4">
              Currently unavailable
            </Badge>
          )}

          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-muted sm:mt-6 sm:text-base">
            {product.description}
          </p>

          {product.is_available ? (
            <div className="mobile-sticky-actions mt-8">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center border border-border bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="flex h-11 w-11 items-center justify-center hover:bg-surface"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="flex h-11 w-12 items-center justify-center text-sm" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                    aria-label="Increase quantity"
                    className="flex h-11 w-11 items-center justify-center hover:bg-surface"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button size="lg" onClick={handleAddToCart} className="flex min-h-11 flex-1 items-center justify-center gap-2 sm:flex-none">
                  <ShoppingBag className="h-4 w-4" /> Add to cart
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-8 text-sm text-muted">
              This item isn't available right now. Browse similar gifts below, or{' '}
              <Link to="/contact" className="text-accent underline">
                contact us
              </Link>{' '}
              to ask about availability.
            </p>
          )}

          {settings?.policy_text && <p className="mt-8 border-t border-border pt-6 text-xs text-muted">{settings.policy_text}</p>}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12 border-t border-border pt-8 sm:mt-16 sm:pt-10">
          <h2 className="font-serif text-xl text-text sm:text-2xl">You may also like</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 xs:gap-4 sm:mt-6 sm:gap-5 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} currency={currency} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
