import type { ApiErrorBody, ApiSuccess } from '@/types/api';
import { ApiError } from '@/types/api';
import type {
  BusinessSettingsMap,
  Category,
  CreateOrderResponseData,
  CustomerOrderSummary,
  ProductWithRelations,
  TrackingView,
} from '@/types/models';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '/api';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  body?: unknown;
  headers?: Record<string, string>;
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
  const { method = 'GET', body, headers = {}, signal } = options;

  const finalHeaders: Record<string, string> = { ...headers };
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isFormData) {
    finalHeaders['Content-Type'] = 'application/json';
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

export interface ListProductsParams {
  search?: string;
  category?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  featured?: boolean;
  page?: number;
  limit?: number;
}

export const api = {
  health: () => request<{ status: string }>('/health'),

  products: {
    list: (params: ListProductsParams = {}, signal?: AbortSignal) =>
      request<ProductWithRelations[]>(`/products${buildQuery(params)}`, { signal }),
    get: (slug: string, signal?: AbortSignal) =>
      request<ProductWithRelations>(`/products/${encodeURIComponent(slug)}`, { signal }),
  },

  categories: {
    list: (signal?: AbortSignal) => request<Category[]>('/categories', { signal }),
    products: (slug: string, params: { sort?: string; page?: number; limit?: number } = {}, signal?: AbortSignal) =>
      request<ProductWithRelations[]>(`/categories/${encodeURIComponent(slug)}/products${buildQuery(params)}`, {
        signal,
      }),
  },

  settings: {
    public: (signal?: AbortSignal) => request<BusinessSettingsMap>('/settings/public', { signal }),
  },

  orders: {
    create: (input: Record<string, unknown>, idempotencyKey: string) =>
      request<CreateOrderResponseData>('/orders', {
        method: 'POST',
        body: input,
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
    track: (token: string) => request<TrackingView>(`/orders/track/${encodeURIComponent(token)}`),
    my: (phone: string) =>
      request<CustomerOrderSummary[]>('/orders/my', { method: 'POST', body: { phone } }),
    myDetail: (phone: string, orderReference: string) =>
      request<TrackingView>('/orders/my/detail', {
        method: 'POST',
        body: { phone, order_reference: orderReference },
      }),
  },
};
