import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { PageMeta } from '@/components/ui/PageMeta';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { CartLineItem } from '@/components/cart/CartLineItem';
import { CartSummary } from '@/components/cart/CartSummary';
import { useCart } from '@/hooks/useCart';
import { usePublicSettings } from '@/hooks/useSettings';
import { api } from '@/lib/api';

export function Cart() {
  const { items, subtotal, setQuantity, removeFromCart } = useCart();
  const { data: settings } = usePublicSettings();
  const navigate = useNavigate();
  const [unavailableIds, setUnavailableIds] = useState<Set<string>>(new Set());
  const [checking, setChecking] = useState(false);

  const currency = settings?.currency ?? 'ETB';

  useEffect(() => {
    let cancelled = false;
    async function validate() {
      if (items.length === 0) return;
      setChecking(true);
      const unavailable = new Set<string>();
      const adjustments: Array<{ productId: string; quantity: number }> = [];
      await Promise.all(
        items.map(async (item) => {
          try {
            const res = await api.products.get(item.slug);
            const stock = res.data.stock_quantity ?? 0;
            if (!res.data.is_available || stock < 1) {
              unavailable.add(item.productId);
              return;
            }
            if (item.quantity > stock) {
              adjustments.push({ productId: item.productId, quantity: stock });
            }
          } catch {
            unavailable.add(item.productId);
          }
        }),
      );
      if (!cancelled) {
        for (const adj of adjustments) setQuantity(adj.productId, adj.quantity);
        setUnavailableIds(unavailable);
        setChecking(false);
      }
    }
    validate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  async function handleCheckout() {
    navigate('/checkout');
  }

  if (items.length === 0) {
    return (
      <div className="container-prose px-4 py-16 sm:px-6">
        <PageMeta title="Your cart" />
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse our gifts and add something thoughtful."
          action={
            <Link to="/gifts">
              <Button>Browse gifts</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const hasUnavailable = unavailableIds.size > 0;

  const brand = settings?.business_name || 'BanaGifts';

  return (
    <div className="container-prose px-3 py-8 xs:px-4 sm:px-6 sm:py-12">
      <PageMeta title="Your cart" />
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="" className="h-11 w-11 rounded-sm object-cover" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{brand}</p>
          <h1 className="font-serif text-3xl text-text sm:text-4xl">Your cart</h1>
        </div>
      </div>

      <div className="mt-6 grid gap-8 sm:mt-8 sm:gap-10 lg:grid-cols-[1fr_320px]">
        <div className="border border-border bg-white px-3 xs:px-5">
          {items.map((item) => (
            <CartLineItem
              key={item.productId}
              item={item}
              currency={currency}
              onQuantityChange={(qty) => setQuantity(item.productId, qty)}
              onRemove={() => removeFromCart(item.productId)}
              warning={unavailableIds.has(item.productId) ? 'No longer available — remove to continue' : undefined}
            />
          ))}
        </div>

        <div className="space-y-4">
          <CartSummary
            subtotal={subtotal}
            currency={currency}
            note="Delivery fee and final total are confirmed by phone after you place your order."
          />
          <div className="mobile-sticky-actions space-y-3">
            <Button
              fullWidth
              size="lg"
              disabled={hasUnavailable || checking}
              onClick={handleCheckout}
              className="flex min-h-11 items-center justify-center gap-2"
            >
              Proceed to checkout <ArrowRight className="h-4 w-4" />
            </Button>
            {hasUnavailable && (
              <p className="text-xs text-danger">Remove unavailable items before checking out.</p>
            )}
            <Link to="/gifts" className="block text-center text-sm text-muted hover:text-accent">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
