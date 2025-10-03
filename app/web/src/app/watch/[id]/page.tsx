// app/watch/[id]/page.tsx
'use client';
import useSWR from 'swr';

import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

import WatchPage from './WatchPage';
import WatchPageSkeleton from '@/components/WatchPageSkeleton';
export default function WatchPageContainer() {
  const { id } = useParams<{ id: string }>();

  const { data, error, isLoading } = useSWR(id ? `/api/videos/${id}` : null, (url: string) =>
    apiFetch(url)
  );

  if (isLoading) return <WatchPageSkeleton />;
  if (error) return <p>Error loading video</p>;
  if (!data) return <p>No video found</p>;

  return <WatchPage video={data} />;
}
