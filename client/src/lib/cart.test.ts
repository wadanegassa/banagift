import { describe, expect, it, beforeEach } from 'vitest';
import {
  addItem,
  clampQuantity,
  getItemCount,
  getSubtotal,
  loadCart,
  productToCartItem,
  removeItem,
  saveCart,
  updateQuantity,
  CART_STORAGE_KEY,
} from '@/lib/cart';
import type { CartItem } from '@/types/cart';
import type { ProductWithRelations } from '@/types/models';

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: 'p1',
    slug: 'garden-rose-bouquet',
    name: 'Garden Rose Bouquet',
    price: 68,
    quantity: 1,
    imageUrl: null,
    isAvailable: true,
    stockQuantity: 50,
    ...overrides,
  };
}

describe('addItem', () => {
  it('adds a new item to an empty cart', () => {
    const result = addItem([], makeItem());
    expect(result).toHaveLength(1);
    expect(result[0]?.quantity).toBe(1);
  });

  it('merges quantities when the product already exists in the cart', () => {
    const existing = [makeItem({ quantity: 2 })];
    const result = addItem(existing, makeItem({ quantity: 3 }));
    expect(result).toHaveLength(1);
    expect(result[0]?.quantity).toBe(5);
  });

  it('keeps separate line items for different products', () => {
    const existing = [makeItem()];
    const result = addItem(existing, makeItem({ productId: 'p2', slug: 'other', name: 'Other' }));
    expect(result).toHaveLength(2);
  });
});

describe('removeItem', () => {
  it('removes the matching product from the cart', () => {
    const items = [makeItem(), makeItem({ productId: 'p2' })];
    const result = removeItem(items, 'p1');
    expect(result).toHaveLength(1);
    expect(result[0]?.productId).toBe('p2');
  });
});

describe('updateQuantity', () => {
  it('updates the quantity for a matching item', () => {
    const items = [makeItem({ quantity: 1 })];
    const result = updateQuantity(items, 'p1', 4);
    expect(result[0]?.quantity).toBe(4);
  });

  it('removes the item when quantity drops to zero or below', () => {
    const items = [makeItem()];
    const result = updateQuantity(items, 'p1', 0);
    expect(result).toHaveLength(0);
  });
});

describe('clampQuantity', () => {
  it('floors fractional quantities', () => {
    expect(clampQuantity(2.9)).toBe(2);
  });

  it('never returns less than 1', () => {
    expect(clampQuantity(-5)).toBe(1);
  });

  it('never exceeds the maximum', () => {
    expect(clampQuantity(500)).toBe(50);
  });
});

describe('getSubtotal / getItemCount', () => {
  it('computes the correct subtotal across multiple items', () => {
    const items = [makeItem({ price: 68, quantity: 2 }), makeItem({ productId: 'p2', price: 36, quantity: 1 })];
    expect(getSubtotal(items)).toBe(172);
  });

  it('computes the total item count', () => {
    const items = [makeItem({ quantity: 2 }), makeItem({ productId: 'p2', quantity: 3 })];
    expect(getItemCount(items)).toBe(5);
  });

  it('returns zero for an empty cart', () => {
    expect(getSubtotal([])).toBe(0);
    expect(getItemCount([])).toBe(0);
  });
});

describe('productToCartItem', () => {
  it('maps a product to a cart item using the lowest sort-order image', () => {
    const product: ProductWithRelations = {
      id: 'p1',
      category_id: null,
      name: 'Garden Rose Bouquet',
      slug: 'garden-rose-bouquet',
      description: 'desc',
      price: 68,
      stock_quantity: 12,
      is_available: true,
      is_featured: true,
      archived_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      category: null,
      images: [
        { id: 'i2', product_id: 'p1', storage_path: 'x', url: '/two.jpg', alt_text: null, sort_order: 1, created_at: '' },
        { id: 'i1', product_id: 'p1', storage_path: 'x', url: '/one.jpg', alt_text: null, sort_order: 0, created_at: '' },
      ],
    };
    const item = productToCartItem(product, 2);
    expect(item.imageUrl).toBe('/one.jpg');
    expect(item.quantity).toBe(2);
    expect(item.productId).toBe('p1');
  });
});

describe('loadCart / saveCart', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips cart items through localStorage', () => {
    const items = [makeItem()];
    saveCart(items);
    const loaded = loadCart();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.productId).toBe('p1');
  });

  it('returns an empty array when storage is empty', () => {
    expect(loadCart()).toEqual([]);
  });

  it('returns an empty array when storage contains invalid JSON', () => {
    localStorage.setItem(CART_STORAGE_KEY, 'not-json');
    expect(loadCart()).toEqual([]);
  });
});
