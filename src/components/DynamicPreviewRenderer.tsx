import React, { useEffect, useRef, useState } from 'react';
import { PreviewBlock, PreviewPlayer } from '../types';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

let ytApiLoading = false;
let ytApiReady = false;
const ytReadyCallbacks: (() => void)[] = [];

const loadYouTubeAPI = (callback: () => void) => {
  if (window.YT && window.YT.Player) {
    callback();
    return;
  }
  ytReadyCallbacks.push(callback);

  if (ytApiLoading) return;
  ytApiLoading = true;

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  tag.async = true;
  const firstScriptTag = document.getElementsByTagName('script')[0];
  if (firstScriptTag && firstScriptTag.parentNode) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  } else {
    document.head.appendChild(tag);
  }

  window.onYouTubeIframeAPIReady = () => {
    ytApiReady = true;
    ytReadyCallbacks.forEach((cb) => cb());
  };
};

export const YouTubePlayer: React.FC<{ videoId: string; aspectRatio?: string }> = ({
  videoId,
  aspectRatio = '16:9',
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // IntersectionObserver: unmount or avoid loading heavy YT embed when outside viewport
  const isVisible = useIntersectionObserver(wrapperRef, {
    rootMargin: '200px',
    freezeOnceVisible: false,
  });

  // Cleanup/mount YT player dynamically based on viewport visibility
  useEffect(() => {
    let isMounted = true;

    if (!isVisible) {
      // Pause and clean player when scrolled far away to free mobile GPU/RAM
      if (playerRef.current) {
        try {
          playerRef.current.pauseVideo();
        } catch {}
      }
      setIsPlaying(false);
      return;
    }

    // Only inject heavy YT frame if visible and (ready or user interacted)
    loadYouTubeAPI(() => {
      if (!isMounted || !containerRef.current) return;

      if (!playerRef.current) {
        const el = document.createElement('div');
        el.style.width = '100%';
        el.style.height = '100%';
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(el);

        playerRef.current = new window.YT.Player(el, {
          videoId: videoId,
          playerVars: {
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            disablekb: 1,
            playsinline: 1,
            fs: 0,
            iv_load_policy: 3,
            autoplay: hasInteracted ? 1 : 0,
          },
          events: {
            onReady: () => {
              if (isMounted) setIsReady(true);
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              if (event.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
              else if (event.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
              else if (event.data === window.YT.PlayerState.ENDED) setIsPlaying(false);
            },
          },
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isVisible, videoId, hasInteracted]);

  const togglePlay = () => {
    setHasInteracted(true);
    if (!playerRef.current || !isReady) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const containerClass =
    aspectRatio === '9:16'
      ? 'w-[280px] sm:w-[320px] max-w-full mx-auto aspect-[9/16] rounded-2xl overflow-hidden bg-[#111827] shadow-sm relative my-3 shrink-0 border border-slate-800'
      : 'w-full aspect-[16/9] rounded-2xl overflow-hidden bg-[#111827] shadow-sm relative my-3 shrink-0 border border-slate-800';

  const ytThumbUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div ref={wrapperRef} className={containerClass} style={{ contain: 'paint layout' }}>
      {isVisible ? (
        <>
          {/* CSS Overflow Masking: Inner Video Box to hide top YouTube bar, avatar and controls */}
          <div className="w-[110%] h-[120%] -top-[10%] -left-[5%] absolute pointer-events-auto bg-black">
            <div ref={containerRef} className="w-full h-full" />
          </div>

          {/* Interactive click overlay */}
          <div
            className="absolute inset-0 cursor-pointer z-10 flex items-center justify-center group bg-transparent"
            onClick={togglePlay}
          >
            {!isPlaying && (
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#111827]/90 flex items-center justify-center text-white border border-white/20 shadow-md transition-transform group-hover:scale-105 ${
                  !isReady ? 'opacity-70 animate-pulse' : 'opacity-100'
                }`}
              >
                <svg className="w-7 h-7 ml-0.5 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Lightweight Poster Card when off-screen */
        <div className="w-full h-full relative flex items-center justify-center bg-slate-900">
          <img
            src={ytThumbUrl}
            alt="YouTube Video Poster"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute w-12 h-12 rounded-full bg-[#111827] border border-white/20 flex items-center justify-center text-white shadow-sm">
            <svg className="w-6 h-6 ml-0.5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds) || !isFinite(timeInSeconds)) return '0:00';
  const m = Math.floor(timeInSeconds / 60);
  const s = Math.floor(timeInSeconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export const CustomVideoPlayer: React.FC<{ url: string; aspectRatio?: string }> = ({
  url,
  aspectRatio = '16:9',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const isVisible = useIntersectionObserver(containerRef, {
    rootMargin: '200px',
    freezeOnceVisible: false,
  });

  // Pause off-screen video automatically to preserve mobile battery & GPU
  useEffect(() => {
    if (!isVisible && videoRef.current && isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isVisible, isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const containerClass =
    aspectRatio === '9:16'
      ? 'w-[280px] sm:w-[320px] max-w-full mx-auto aspect-[9/16] rounded-2xl overflow-hidden bg-[#111827] shadow-sm relative my-3 shrink-0 group select-none border border-slate-800'
      : 'w-full aspect-[16/9] rounded-2xl overflow-hidden bg-[#111827] shadow-sm relative my-3 shrink-0 group select-none border border-slate-800';

  return (
    <div
      ref={containerRef}
      className={containerClass}
      style={{ contain: 'paint layout' }}
      onMouseMove={handleUserActivity}
      onTouchStart={handleUserActivity}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {isVisible ? (
        <video
          ref={videoRef}
          src={url}
          className="w-full h-full object-contain absolute inset-0 cursor-pointer"
          playsInline
          preload="none"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-900">
          <div className="w-12 h-12 rounded-full bg-[#111827] border border-white/20 flex items-center justify-center text-white shadow-sm">
            <svg className="w-6 h-6 ml-0.5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Play State Center Icon */}
      {isVisible && !isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/25"
          onClick={togglePlay}
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#111827]/90 flex items-center justify-center text-white border border-white/20 shadow-md pointer-events-auto cursor-pointer transition-transform hover:scale-105">
            <svg className="w-7 h-7 ml-0.5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Main Controls Wrapper */}
      {isVisible && (
        <div
          className={`absolute inset-x-0 bottom-0 p-2 sm:p-3 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col gap-1.5 z-20 pointer-events-auto select-none transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0 sm:group-hover:opacity-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Timeline Seek Bar */}
          <div className="w-full px-1 flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCurrentTime(val);
                if (videoRef.current) videoRef.current.currentTime = val;
              }}
              className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white hover:h-1.5 transition-all"
              style={{
                background: `linear-gradient(to right, white ${
                  (currentTime / (duration || 1)) * 100
                }%, rgba(255,255,255,0.3) ${(currentTime / (duration || 1)) * 100}%)`,
              }}
            />
          </div>

          {/* Controls Row */}
          <div className="w-full flex items-center justify-between gap-1 sm:gap-2">
            {/* Left Group */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/20 text-white flex items-center justify-center hover:bg-white/30 active:scale-95 transition shrink-0 cursor-pointer"
              >
                {isPlaying ? (
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <div className="bg-[#111827] border border-white/10 text-white text-[10px] sm:text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1 shrink-0">
                <span>{formatTime(currentTime)}</span>
                <span className="text-white/40">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Group */}
            <div className="bg-[#111827] border border-white/10 text-white text-[10px] sm:text-xs px-2 py-1 rounded-lg flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="hover:text-white/80 transition-colors cursor-pointer"
                onClick={() => {
                  if (videoRef.current) videoRef.current.muted = !videoRef.current.muted;
                }}
              >
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.536 8.464a5 5 0 010 7.072M12 6v12l-4-4H4V10h4l4-4z"
                  />
                </svg>
              </button>

              <button
                type="button"
                className="hover:text-white/80 transition-colors cursor-pointer"
                onClick={() => {
                  if (videoRef.current && videoRef.current.requestFullscreen) {
                    videoRef.current.requestFullscreen();
                  }
                }}
              >
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0 0l-5-5m-7 11v4m0 0H4m0 0l5-5m11 5h-4m4 0v-4m0 0l-5 5"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const LazyIframePlayer: React.FC<{
  src: string;
  aspectRatio?: string;
  title?: string;
}> = ({ src, aspectRatio = '16:9', title = 'Preview Frame' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const isVisible = useIntersectionObserver(containerRef, {
    rootMargin: '200px',
    freezeOnceVisible: false,
  });

  const containerClass =
    aspectRatio === '9:16'
      ? 'w-[280px] sm:w-[320px] max-w-full mx-auto aspect-[9/16] rounded-2xl overflow-hidden bg-[#111827] shadow-sm relative my-3 border border-slate-800 shrink-0'
      : 'w-full aspect-video rounded-2xl overflow-hidden bg-[#111827] shadow-sm relative my-3 border border-slate-800 shrink-0';

  return (
    <div ref={containerRef} className={containerClass} style={{ contain: 'paint layout' }}>
      {isVisible ? (
        hasStarted ? (
          <iframe
            src={src}
            title={title}
            loading="lazy"
            className="w-full h-full border-0 absolute inset-0"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        ) : (
          <div
            onClick={() => setHasStarted(true)}
            className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-slate-900 group"
          >
            <div className="w-14 h-14 rounded-full bg-[#111827] border border-white/20 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition">
              <svg className="w-7 h-7 ml-0.5 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-[11px] font-bold text-slate-300 mt-2">Click to Load Preview</span>
          </div>
        )
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-900">
          <div className="w-12 h-12 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center text-slate-500">
            <svg className="w-6 h-6 ml-0.5 fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdBlockRenderer: React.FC<{ code: string }> = ({ code }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(wrapperRef, {
    rootMargin: '200px',
    freezeOnceVisible: true,
  });

  useEffect(() => {
    if (!isVisible || !containerRef.current || !code || code.trim().length === 0) return;

    let timeoutId: any;
    let idleId: any;

    const executeInjection = () => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = '';

      const wrapper = document.createElement('div');
      wrapper.innerHTML = code;

      // Extract all scripts and recreate them deferred so browser executes without blocking main thread
      const scripts = wrapper.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.async = true;
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });

      containerRef.current.appendChild(wrapper);
    };

    // Async deferred execution via requestIdleCallback / setTimeout
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = (window as any).requestIdleCallback(executeInjection, { timeout: 1500 });
    } else {
      timeoutId = setTimeout(executeInjection, 200);
    }

    return () => {
      if (idleId && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        (window as any).cancelIdleCallback(idleId);
      }
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isVisible, code]);

  if (!code || code.trim().length === 0) return null;

  return (
    <div ref={wrapperRef} className="w-full my-3 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm overflow-hidden flex flex-col items-center justify-center">
        <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2 self-start px-1">
          Sponsored / Advertisement
        </div>
        {/* Fixed min-height to prevent Cumulative Layout Shifts (CLS) */}
        <div
          ref={containerRef}
          className="w-full flex justify-center items-center overflow-x-auto min-h-[100px]"
        />
      </div>
    </div>
  );
};

const isDirectVideo = (url: string) => {
  const cleanUrl = url.trim();
  return (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.includes('.mp4?') ||
    cleanUrl.includes('.webm?')
  );
};

export interface DynamicPreviewRendererProps {
  previewBlocks?: PreviewBlock[];
  previewPlayers?: PreviewPlayer[];
  videoUrl?: string;
}

export const DynamicPreviewRenderer: React.FC<DynamicPreviewRendererProps> = ({
  previewBlocks,
  previewPlayers,
  videoUrl,
}) => {
  // 1. Build resolved sequence of blocks
  let blocks: PreviewBlock[] = [];

  if (previewBlocks && previewBlocks.length > 0) {
    blocks = previewBlocks.filter((b) => b && b.enabled);
  } else if (previewPlayers && previewPlayers.length > 0) {
    blocks = previewPlayers
      .filter((p) => p && p.enabled && p.url && p.url.trim().length > 0)
      .map((p, idx) => ({
        id: `p-${p.id || idx}`,
        type: 'player',
        url: p.url,
        aspectRatio: p.aspectRatio || '16:9',
        enabled: true,
      }));
  } else if (videoUrl && videoUrl.trim().length > 0) {
    blocks = [
      {
        id: 'legacy-video-1',
        type: 'player',
        url: videoUrl,
        aspectRatio: '16:9',
        enabled: true,
      },
    ];
  }

  if (blocks.length === 0) {
    return (
      <div className="py-8 px-4 text-center rounded-2xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          No preview videos or demo media available for this asset.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {blocks.map((block, index) => {
        if (block.type === 'ad') {
          return <AdBlockRenderer key={block.id || `ad-${index}`} code={block.code || ''} />;
        }

        const rawUrl = (block.url || '').trim();
        if (!rawUrl) return null;

        const ytMatch = rawUrl.match(
          /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/
        );

        if (ytMatch && ytMatch[1]) {
          return (
            <YouTubePlayer
              key={block.id || `yt-${index}`}
              videoId={ytMatch[1]}
              aspectRatio={block.aspectRatio}
            />
          );
        }

        const driveMatch =
          rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || rawUrl.match(/id=([a-zA-Z0-9_-]+)/);
        const direct = isDirectVideo(rawUrl);

        if (direct) {
          return (
            <CustomVideoPlayer
              key={block.id || `mp4-${index}`}
              url={rawUrl}
              aspectRatio={block.aspectRatio}
            />
          );
        }

        const embedSrc = driveMatch
          ? `https://drive.google.com/file/d/${driveMatch[1]}/preview`
          : rawUrl;

        return (
          <LazyIframePlayer
            key={block.id || `embed-${index}`}
            src={embedSrc}
            aspectRatio={block.aspectRatio}
          />
        );
      })}
    </div>
  );
};
