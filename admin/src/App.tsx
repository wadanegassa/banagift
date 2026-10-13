import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/ui/Toast';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Spinner } from '@/components/ui/Spinner';

const AdminLayout = lazy(() =>
  import('@/components/layout/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })));
const Dashboard = lazy(() => import('@/pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Orders = lazy(() => import('@/pages/Orders').then((m) => ({ default: m.Orders })));
const OrderDetail = lazy(() => import('@/pages/OrderDetail').then((m) => ({ default: m.OrderDetail })));
const Products = lazy(() => import('@/pages/Products').then((m) => ({ default: m.Products })));
const ProductNew = lazy(() => import('@/pages/ProductNew').then((m) => ({ default: m.ProductNew })));
const ProductEdit = lazy(() => import('@/pages/ProductEdit').then((m) => ({ default: m.ProductEdit })));
const Categories = lazy(() => import('@/pages/Categories').then((m) => ({ default: m.Categories })));
const Settings = lazy(() => import('@/pages/Settings').then((m) => ({ default: m.Settings })));

export function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<Spinner />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/orders/:id" element={<OrderDetail />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/products/new" element={<ProductNew />} />
                      <Route path="/products/:id/edit" element={<ProductEdit />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/settings" element={<Settings />} />
                    </Route>
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
