import { Skeleton } from "@/components/ui/skeleton"

export default function VideoCardSkeleton() {
  return (
    <div className="group">
      <div className="rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
        <Skeleton className="w-full h-48 sm:h-52 lg:h-44 xl:h-48" />
      </div>

      <div className="mt-4 space-y-3">
        <Skeleton className="h-5 w-4/5" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}