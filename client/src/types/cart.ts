export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  isAvailable: boolean;
  /** Snapshot of remaining units when added/refreshed; caps cart quantity. */
  stockQuantity: number;
}

export interface CartState {
  items: CartItem[];
}
