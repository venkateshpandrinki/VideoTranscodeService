"use client";

import React, { useEffect, useRef } from "react";

interface Video {
  id: string;
  title: string;
  description: string;
  status: string;
  masterPlaylist: string;
}

export default function WatchPage({ video }: { video: Video }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

useEffect(() => {
  let player: any;
  let ui: any;
  let isMounted = true;

  (async () => {
    const shaka = (await import("shaka-player/dist/shaka-player.ui")).default;
      // @ts-ignore
    await import("shaka-player/dist/controls.css");

    const videoEl = videoRef.current;
    const containerEl = containerRef.current;
    if (!videoEl || !containerEl || !video.masterPlaylist) return;

    shaka.polyfill.installAll();

    if (!shaka.Player.isBrowserSupported()) {
      console.error("Shaka Player not supported in this browser");
      return;
    }

    player = new shaka.Player(videoEl);
    ui = new shaka.ui.Overlay(player, containerEl, videoEl);

    player
      .load(video.masterPlaylist)
      .then(() => {
        if (!isMounted) return;

        const controls = ui.getControls();

        if (controls) {
          // Wait for the UI to be updated before configuring
          controls.addEventListener("uiupdated", () => {
            try {
              controls.configure({
                overflowMenuButtons: ["quality", "captions", "playback_rate"],
                controlPanelElements: [
                  "rewind",
                  "fast_forward",
                  "play_pause",
                  "time_and_duration",
                  "mute",
                  "volume",
                  "overflow_menu",
                ],
              });
            } catch (e) {
              console.warn("Shaka controls config error:", e);
            }
          });
        }
      })
      .catch((err: any) => {
        console.error("Shaka load error", err);
      });
  })();

  return () => {
    isMounted = false;
    if (ui) ui.destroy();
    if (player) player.destroy();
  };
}, [video.masterPlaylist]);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">{video.title}</h1>
      <p className="text-gray-600 mb-4">{video.description}</p>

      {/* Shaka container should manage video + controls */}
      <div
        ref={containerRef}
        className="shaka-video-container bg-black rounded-lg shadow w-full"
        style={{ aspectRatio: "16/9" }}
      >
        {/* Don’t add shaka classes here, Shaka will handle */}
        <video ref={videoRef} />
      </div>
    </div>
  );
}
