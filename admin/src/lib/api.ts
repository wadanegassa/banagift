import type { ApiErrorBody, ApiSuccess } from '@/types/api';
import { ApiError } from '@/types/api';
import type {
  BusinessSettingsMap,
  Category,
  DashboardSummary,
  Order,
  OrderNote,
  OrderWithRelations,
  CreateOrderResponseData,
  ProductImage,
  ProductWithRelations,
  TrackingView,
} from '@/types/models';
import { clearAuthToken, getAccessTokenForRequest } from '@/lib/auth';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  body?: unknown;
  headers?: Record<string, string>;
  /** Pass `false` to omit the admin bearer token even if one is present. */
  withAuth?: boolean;
  signal?: AbortSignal;
}

function buildQuery<T extends object>(params?: T): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiSuccess<T>> {
  const { method = 'GET', body, headers = {}, withAuth = true, signal } = options;

  const finalHeaders: Record<string, string> = { ...headers };
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isFormData) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  if (withAuth) {
    const token = await getAccessTokenForRequest();
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      signal,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Unable to reach the server. Check your connection and try again.');
  }

  if (response.status === 204) {
    return { data: undefined as T };
  }

  let parsed: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    // Stale admin session — clear mirror and notify AuthProvider to redirect to login.
    if (response.status === 401 && withAuth) {
      clearAuthToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('atelier:admin-unauthorized'));
      }
    }
    const errBody = parsed as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      errBody?.error?.code ?? 'UNKNOWN_ERROR',
      errBody?.error?.message ?? `Request failed with status ${response.status}`,
      errBody?.error?.details,
    );
  }

  return (parsed as ApiSuccess<T>) ?? { data: undefined as T };
}

// ---------------------------------------------------------------------------
// Public: products / categories / settings / orders
// ---------------------------------------------------------------------------

export interface ListProductsParams {
  search?: string;
  category?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  featured?: boolean;
  page?: number;
  limit?: number;
}

export const api = {
  health: () => request<{ status: string }>('/health', { withAuth: false }),

  products: {
    list: (params: ListProductsParams = {}, signal?: AbortSignal) =>
      request<ProductWithRelations[]>(`/products${buildQuery(params)}`, { withAuth: false, signal }),
    get: (slug: string, signal?: AbortSignal) =>
      request<ProductWithRelations>(`/products/${encodeURIComponent(slug)}`, { withAuth: false, signal }),
  },

  categories: {
    list: (signal?: AbortSignal) => request<Category[]>('/categories', { withAuth: false, signal }),
    products: (slug: string, params: { sort?: string; page?: number; limit?: number } = {}, signal?: AbortSignal) =>
      request<ProductWithRelations[]>(`/categories/${encodeURIComponent(slug)}/products${buildQuery(params)}`, {
        withAuth: false,
        signal,
      }),
  },

  settings: {
    public: (signal?: AbortSignal) => request<BusinessSettingsMap>('/settings/public', { withAuth: false, signal }),
  },

  orders: {
    create: (input: Record<string, unknown>, idempotencyKey: string) =>
      request<CreateOrderResponseData>('/orders', {
        method: 'POST',
        body: input,
        withAuth: false,
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
    track: (token: string) => request<TrackingView>(`/orders/track/${encodeURIComponent(token)}`, { withAuth: false }),
  },

  admin: {
    dashboard: () => request<DashboardSummary>('/admin/dashboard'),

    orders: {
      list: (
        params: {
          search?: string;
          status?: string;
          payment_status?: string;
          date_from?: string;
          date_to?: string;
          page?: number;
          limit?: number;
        } = {},
      ) => request<Order[]>(`/admin/orders${buildQuery(params)}`),
      get: (id: string) => request<OrderWithRelations>(`/admin/orders/${id}`),
      updateStatus: (id: string, status: string, note?: string) =>
        request<Order>(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status, note } }),
      updatePayment: (
        id: string,
        patch: { payment_status?: string; amount_paid?: number; payment_method?: string | null; payment_notes?: string | null },
      ) => request<Order>(`/admin/orders/${id}/payment`, { method: 'PATCH', body: patch }),
      updateFulfillment: (
        id: string,
        patch: {
          supplier_status?: string;
          supplier_contact?: string | null;
          supplier_notes?: string | null;
          delivery_person_name?: string | null;
          delivery_person_phone?: string | null;
          delivery_arrangement_notes?: string | null;
        },
      ) => request<Order>(`/admin/orders/${id}/fulfillment`, { method: 'PATCH', body: patch }),
      addNote: (id: string, noteText: string) =>
        request<OrderNote>(`/admin/orders/${id}/notes`, { method: 'POST', body: { note_text: noteText } }),
    },

    products: {
      list: (
        params: { search?: string; category?: string; featured?: boolean; archived?: boolean; page?: number; limit?: number } = {},
      ) => request<ProductWithRelations[]>(`/admin/products${buildQuery(params)}`),
      get: (id: string) => request<ProductWithRelations>(`/admin/products/${id}`),
      create: (input: Record<string, unknown>) =>
        request<ProductWithRelations>('/admin/products', { method: 'POST', body: input }),
      update: (id: string, patch: Record<string, unknown>) =>
        request<ProductWithRelations>(`/admin/products/${id}`, { method: 'PATCH', body: patch }),
      archive: (id: string) => request<void>(`/admin/products/${id}`, { method: 'DELETE' }),
      uploadImage: (id: string, file: File, altText?: string, sortOrder?: number) => {
        const form = new FormData();
        form.append('image', file);
        if (altText) form.append('alt_text', altText);
        if (sortOrder !== undefined) form.append('sort_order', String(sortOrder));
        return request<ProductImage>(`/admin/products/${id}/images`, { method: 'POST', body: form });
      },
    },

    categories: {
      list: () => request<Category[]>('/admin/categories'),
      get: (id: string) => request<Category>(`/admin/categories/${id}`),
      create: (input: Record<string, unknown>) =>
        request<Category>('/admin/categories', { method: 'POST', body: input }),
      update: (id: string, patch: Record<string, unknown>) =>
        request<Category>(`/admin/categories/${id}`, { method: 'PATCH', body: patch }),
      remove: (id: string) => request<void>(`/admin/categories/${id}`, { method: 'DELETE' }),
    },

    settings: {
      get: () => request<BusinessSettingsMap>('/admin/settings'),
      update: (patch: Record<string, unknown>) =>
        request<BusinessSettingsMap>('/admin/settings', { method: 'PATCH', body: patch }),
    },
  },
};
