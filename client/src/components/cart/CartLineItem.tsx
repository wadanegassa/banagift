import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { ProductImage } from '@/components/products/ProductImage';
import { formatMoney } from '@/lib/format';
import type { CartItem } from '@/types/cart';

export interface CartLineItemProps {
  item: CartItem;
  currency?: string;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  warning?: string;
}

export function CartLineItem({ item, currency = 'ETB', onQuantityChange, onRemove, warning }: CartLineItemProps) {
  return (
    <div className="flex gap-3 border-b border-border py-4 last:border-b-0 xs:gap-4 xs:py-5">
      <Link to={`/gifts/${item.slug}`} className="h-20 w-16 shrink-0 overflow-hidden border border-border xs:h-24 xs:w-20">
        <ProductImage src={item.imageUrl} alt={item.name} className="h-full w-full" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={`/gifts/${item.slug}`} className="block truncate font-serif text-base text-text hover:text-accent xs:text-lg">
              {item.name}
            </Link>
            <p className="mt-0.5 text-sm text-muted">{formatMoney(item.price, currency)} each</p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${item.name} from cart`}
            className="flex h-9 w-9 shrink-0 items-center justify-center text-muted hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {warning && <p className="mt-1 text-xs text-danger">{warning}</p>}

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div className="flex items-center border border-border">
            <button
              type="button"
              onClick={() => onQuantityChange(item.quantity - 1)}
              aria-label="Decrease quantity"
              className="flex h-9 w-9 items-center justify-center text-text hover:bg-surface disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="flex h-9 w-8 items-center justify-center text-sm" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantityChange(item.quantity + 1)}
              aria-label="Increase quantity"
              className="flex h-9 w-9 items-center justify-center text-text hover:bg-surface"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="font-medium text-text">{formatMoney(item.price * item.quantity, currency)}</p>
        </div>
      </div>
    </div>
  );
}
