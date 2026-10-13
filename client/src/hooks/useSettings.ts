import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PublicSettings } from '@/types/models';

export function usePublicSettings() {
  return useQuery({
    queryKey: ['settings', 'public'],
    queryFn: async ({ signal }) => {
      const res = await api.settings.public(signal);
      return res.data as PublicSettings;
    },
    staleTime: 5 * 60_000,
  });
}
