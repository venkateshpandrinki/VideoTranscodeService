// app/watch/[id]/page.tsx
"use client";
import useSWR from "swr";

import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import WatchPage from "./WatchPage";

export default function WatchPageContainer() {
  const { id } = useParams<{ id: string }>();

  const { data, error, isLoading } = useSWR(
    id ? `/api/videos/${id}` : null,
    (url: string) => apiFetch(url)
  );

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading video</p>;
  if (!data) return <p>No video found</p>;

  return <WatchPage video={data} />;
}
