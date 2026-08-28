import React from 'react';
import { ExternalLink, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { DEFAULT_GLOBAL_CONFIG, PreviewBlock, PreviewPlayer, Product } from '../types';
import { WatchPreviewCarousel } from './WatchPreviewCarousel';

export interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  videoUrl?: string;
  previewWebsiteUrl?: string;
  previewPlayers?: PreviewPlayer[];
  previewBlocks?: PreviewBlock[];
  previewImages?: string[];
  title?: string;
  thumbnailUrl?: string;
  onInstantBuy?: (product: Product) => void;
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  isOpen,
  onClose,
  product,
  videoUrl,
  previewWebsiteUrl,
  previewPlayers,
  previewBlocks,
  previewImages,
  title,
  thumbnailUrl,
  onInstantBuy,
}) => {
  const { globalConfig } = useGlobalSettings();

  if (!isOpen) return null;

  // Synthesize a complete Product object if not directly supplied
  const effectiveProduct: Product = product || {
    id: 'preview-modal-item',
    title: title || 'Asset Live Preview & Walkthrough',
    category: 'Video Bundles',
    priceBDT: 299,
    priceUSD: 2.99,
    originalPriceBDT: 999,
    thumbnail: thumbnailUrl || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    previewImages: previewImages || [],
    gallery: previewImages || [],
    previewVideoUrl: videoUrl,
    previewWebsiteUrl: previewWebsiteUrl,
    previewPlayers: previewPlayers,
    previewBlocks: previewBlocks,
    badge: '🔥 SPECIAL OFFER',
    rating: 4.9,
    reviewsCount: 1,
    fileSize: 'Instant Direct Cloud Delivery',
    fileFormat: 'PSD / MP4 / ZIP / Assets',
    license: 'Commercial & Personal Lifetime License',
    instantDownloadLink: '',
    description: '',
    features: ['Instant Direct Google Drive Delivery', 'Commercial Usage Rights Included', '24/7 Lifetime Access'],
    bundleFeatures: ['Instant Direct Google Drive Delivery', 'Commercial Usage Rights Included', '24/7 Lifetime Access'],
    updatedDate: new Date().toISOString(),
    downloadsCount: 1500
  };

  const adsConfig = globalConfig?.previewVideoAds || DEFAULT_GLOBAL_CONFIG.previewVideoAds!;
  const isAdsEnabled = adsConfig.enabled ?? true;
  const topAd = adsConfig.topBannerAd || DEFAULT_GLOBAL_CONFIG.previewVideoAds!.topBannerAd;
  const bottomAd = adsConfig.bottomNativeAd || DEFAULT_GLOBAL_CONFIG.previewVideoAds!.bottomNativeAd;

  const salePrice = effectiveProduct.priceBDT || 299;
  const regPrice = effectiveProduct.originalPriceBDT || (salePrice * 2);
  const discountPercent = Math.max(10, Math.round(((regPrice - salePrice) / regPrice) * 100));

  const handleBuy = () => {
    if (onInstantBuy && product) {
      onClose();
      onInstantBuy(product);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl flex flex-col bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh]">
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] z-10 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black">
              ▶
            </div>
            <div className="truncate">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Live Interactive Preview
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                {title || effectiveProduct.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition shrink-0 cursor-pointer"
            aria-label="Close preview modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
          {/* Top Banner Ad */}
          {isAdsEnabled && topAd?.enabled && topAd.targetUrl && (
            <div className="w-full bg-gradient-to-r from-slate-100 to-emerald-50/50 dark:from-slate-950/90 dark:to-slate-900 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3 text-center shadow-xs">
              <a
                href={topAd.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 group"
              >
                <div className="text-left overflow-hidden flex-1">
                  <div className="font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-500 transition-colors text-xs">
                    {topAd.title || 'Advertisement'}
                  </div>
                  {topAd.subtext && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {topAd.subtext}
                    </p>
                  )}
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-black text-[10px] flex items-center gap-1 shrink-0">
                  <span>{topAd.ctaText || 'Get Offer'}</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </a>
            </div>
          )}

          {/* Interactive Carousel & Bundle Specifications */}
          <WatchPreviewCarousel
            product={effectiveProduct}
            onInstantBuy={onInstantBuy}
          />

          {/* External Live Demo Website Link */}
          {(previewWebsiteUrl || effectiveProduct.previewWebsiteUrl) && (
            <div className="w-full pt-1">
              <a
                href={previewWebsiteUrl || effectiveProduct.previewWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-black text-sm tracking-wide shadow-lg shadow-teal-900/20 active:scale-98 transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>🌐 Open Full Interactive Live Demo Website ↗</span>
              </a>
            </div>
          )}

          {/* Bottom Sponsored Ad */}
          {isAdsEnabled && bottomAd?.enabled && bottomAd.targetUrl && (
            <div className="w-full bg-gradient-to-r from-slate-100 to-teal-50/50 dark:from-slate-950/90 dark:to-slate-900 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-3 text-center shadow-xs">
              <a
                href={bottomAd.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 group"
              >
                <div className="text-left overflow-hidden flex-1">
                  <div className="font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-400 transition-colors text-xs">
                    {bottomAd.title || 'Sponsored Offer'}
                  </div>
                  {bottomAd.subtext && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {bottomAd.subtext}
                    </p>
                  )}
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-black text-[10px] flex items-center gap-1 shrink-0">
                  <span>{bottomAd.ctaText || 'Claim Offer'}</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </a>
            </div>
          )}
        </div>

        {/* Direct Sticky Purchase Action Footer */}
        {onInstantBuy && product && (
          <div className="p-4 sm:px-6 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                ৳{salePrice.toLocaleString('en-BD')}
              </span>
              <span className="text-xs sm:text-sm text-slate-400 line-through">
                ৳{regPrice.toLocaleString('en-BD')}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black border border-rose-500/20">
                -{discountPercent}% OFF
              </span>
            </div>

            <button
              type="button"
              onClick={handleBuy}
              className="px-6 sm:px-8 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-red-900/25 active:scale-98 transition flex items-center gap-2 cursor-pointer select-none"
            >
              <ShoppingBag className="w-4 h-4 fill-white" />
              <span>Buy Now • Instant Access</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPreviewModal;
