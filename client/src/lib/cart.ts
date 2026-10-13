import type { CartItem } from '@/types/cart';
import type { ProductWithRelations } from '@/types/models';

export const CART_STORAGE_KEY = 'atelier-cart';
export const MAX_ITEM_QUANTITY = 50;

export function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage failures (quota, private mode, etc.)
  }
}

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.productId === 'string' &&
    typeof v.slug === 'string' &&
    typeof v.name === 'string' &&
    typeof v.price === 'number' &&
    typeof v.quantity === 'number'
  );
}

export function productToCartItem(product: ProductWithRelations, quantity = 1): CartItem {
  const primaryImage = [...product.images].sort((a, b) => a.sort_order - b.sort_order)[0];
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    quantity,
    imageUrl: primaryImage?.url ?? null,
    isAvailable: product.is_available,
  };
}

export function addItem(items: CartItem[], item: CartItem): CartItem[] {
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    return items.map((i) =>
      i.productId === item.productId
        ? { ...i, quantity: clampQuantity(i.quantity + item.quantity) }
        : i,
    );
  }
  return [...items, { ...item, quantity: clampQuantity(item.quantity) }];
}

export function removeItem(items: CartItem[], productId: string): CartItem[] {
  return items.filter((i) => i.productId !== productId);
}

export function updateQuantity(items: CartItem[], productId: string, quantity: number): CartItem[] {
  if (quantity <= 0) return removeItem(items, productId);
  return items.map((i) => (i.productId === productId ? { ...i, quantity: clampQuantity(quantity) } : i));
}

export function clampQuantity(quantity: number): number {
  return Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.floor(quantity)));
}

export function getSubtotal(items: CartItem[]): number {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return Math.round(total * 100) / 100;
}

export function getItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
