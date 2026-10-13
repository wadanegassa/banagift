import { useQuery } from '@tanstack/react-query';
import { api, type ListProductsParams } from '@/lib/api';

export function useProducts(params: ListProductsParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: ({ signal }) => api.products.list(params, signal),
    placeholderData: (prev) => prev,
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: ({ signal }) => api.products.get(slug as string, signal),
    enabled: Boolean(slug),
  });
}
