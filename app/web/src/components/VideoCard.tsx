import Link from "next/link";

export default function VideoCard({ video }: { video: any }) {
  // poster: optional thumb (if worker generated one)
  const poster = video?.storageBaseUri ? `${video.storageBaseUri}/poster.jpg` : null;

  return (
    <Link href={`/watch/${video.id}`} className="block group">
      <div className="rounded-md overflow-hidden bg-gray-100">
        {poster ? (
          // using simple img for now — you can switch to next/image if remote host allowed
          <img src={poster} alt={video.title} className="w-full h-40 object-cover" />
        ) : (
          <div className="w-full h-40 flex items-center justify-center bg-neutral-200 text-neutral-600">
            {video.status === "ready" ? "No poster" : "Processing"}
          </div>
        )}
      </div>

      <div className="mt-2">
        <h3 className="font-medium">{video.title}</h3>
        <p className="text-sm text-muted-foreground">{video.status}</p>
      </div>
    </Link>
  );
}
