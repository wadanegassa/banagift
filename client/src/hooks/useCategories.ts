import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => api.categories.list(signal),
    staleTime: 5 * 60_000,
  });
}

export function useCategoryProducts(slug: string | undefined, params: { sort?: string; page?: number } = {}) {
  return useQuery({
    queryKey: ['category-products', slug, params],
    queryFn: ({ signal }) => api.categories.products(slug as string, params, signal),
    enabled: Boolean(slug),
  });
}
