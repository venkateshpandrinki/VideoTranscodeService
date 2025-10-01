import Link from "next/link";
import { Play, Clock, CheckCircle, Loader2 } from "lucide-react";

export default function VideoCard({ video }: { video: any }) {
  // poster: optional thumb (if worker generated one)
  const poster = video?.storageBaseUri ? `${video.storageBaseUri}/thumb.jpg` : null;

  const getStatusIcon = () => {
    switch (video.status) {
      case "ready":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (video.status) {
      case "ready":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30";
      case "processing":
        return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30";
      default:
        return "text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950/30";
    }
  };

  return (
    <Link href={`/watch/${video.id}`} className="block group">
      <div className="rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="relative">
          {poster ? (
            <div className="relative">
              <img 
                src={poster} 
                alt={video.title} 
                className="w-full h-48 sm:h-52 lg:h-44 xl:h-48 object-cover transition-transform duration-300 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-48 sm:h-52 lg:h-44 xl:h-48 flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-gray-600 dark:text-gray-400">
              <div className="text-center">
                <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-full mx-auto mb-2">
                  {video.status === "ready" ? (
                    <Play className="w-8 h-8" />
                  ) : (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  )}
                </div>
                <p className="text-sm font-medium">
                  {video.status === "ready" ? "No poster" : "Processing"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200 line-clamp-2">
            {video.title}
          </h3>
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {getStatusIcon()}
              {video.status}
            </span>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(video.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
