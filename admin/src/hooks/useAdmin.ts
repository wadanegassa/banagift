import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.admin.dashboard(),
  });
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface AdminOrderFilters {
  search?: string;
  status?: string;
  payment_status?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export function useAdminOrders(filters: AdminOrderFilters) {
  return useQuery({
    queryKey: ['admin', 'orders', filters],
    queryFn: () => api.admin.orders.list(filters),
    placeholderData: (prev) => prev,
  });
}

export function useAdminOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'order', id],
    queryFn: () => api.admin.orders.get(id as string),
    enabled: Boolean(id),
  });
}

export function useUpdateOrderStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ status, note }: { status: string; note?: string }) => api.admin.orders.updateStatus(id, status, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useUpdateOrderPayment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: {
      payment_status?: string;
      amount_paid?: number;
      payment_method?: string | null;
      payment_notes?: string | null;
    }) => api.admin.orders.updatePayment(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}

export function useUpdateOrderFulfillment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: {
      supplier_status?: string;
      supplier_contact?: string | null;
      supplier_notes?: string | null;
      delivery_person_name?: string | null;
      delivery_person_phone?: string | null;
      delivery_arrangement_notes?: string | null;
    }) => api.admin.orders.updateFulfillment(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

export function useAddOrderNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteText: string) => api.admin.orders.addNote(id, noteText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'order', id] });
    },
  });
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export interface AdminProductFilters {
  search?: string;
  category?: string;
  featured?: boolean;
  archived?: boolean;
  page?: number;
  limit?: number;
}

export function useAdminProducts(filters: AdminProductFilters) {
  return useQuery({
    queryKey: ['admin', 'products', filters],
    queryFn: () => api.admin.products.list(filters),
    placeholderData: (prev) => prev,
  });
}

export function useAdminProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => api.admin.products.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => api.admin.products.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useUpdateProduct(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Record<string, unknown>) => api.admin.products.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'product', id] });
    },
  });
}

export function useArchiveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.admin.products.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });
}

export function useUploadProductImage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, altText, sortOrder }: { file: File; altText?: string; sortOrder?: number }) =>
      api.admin.products.uploadImage(id, file, altText, sortOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'product', id] });
    },
  });
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.admin.categories.list(),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => api.admin.categories.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Record<string, unknown>) => api.admin.categories.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.admin.categories.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.admin.settings.get(),
  });
}

export function useUpdateAdminSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Record<string, unknown>) => api.admin.settings.update(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'public'] });
    },
  });
}
