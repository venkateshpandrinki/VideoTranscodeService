'use client';

import VideoCard from '@/components/VideoCard';
import VideoCardSkeleton from '@/components/VideoCardSkeleton';
import { useVideos } from '@/hooks/useVideos';
import { Video, Upload } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Videotypes } from '@/types/video';

export default function HomePage() {
  const { data: videos, isLoading, isError } = useVideos();

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
              <Video className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Failed to load videos
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              There was an error loading your videos. Please try again.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Your Videos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and watch your transcoded videos
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Videos Grid */}
            {Array.isArray(videos) && videos.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video: Videotypes) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="p-6 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full mb-6">
                  <Video className="w-16 h-16 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  No videos yet
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
                  Get started by uploading your first video. We&apos;ll transcode it and make it
                  ready for streaming.
                </p>
                <Link href="/upload">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Your First Video
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
