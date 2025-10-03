import { Skeleton } from '@/components/ui/skeleton';

export default function WatchPageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse">
      <Skeleton className="h-7 w-2/3 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-6" />
      <div className="bg-black rounded-lg shadow w-full mb-4" style={{ aspectRatio: '16/9' }}>
        <Skeleton
          className="w-full h-full rounded-lg"
          style={{ aspectRatio: '16/9', minHeight: 240 }}
        />
      </div>
    </div>
  );
}
