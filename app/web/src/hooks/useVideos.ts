import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export function useVideos() {
  return useQuery({
    queryKey: ['videos'],
    queryFn: () => apiFetch('/videos'),
    refetchInterval: 5000, // poll every 5s to update processing -> ready
    staleTime: 5000,
  });
}
