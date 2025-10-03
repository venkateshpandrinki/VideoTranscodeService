'use client';

import React, { useEffect, useRef } from 'react';

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
    let player: shaka.Player | null = null;
    let ui: shaka.ui.Overlay | null = null;
    let isMounted = true;

    (async () => {
      const shaka = (await import('shaka-player/dist/shaka-player.ui')).default;
      // @ts-expect-error: No type declarations for css import
      await import('shaka-player/dist/controls.css');

      const videoEl = videoRef.current;
      const containerEl = containerRef.current;
      if (!videoEl || !containerEl || !video.masterPlaylist) return;

      shaka.polyfill.installAll();

      if (!shaka.Player.isBrowserSupported()) {
        console.error('Shaka Player not supported in this browser');
        return;
      }

      player = new shaka.Player(videoEl);
      ui = new shaka.ui.Overlay(player, containerEl, videoEl);

      if (player) {
        player
          .load(video.masterPlaylist)
          .then(() => {
            if (!isMounted) return;

            const controls = ui!.getControls();

            if (controls) {
              controls.addEventListener('uiupdated', () => {
                try {
                  controls.configure({
                    overflowMenuButtons: ['quality', 'captions', 'playback_rate'],
                    controlPanelElements: [
                      'rewind',
                      'fast_forward',
                      'play_pause',
                      'time_and_duration',
                      'mute',
                      'volume',
                      'overflow_menu',
                    ],
                    adStatisticsList: [],
                    addBigPlayButton: false,
                    addSeekBar: false,
                    alwaysShowVolumeBar: false,
                    castAndroidReceiverCompatible: false,
                    castReceiverAppId: '',
                    castSenderUrl: '',
                    clearBufferOnQualityChange: false,
                    closeMenusDelay: 0,
                    contextMenuElements: [],
                    customContextMenu: false,
                    defaultVrProjectionMode: '',
                    displayInVrMode: false,
                    doubleClickForFullscreen: false,
                    enableFullscreenOnRotation: false,
                    enableKeyboardPlaybackControls: false,
                    enableKeyboardPlaybackControlsInWindow: false,
                    enableTooltips: false,
                    fadeDelay: 0,
                    fastForwardRates: [],
                    forceLandscapeOnFullscreen: false,
                    fullScreenElement: null,
                    keyboardLargeSeekDistance: 0,
                    keyboardSeekDistance: 0,
                    playbackRates: [],
                    preferDocumentPictureInPicture: false,
                    preferVideoFullScreenInVisionOS: false,
                    qualityMarks: {
                      1080: '',
                      1440: '',
                      2160: '',
                      4320: '',
                      720: '',
                    },
                    refreshTickInSeconds: 0,
                    rewindRates: [],
                    seekBarColors: {
                      adBreaks: '',
                      base: '',
                      buffered: '',
                      played: '',
                    },
                    seekOnTaps: false,
                    setupMediaSession: false,
                    showAudioChannelCountVariants: false,
                    showAudioCodec: false,
                    showUnbufferedStart: false,
                    showVideoCodec: false,
                    singleClickForPlayAndPause: false,
                    statisticsList: [],
                    tapSeekDistance: 0,
                    textTrackLabelFormat: shaka.ui.Overlay.TrackLabelFormat.LABEL,
                    trackLabelFormat: shaka.ui.Overlay.TrackLabelFormat.LABEL,
                    volumeBarColors: {
                      base: '',
                      level: '',
                    },
                  });
                } catch (e) {
                  console.warn('Shaka controls config error:', e);
                }
              });
            }
          })
          .catch((err: shaka.util.Error) => {
            console.error('Shaka load error', err);
          });
      }
    })();

    return () => {
      isMounted = false;
      if (ui) ui.destroy();
      if (player) player.destroy();
    };
  }, [video.masterPlaylist]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 leading-tight line-clamp-2">
          {video.title}
        </h1>
        <p className="text-base text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
          {video.description}
        </p>
      </div>

      <div
        ref={containerRef}
        className="shaka-video-container bg-black/95 rounded-2xl shadow-2xl w-full overflow-hidden border border-gray-200 dark:border-gray-700 mb-8"
        style={{ aspectRatio: '16/9', minHeight: 240 }}
      >
        <video ref={videoRef} className="w-full h-full" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium">
            {video.status === 'ready'
              ? 'Ready to Watch'
              : video.status.charAt(0).toUpperCase() + video.status.slice(1)}
          </span>
          <span className="hidden sm:inline">•</span>
          <span>
            Video ID: <span className="font-mono text-xs text-gray-400">{video.id}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
