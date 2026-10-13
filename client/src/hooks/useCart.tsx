import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CartItem } from '@/types/cart';
import { addItem, getItemCount, getSubtotal, loadCart, removeItem, saveCart, updateQuantity } from '@/lib/cart';

export interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  replaceCart: (items: CartItem[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCart());

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: getItemCount(items),
      subtotal: getSubtotal(items),
      addToCart: (item) => setItems((prev) => addItem(prev, item)),
      removeFromCart: (productId) => setItems((prev) => removeItem(prev, productId)),
      setQuantity: (productId, quantity) => setItems((prev) => updateQuantity(prev, productId, quantity)),
      clearCart: () => setItems([]),
      replaceCart: (next) => setItems(next),
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
