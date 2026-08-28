import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X, 
  Sparkles, 
  Images, 
  Video, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Layers,
  FileCode,
  HardDrive
} from 'lucide-react';
import { Product, PreviewBlock, PreviewPlayer } from '../types';
import { DynamicPreviewRenderer } from './DynamicPreviewRenderer';

interface WatchPreviewCarouselProps {
  product: Product;
  onInstantBuy?: (product: Product) => void;
}

export const WatchPreviewCarousel: React.FC<WatchPreviewCarouselProps> = ({
  product,
  onInstantBuy,
}) => {
  // Collect all valid images: gallery + thumbnail
  const rawImages: string[] = [];
  if (product.previewImages && Array.isArray(product.previewImages)) {
    rawImages.push(...product.previewImages.filter(Boolean));
  } else if (product.gallery && Array.isArray(product.gallery)) {
    rawImages.push(...product.gallery.filter(Boolean));
  }

  if (product.thumbnail && !rawImages.includes(product.thumbnail)) {
    rawImages.unshift(product.thumbnail);
  }

  // Deduplicate and fallback if none
  const images = Array.from(new Set(rawImages)).filter(url => typeof url === 'string' && url.trim().length > 0);
  if (images.length === 0 && product.thumbnail) {
    images.push(product.thumbnail);
  }

  const hasVideos = !!(
    product.previewVideoUrl || 
    product.demoUrl || 
    (product.previewBlocks && product.previewBlocks.some(b => b.enabled)) ||
    (product.previewPlayers && product.previewPlayers.some(p => p.enabled))
  );

  const [activeTab, setActiveTab] = useState<'gallery' | 'video'>(
    images.length > 0 ? 'gallery' : 'video'
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

  return (
    <div className="w-full space-y-4">
      {/* Tab Selector (If both gallery images and video exist) */}
      {hasVideos && images.length > 0 && (
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Images className="w-4 h-4" />
            <span>📸 Visual Gallery ({images.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'video'
                ? 'bg-white dark:bg-slate-900 text-rose-500 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>🎬 Video Walkthrough</span>
          </button>
        </div>
      )}

      {/* Main View: Gallery Slider */}
      {activeTab === 'gallery' && images.length > 0 && (
        <div className="space-y-3">
          {/* Main Slide Stage */}
          <div className="relative aspect-video sm:aspect-[16/10] w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-md group select-none">
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

            {/* Slide Index Badge */}
            <div className="absolute top-3 left-3 px-3 py-1 bg-black/75 backdrop-blur-md rounded-full text-white text-[11px] font-bold border border-white/15 flex items-center gap-1.5 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentIndex + 1} / {images.length}</span>
            </div>

            {/* Zoom Button */}
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="absolute top-3 right-3 p-2 bg-black/75 hover:bg-black/90 backdrop-blur-md rounded-xl text-white border border-white/15 transition opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Open full size"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Prev/Next Arrow Buttons */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-2xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition active:scale-95 cursor-pointer shadow-lg"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-2xl bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition active:scale-95 cursor-pointer shadow-lg"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}

            {/* Bottom dots or compact pill indicator */}
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
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-102'
                      : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                  }`}
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
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video Tab Content */}
      {activeTab === 'video' && (
        <div className="w-full">
          <DynamicPreviewRenderer
            previewBlocks={product.previewBlocks}
            previewPlayers={product.previewPlayers}
            videoUrl={product.previewVideoUrl || product.demoUrl}
          />
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
          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              File Format
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 truncate block">
              {product.fileFormat || product.softwareFormat || 'ZIP / Multi-format'}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Total Assets / Size
            </span>
            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 truncate block">
              {product.fileSize || 'Instant Cloud Access'}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              License Type
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 truncate block">
              {product.license || product.cardSubtitle || 'Lifetime Commercial'}
            </span>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Delivery Method
            </span>
            <span className="text-xs sm:text-sm font-black text-teal-600 dark:text-teal-400 truncate block flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              Direct Google Drive
            </span>
          </div>
        </div>

        {/* What's Inside Bullet Points */}
        {((product.bundleFeatures && product.bundleFeatures.length > 0) || (product.features && product.features.length > 0)) && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              What's Included in This Bundle:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(product.bundleFeatures || product.features || []).map((feat, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feat.replace(/^[✅🎁⚡•\s]+/, '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trust & Guarantee Badges */}
      <div className="flex flex-wrap items-center justify-center gap-4 py-3 px-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-slate-700 dark:text-slate-300 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>100% Virus-Free Scanned</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Instant Cloud Direct Delivery</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-cyan-500" />
          <span>24/7 Lifetime Access &amp; Support</span>
        </div>
      </div>

      {/* Fullscreen Lightbox Zoom Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-[999999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div 
            className="relative max-w-6xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage}
              alt="Fullscreen Zoom"
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
              }}
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 transition cursor-pointer"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 transition cursor-pointer"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </>
            )}
          </div>

          <div className="absolute bottom-6 inset-x-0 text-center text-xs text-white/70">
            Slide {currentIndex + 1} of {images.length} • Press ESC or click background to close
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchPreviewCarousel;
