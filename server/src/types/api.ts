// Shared API response envelope types.
//
// Success: { data: T } or { data: T, meta: { page, limit, total } }
// Error:   { error: { code, message, details? } }

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiSuccess<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginationQuery {
  page: number;
  limit: number;
}
