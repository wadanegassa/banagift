import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { CartProvider } from '@/hooks/useCart';
import { CART_STORAGE_KEY } from '@/lib/cart';
import type { CartItem } from '@/types/cart';

function renderNavbar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CartProvider>
          <Navbar />
        </CartProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const sampleItem: CartItem = {
  productId: 'p1',
  slug: 'garden-rose-bouquet',
  name: 'Garden Rose Bouquet',
  price: 68,
  quantity: 3,
  imageUrl: null,
  isAvailable: true,
};

describe('Navbar', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ data: {} }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('shows the brand name and primary navigation links', () => {
    renderNavbar();
    expect(screen.getByText('BanaGifts')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gifts' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Track' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
  });

  it('does not show a cart badge when the cart is empty', () => {
    renderNavbar();
    expect(screen.getByLabelText('Cart, 0 items')).toBeInTheDocument();
  });

  it('shows the item count badge when the cart has items', () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([sampleItem]));
    renderNavbar();
    expect(screen.getByLabelText('Cart, 3 items')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
