import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { queryClient } from '@/lib/queryClient';
import { CartProvider } from '@/hooks/useCart';
import { ToastProvider } from '@/components/ui/Toast';
import { StorefrontLayout } from '@/components/layout/StorefrontLayout';

import { Home } from '@/pages/storefront/Home';
import { Catalog } from '@/pages/storefront/Catalog';
import { ProductDetail } from '@/pages/storefront/ProductDetail';
import { Cart } from '@/pages/storefront/Cart';
import { Checkout } from '@/pages/storefront/Checkout';
import { OrderConfirmation } from '@/pages/storefront/OrderConfirmation';
import { Track } from '@/pages/storefront/Track';
import { MyOrders } from '@/pages/storefront/MyOrders';
import { Contact } from '@/pages/storefront/Contact';
import { NotFound } from '@/pages/storefront/NotFound';

export function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<StorefrontLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/gifts" element={<Catalog />} />
                  <Route path="/gifts/:slug" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order/confirmation" element={<OrderConfirmation />} />
                  <Route path="/orders" element={<MyOrders />} />
                  <Route path="/track" element={<Track />} />
                  <Route path="/track/:token" element={<Track />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </ToastProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
