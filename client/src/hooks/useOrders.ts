import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useCreateOrder() {
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: Record<string, unknown>; idempotencyKey: string }) =>
      api.orders.create(input, idempotencyKey),
  });
}

export function useTrackOrder(token: string | undefined) {
  return useQuery({
    queryKey: ['track-order', token],
    queryFn: () => api.orders.track(token as string),
    enabled: Boolean(token),
    retry: false,
  });
}
