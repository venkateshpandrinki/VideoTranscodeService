// app/watch/[id]/WatchPage.tsx
"use client";

import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

interface Video {
  id: string;
  title: string;
  description: string;
  status: string;
  masterPlaylist: string;
}

export default function WatchPage({ video }: { video: Video }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !video.masterPlaylist) return;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(video.masterPlaylist);
      hls.attachMedia(videoEl);

      return () => {
        hls.destroy();
      };
    } else if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
      videoEl.src = video.masterPlaylist;
    }
  }, [video.masterPlaylist]);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">{video.title}</h1>
      <p className="text-gray-600 mb-4">{video.description}</p>

      <video
        ref={videoRef}
        controls
        className="w-full bg-black rounded-lg shadow"
        style={{ aspectRatio: "16/9" }}
      />
    </div>
  );
}
