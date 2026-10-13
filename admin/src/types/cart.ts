export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
  isAvailable: boolean;
}

export interface CartState {
  items: CartItem[];
}
