import React, { useEffect, useRef } from 'react';
import { PreviewBlock, PreviewPlayer, AdSizePreset } from '../types';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

/**
 * Universal Video Player for Google Drive, YouTube, and Native HTML5 Videos.
 * - Google Drive: Embeds `https://drive.google.com/file/d/${FILE_ID}/preview` inside responsive container.
 * - YouTube: Embeds clean `https://www.youtube-nocookie.com/embed/${ID}`.
 * - Direct MP4 / WebM / Cloud: Native HTML5 video player with inline playsinline controls.
 * - Aspect ratio adaptation: 9/16 vertical for Shorts/Reels, 16/9 for Widescreen video.
 */
export const UniversalVideoPlayer: React.FC<{
  videoUrl: string;
  aspectRatio?: string;
  title?: string;
}> = ({ videoUrl, aspectRatio = '9/16', title = 'Product Video Preview' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(containerRef, {
    rootMargin: '200px',
    freezeOnceVisible: true,
  });

  if (!videoUrl || typeof videoUrl !== 'string') return null;

  const cleanUrl = videoUrl.trim();
  if (cleanUrl.length === 0 || cleanUrl.includes('placeholder')) return null;

  // Detect vertical vs widescreen:
  const isShortsOrReels = 
    cleanUrl.includes('/shorts/') || 
    cleanUrl.includes('reels') || 
    cleanUrl.includes('tiktok') || 
    aspectRatio === '9/16' || 
    aspectRatio === '9:16';

  const containerClass = `relative w-full ${
    isShortsOrReels ? 'max-w-[360px] aspect-[9/16]' : 'max-w-4xl aspect-video'
  } mx-auto rounded-2xl overflow-hidden bg-black shadow-2xl flex items-center justify-center my-3 border border-slate-800`;

  // 1. Check for Google Drive URL
  const driveMatch =
    cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return (
      <div ref={containerRef} className={containerClass}>
        {isVisible ? (
          <iframe
            src={`https://drive.google.com/file/d/${fileId}/preview`}
            className="w-full h-full border-0 rounded-2xl"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title={title || 'Google Drive Video Preview'}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black text-slate-500">
            <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-emerald-500 animate-spin" />
          </div>
        )}
      </div>
    );
  }

  // 2. Check for YouTube URL
  const ytMatch = cleanUrl.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/|watch\?.+&v=))([\w-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const ytId = ytMatch[1];
    return (
      <div ref={containerRef} className={containerClass}>
        {isVisible ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&playsinline=1`}
            className="w-full h-full border-0 rounded-2xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title={title || 'YouTube Video Preview'}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black text-slate-500">
            <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-emerald-500 animate-spin" />
          </div>
        )}
      </div>
    );
  }

  // 3. Native MP4 / Blob / Direct Cloud Video
  return (
    <div ref={containerRef} className={containerClass}>
      {isVisible ? (
        <video
          key={cleanUrl}
          src={cleanUrl}
          controls
          playsInline
          // @ts-ignore - Required for iOS Safari webkit inline video playback
          webkit-playsinline="true"
          preload="metadata"
          className="w-full h-full object-contain rounded-2xl bg-black"
        >
          Your browser does not support HTML5 video.
        </video>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black text-slate-500">
          <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-emerald-500 animate-spin" />
        </div>
      )}
    </div>
  );
};

// Aliases for compatibility
export const YouTubePlayer: React.FC<{ videoId: string; aspectRatio?: string; title?: string }> = ({
  videoId,
  aspectRatio = '16:9',
  title,
}) => (
  <UniversalVideoPlayer
    videoUrl={`https://www.youtube.com/watch?v=${videoId}`}
    aspectRatio={aspectRatio}
    title={title}
  />
);

export const NativeHtml5VideoPlayer: React.FC<{
  src: string;
  aspectRatio?: string;
  title?: string;
}> = ({ src, aspectRatio, title }) => (
  <UniversalVideoPlayer videoUrl={src} aspectRatio={aspectRatio} title={title} />
);

export const CustomVideoPlayer = NativeHtml5VideoPlayer;

export const GoogleDrivePlayer: React.FC<{
  fileId: string;
  embedUrl: string;
  aspectRatio?: string;
  title?: string;
}> = ({ fileId, embedUrl, aspectRatio, title }) => (
  <UniversalVideoPlayer
    videoUrl={fileId ? `https://drive.google.com/file/d/${fileId}/preview` : embedUrl}
    aspectRatio={aspectRatio}
    title={title}
  />
);

export const LazyIframePlayer: React.FC<{
  src: string;
  aspectRatio?: string;
  title?: string;
}> = ({ src, aspectRatio, title }) => (
  <UniversalVideoPlayer videoUrl={src} aspectRatio={aspectRatio} title={title} />
);

/**
 * Ad Block Renderer with Dynamic Script Execution & Preset Sizing
 */
export const AdBlockRenderer: React.FC<{
  code: string;
  adSizePreset?: AdSizePreset;
  title?: string;
}> = ({ code, adSizePreset = 'responsive', title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isVisible = useIntersectionObserver(wrapperRef, {
    rootMargin: '200px',
    freezeOnceVisible: true,
  });

  useEffect(() => {
    if (!isVisible || !containerRef.current || !code || code.trim().length === 0) return;

    // Clear previous contents
    containerRef.current.innerHTML = '';

    // Create a temporary sandbox div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = code.trim();

    // Re-inject script elements so the browser executes them
    const scripts = tempDiv.querySelectorAll('script');
    const nonScripts = Array.from(tempDiv.childNodes).filter((node) => node.nodeName !== 'SCRIPT');

    // Append non-script DOM elements first
    nonScripts.forEach((node) => {
      containerRef.current?.appendChild(node.cloneNode(true));
    });

    // Execute scripts dynamically
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      if (oldScript.innerHTML) {
        newScript.innerHTML = oldScript.innerHTML;
      }
      containerRef.current?.appendChild(newScript);
    });
  }, [isVisible, code]);

  if (!code || code.trim().length === 0) return null;

  return (
    <div ref={wrapperRef} className="w-full max-w-[728px] mx-auto my-6 px-4 flex flex-col items-center justify-center overflow-hidden rounded-2xl">
      <div className="w-full flex items-center justify-between px-1 mb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none">
        <span>{title || 'SPONSORED'}</span>
      </div>
      <div
        ref={containerRef}
        className="w-full flex justify-center items-center overflow-x-auto min-h-[50px] rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 p-2 sm:p-3 shadow-xs"
      />
    </div>
  );
};

/**
 * URL Helper: Detects Direct Video Files (MP4, WebM, OGG, MOV, M4V, Blob, Data URLs)
 */
export const isDirectVideo = (url: string) => {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.trim().toLowerCase();
  return (
    cleanUrl.startsWith('data:video/') ||
    cleanUrl.startsWith('blob:') ||
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.ogg') ||
    cleanUrl.endsWith('.mov') ||
    cleanUrl.endsWith('.m4v') ||
    cleanUrl.includes('.mp4?') ||
    cleanUrl.includes('.webm?') ||
    cleanUrl.includes('.mov?') ||
    cleanUrl.includes('firebasestorage.googleapis.com') ||
    cleanUrl.includes('cloudinary.com') ||
    cleanUrl.includes('storage.googleapis.com') ||
    cleanUrl.includes('amazonaws.com')
  );
};

/**
 * URL Helper: Formats YouTube / Google Drive / Vimeo / Direct Video Links
 */
export const parseVideoUrl = (rawUrl: string) => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const clean = rawUrl.trim();

  // YouTube parser
  const ytMatch = clean.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/|watch\?.+&v=))([\w-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube' as const,
      videoId: ytMatch[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&playsinline=1`,
    };
  }

  // Google Drive parser
  if (clean.includes('drive.google.com') || clean.includes('docs.google.com')) {
    const driveMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      const fileId = driveMatch[1];
      return {
        type: 'drive' as const,
        fileId: fileId,
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      };
    }
  }

  // Vimeo parser
  const vimeoMatch = clean.match(
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/
  );
  if (vimeoMatch && vimeoMatch[1]) {
    return { type: 'vimeo' as const, embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }

  // Direct video
  if (isDirectVideo(clean)) {
    return { type: 'direct' as const, url: clean };
  }

  // Default iframe embed fallback
  return { type: 'iframe' as const, embedUrl: clean };
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
  // Build resolved sequence of video-only blocks (Ads strictly excluded)
  let blocks: PreviewBlock[] = [];

  if (previewBlocks && previewBlocks.length > 0) {
    blocks = previewBlocks.filter((b) => b && b.enabled && b.type === 'player');
  } else if (previewPlayers && previewPlayers.length > 0) {
    blocks = previewPlayers
      .filter((p) => p && p.enabled && p.url && p.url.trim().length > 0)
      .map((p, idx) => ({
        id: `p-${p.id || idx}`,
        type: 'player',
        url: p.url,
        aspectRatio: p.aspectRatio || '9:16',
        enabled: true,
      }));
  } else if (videoUrl && videoUrl.trim().length > 0 && !videoUrl.includes('placeholder')) {
    blocks = [
      {
        id: 'legacy-video-1',
        type: 'player',
        url: videoUrl,
        aspectRatio: '9:16',
        enabled: true,
      },
    ];
  }

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-3">
      {blocks.map((block, index) => {
        const rawUrl = (block.url || '').trim();
        if (!rawUrl || rawUrl.includes('placeholder')) return null;

        return (
          <UniversalVideoPlayer
            key={block.id || `video-${index}`}
            videoUrl={rawUrl}
            aspectRatio={block.aspectRatio || '9/16'}
            title={block.title || 'Product Video Preview'}
          />
        );
      })}
    </div>
  );
};

export default DynamicPreviewRenderer;
