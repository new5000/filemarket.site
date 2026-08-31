import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X, 
  Images, 
  Video, 
  Play,
  Camera,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Layers
} from 'lucide-react';
import { Product } from '../types';
import { DynamicPreviewRenderer } from './DynamicPreviewRenderer';

interface WatchPreviewCarouselProps {
  product: Product;
  onInstantBuy?: (product: Product) => void;
  showLiveDemoButton?: boolean;
}

export const WatchPreviewCarousel: React.FC<WatchPreviewCarouselProps> = ({
  product,
  onInstantBuy,
  showLiveDemoButton = true,
}) => {
  // Collect all valid preview images: previewImages array, gallery array, and thumbnail
  const rawImages: string[] = [];
  if (product.previewImages && Array.isArray(product.previewImages)) {
    rawImages.push(...product.previewImages.filter(Boolean));
  }
  if (product.gallery && Array.isArray(product.gallery)) {
    rawImages.push(...product.gallery.filter(Boolean));
  }
  if (product.thumbnail && !rawImages.includes(product.thumbnail)) {
    rawImages.unshift(product.thumbnail);
  }

  // Deduplicate & filter clean strings
  const images = Array.from(new Set(rawImages)).filter(url => typeof url === 'string' && url.trim().length > 0);
  if (images.length === 0 && product.thumbnail) {
    images.push(product.thumbnail);
  }

  // Strict check for genuine playable videos
  const hasValidVideoUrl = Boolean(
    (product.previewVideoUrl && product.previewVideoUrl.trim().length > 0 && !product.previewVideoUrl.includes('placeholder')) ||
    (product.demoUrl && product.demoUrl.trim().length > 0 && !product.demoUrl.includes('placeholder')) ||
    (product.previewBlocks && product.previewBlocks.some(b => b.enabled && b.type === 'player' && Boolean(b.url && b.url.trim().length > 0))) ||
    (product.previewPlayers && product.previewPlayers.some(p => p.enabled && p.url && p.url.trim().length > 0))
  );

  // Tab configuration based on admin toggles & content availability
  const isGalleryAllowed = product.enableGallery !== false;
  const isVideoAllowed = product.enableVideo !== false;

  const isGalleryAvailable = isGalleryAllowed && images.length > 0;
  const isVideoAvailable = isVideoAllowed && hasValidVideoUrl;

  const showTabSwitcher = isGalleryAvailable && isVideoAvailable;

  const [activeTab, setActiveTab] = useState<'gallery' | 'video'>(() => {
    if (isGalleryAvailable) return 'gallery';
    if (isVideoAvailable) return 'video';
    return 'gallery';
  });

  // Keep active tab in sync if availability changes
  useEffect(() => {
    if (!isGalleryAvailable && isVideoAvailable) {
      setActiveTab('video');
    } else if (isGalleryAvailable && !isVideoAvailable) {
      setActiveTab('gallery');
    }
  }, [isGalleryAvailable, isVideoAvailable]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Touch swipe support for mobile
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const minSwipeDistance = 45;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && images.length > 1) {
      setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    }
    if (isRightSwipe && images.length > 1) {
      setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  // Keyboard navigation for carousel and lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'gallery' || images.length <= 1) return;
      if (e.key === 'ArrowLeft') {
        setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'Escape') {
        setLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, images.length]);

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const currentImage = images[currentIndex] || product.thumbnail;

  // Live Demo Button calculation (Strictly hidden if disabled or URL is empty)
  const isLiveDemoExplicitlyDisabled = product.liveDemoEnabled === false;
  const effectiveLiveDemoUrl = (product.liveDemoUrl || product.previewWebsiteUrl || '').trim();
  const shouldRenderLiveDemoButton = showLiveDemoButton && !isLiveDemoExplicitlyDisabled && effectiveLiveDemoUrl.length > 0;
  const liveDemoText = product.liveDemoButtonText?.trim() || 'Open Full Interactive Live Demo Website ↗';

  return (
    <div className="w-full space-y-4">
      {/* High-Contrast Modern Segmented Tab Switcher (ONLY shown if BOTH gallery and video are available) */}
      {showTabSwitcher && (
        <div className="bg-slate-900 dark:bg-slate-800/90 p-1.5 rounded-2xl shadow-lg border border-slate-700/50 flex gap-2 w-full max-w-md mx-auto my-3">
          {/* Tab 1: Visual Gallery Button */}
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 ease-out active:scale-95 cursor-pointer select-none ${
              activeTab === 'gallery'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-md shadow-emerald-500/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white font-medium'
            }`}
          >
            <Camera className={`w-4 h-4 shrink-0 ${activeTab === 'gallery' ? 'text-white' : 'text-slate-400'}`} />
            <span className="whitespace-nowrap">Screenshots Gallery</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 ${
              activeTab === 'gallery' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              {images.length}
            </span>
          </button>

          {/* Tab 2: Video Walkthrough Button */}
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 ease-out active:scale-95 cursor-pointer select-none ${
              activeTab === 'video'
                ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold shadow-md shadow-red-500/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white font-medium'
            }`}
          >
            {activeTab === 'video' ? (
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
            ) : (
              <Play className="w-3.5 h-3.5 shrink-0 text-slate-400 fill-slate-400" />
            )}
            <span className="whitespace-nowrap">Watch Video Demo</span>
          </button>
        </div>
      )}

      {/* Main View: Gallery Slider with Touch Swipe & Click-to-Zoom */}
      {activeTab === 'gallery' && isGalleryAvailable && (
        <div className="space-y-3">
          {/* Main Slide Stage */}
          <div 
            className="relative aspect-video sm:aspect-[16/10] w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-md group select-none touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={currentImage}
              alt={`${product.title} - Slide ${currentIndex + 1}`}
              className="w-full h-full object-contain sm:object-cover transition-all duration-300 cursor-zoom-in"
              onClick={() => setLightboxOpen(true)}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
              }}
            />

            {/* Slide Counter Badge */}
            <div className="absolute top-3 left-3 px-3 py-1 bg-black/75 backdrop-blur-md rounded-full text-white text-[11px] font-bold border border-white/15 flex items-center gap-1.5 pointer-events-none shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentIndex + 1} / {images.length}</span>
            </div>

            {/* Zoom Action Button */}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute top-3 right-3 p-2 bg-black/75 hover:bg-black/90 backdrop-blur-md rounded-xl text-white border border-white/15 transition opacity-90 sm:opacity-0 group-hover:opacity-100 cursor-pointer shadow-sm"
              title="Open full size preview"
              aria-label="Zoom image"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Prev/Next Arrow Controls */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-2xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition active:scale-95 cursor-pointer shadow-lg"
                  aria-label="Previous image slide"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-2xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition active:scale-95 cursor-pointer shadow-lg"
                  aria-label="Next image slide"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}

            {/* Bottom Dots Indicator */}
            {images.length > 1 && (
              <div className="absolute bottom-3 inset-x-0 flex justify-center items-center pointer-events-none">
                {images.length <= 8 ? (
                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/10">
                    {images.map((_, i) => (
                      <span
                        key={i}
                        className={`h-1.5 rounded-full transition-all ${
                          i === currentIndex ? 'w-5 bg-emerald-400' : 'w-1.5 bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-1 bg-black/75 backdrop-blur-md rounded-full text-white text-[10px] font-bold border border-white/15">
                    Slide {currentIndex + 1} of {images.length}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Interactive Thumbnails Strip */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative shrink-0 w-20 sm:w-24 aspect-[16/10] rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                    idx === currentIndex
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-102 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                  aria-label={`Jump to slide ${idx + 1}`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-black/70 rounded text-[9px] font-bold text-white leading-none">
                    #{idx + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video Tab Content (Only if active and configured) */}
      {activeTab === 'video' && isVideoAvailable && (
        <div className="w-full">
          <DynamicPreviewRenderer
            previewBlocks={product.previewBlocks}
            previewPlayers={product.previewPlayers}
            videoUrl={product.previewVideoUrl || product.demoUrl}
          />
        </div>
      )}

      {/* External Live Demo Website Button (Strictly hidden if disabled or URL is blank) */}
      {shouldRenderLiveDemoButton && (
        <div className="w-full pt-1">
          <a
            href={effectiveLiveDemoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-sm sm:text-base tracking-wide shadow-lg shadow-teal-900/20 active:scale-98 transition cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span className="truncate">{liveDemoText}</span>
          </a>
        </div>
      )}

      {/* Bundle Content Breakdown Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
        <h4 className="font-black text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-500" />
          <span>Bundle Content &amp; Delivery Breakdown</span>
        </h4>

        {/* Specifications Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              File Format
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 truncate block">
              {product.fileFormat || product.softwareFormat || 'ZIP / Multi-format'}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Total Assets / Size
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 truncate block">
              {product.fileSize || 'Instant Access'}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              License
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 truncate block">
              {product.license || 'Commercial Use'}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Delivery
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-500 truncate block">
              Instant Cloud Link
            </span>
          </div>
        </div>

        {/* Feature List */}
        {(product.bundleFeatures || product.features) && (
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              What's Included in this asset:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(product.bundleFeatures || product.features || []).map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Lightbox Header */}
          <div className="flex items-center justify-between text-white z-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
              <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20">
                {currentIndex + 1} / {images.length}
              </span>
              <span className="truncate max-w-xs sm:max-w-md text-slate-300">{product.title}</span>
            </div>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Lightbox Main Image Stage with Touch Handlers */}
          <div 
            className="relative flex-1 flex items-center justify-center my-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={currentImage}
              alt={`${product.title} - Full Size`}
              className="max-h-[85vh] max-w-[95vw] object-contain rounded-xl shadow-2xl transition-transform"
              referrerPolicy="no-referrer"
            />

            {/* Lightbox Prev/Next Controls */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 sm:left-4 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 transition cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 sm:right-4 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 transition cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Thumbnails */}
          {images.length > 1 && (
            <div 
              className="flex items-center justify-center gap-2 overflow-x-auto py-2 z-10 max-w-3xl mx-auto scrollbar-thin"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative shrink-0 w-14 sm:w-18 aspect-video rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                    idx === currentIndex
                      ? 'border-emerald-400 scale-105 shadow-md'
                      : 'border-white/20 opacity-50 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WatchPreviewCarousel;
