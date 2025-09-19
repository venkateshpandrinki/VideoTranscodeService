"use client";

import VideoCard from "@/components/VideoCard";
import { useVideos } from "@/hooks/useVideos";


export default function HomePage() {
  const { data: videos, isLoading, isError } = useVideos();

  if (isError) return <div className="text-red-600">Failed to load videos</div>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">All Videos</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-md" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(videos) && videos.length ? (
            videos.map((v: any) => <VideoCard key={v.id} video={v} />)
          ) : (
            <div>No videos yet</div>
          )}
        </div>
      )}
    </div>
  );
}
