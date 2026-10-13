import { Link } from 'react-router-dom';
import { ProductImage } from '@/components/products/ProductImage';
import { Badge } from '@/components/ui/Badge';
import { formatMoney } from '@/lib/format';
import type { ProductWithRelations } from '@/types/models';

export interface ProductCardProps {
  product: ProductWithRelations;
  currency?: string;
}

export function ProductCard({ product, currency = 'ETB' }: ProductCardProps) {
  const primaryImage = [...product.images].sort((a, b) => a.sort_order - b.sort_order)[0];

  return (
    <Link
      to={`/gifts/${product.slug}`}
      className="group flex min-w-0 flex-col border border-border bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden border-b border-border">
        <ProductImage
          src={primaryImage?.url}
          alt={primaryImage?.alt_text || product.name}
          className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {!product.is_available && (
          <div className="absolute left-1.5 top-1.5 xs:left-2 xs:top-2">
            <Badge tone="neutral">Unavailable</Badge>
          </div>
        )}
        {product.is_featured && product.is_available && (
          <div className="absolute left-1.5 top-1.5 xs:left-2 xs:top-2">
            <Badge tone="accent">Featured</Badge>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 px-2.5 py-3 xs:px-4 xs:py-3.5">
        {product.category && (
          <p className="truncate text-[10px] uppercase tracking-wide text-muted xs:text-[11px]">
            {product.category.name}
          </p>
        )}
        <h3 className="font-serif text-base leading-snug text-text xs:text-lg">{product.name}</h3>
        <p className="mt-auto pt-1.5 text-sm font-medium text-accent">
          {formatMoney(product.price, currency)}
        </p>
      </div>
    </Link>
  );
}
