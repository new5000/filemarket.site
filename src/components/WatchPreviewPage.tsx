import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Star, 
  Share2, 
  Heart, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  Sparkles,
  ShoppingBag,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Product, Currency } from '../types';
import { WatchPreviewCarousel } from './WatchPreviewCarousel';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { getProductSlug } from '../router';

export interface WatchPreviewPageProps {
  product: Product | null;
  currency?: Currency;
  onBack: () => void;
  onInstantBuy: (product: Product) => void;
  savedProducts?: string[];
  onToggleSave?: (productId: string) => void;
}

export const WatchPreviewPage: React.FC<WatchPreviewPageProps> = ({
  product,
  currency = 'BDT',
  onBack,
  onInstantBuy,
  savedProducts = [],
  onToggleSave,
}) => {
  const { globalConfig } = useGlobalSettings();
  const [copiedLink, setCopiedLink] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    if (product) {
      document.title = `Watch Preview: ${product.title} — FileMarket`;
    }
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl mb-4">
          🎬
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Product Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md">
          The requested asset preview does not exist or may have been updated.
        </p>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition cursor-pointer"
        >
          ← Return to Storefront
        </button>
      </div>
    );
  }

  const isLiked = savedProducts.includes(product.id);
  const salePrice = product.priceBDT || product.priceUSD * 120 || 350;
  const originalPrice = product.originalPriceBDT || salePrice * 2;
  const discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);

  const handleShare = async () => {
    const shareData = {
      title: `Watch Preview: ${product.title}`,
      text: `Watch live preview of ${product.title} on FileMarket`,
      url: window.location.href,
    };

    if (navigator.share && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = window.location.href;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleToggleLike = () => {
    setIsHeartAnimating(true);
    setTimeout(() => setIsHeartAnimating(false), 300);
    if (onToggleSave) onToggleSave(product.id);
  };

  const adsConfig = globalConfig?.previewVideoAds;
  const isAdsEnabled = adsConfig?.enabled ?? true;
  const topAd = adsConfig?.topBannerAd;
  const bottomAd = adsConfig?.bottomNativeAd;

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 animate-in fade-in duration-300">
      
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 pb-3 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Wishlist button */}
          <button
            onClick={handleToggleLike}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
              isLiked
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform duration-200 ${
                isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-600 dark:text-slate-300'
              } ${isHeartAnimating ? 'scale-125' : 'scale-100'}`}
            />
            <span className="hidden sm:inline">{isLiked ? 'Saved' : 'Save'}</span>
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Main Preview Container Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-8 shadow-sm space-y-6" style={{ contain: 'content' }}>
        
        {/* Header Metadata Info */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Preview Mode
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
              {product.category}
            </span>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{product.rating || 4.9}</span>
            </div>
          </div>

          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
            {product.title}
          </h1>

          {product.description && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
              {product.description}
            </p>
          )}
        </div>

        {/* Top Global Banner Ad (If Configured) */}
        {isAdsEnabled && topAd?.enabled && topAd.targetUrl && (
          <div className="w-full bg-gradient-to-r from-slate-100 to-emerald-50/50 dark:from-slate-950/90 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-center shadow-xs">
            <a
              href={topAd.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 group"
            >
              <div className="text-left overflow-hidden flex-1">
                <div className="font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-500 transition-colors text-xs sm:text-sm">
                  {topAd.title || 'Special Promotion'}
                </div>
                {topAd.subtext && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {topAd.subtext}
                  </p>
                )}
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-white font-black text-xs flex items-center gap-1 shrink-0">
                <span>{topAd.ctaText || 'Get Offer'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>
          </div>
        )}

        {/* Watch Preview Carousel with Slides, Videos & Specifications */}
        <div className="w-full">
          <WatchPreviewCarousel
            product={product}
            onInstantBuy={onInstantBuy}
          />
        </div>

        {/* Live Interactive Demo Button (If Configured) */}
        {product.previewWebsiteUrl && (
          <div className="w-full pt-2">
            <a
              href={product.previewWebsiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-black text-sm sm:text-base tracking-wide shadow-xl shadow-teal-900/20 active:scale-98 transition cursor-pointer"
            >
              <ExternalLink className="w-5 h-5" />
              <span>🌐 Open Full Interactive Live Demo Website ↗</span>
            </a>
          </div>
        )}

        {/* Security & Verification Banner */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-slate-900 dark:text-slate-200">100% Virus-Free Scanned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Instant Google Drive Delivery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Commercial &amp; Personal License</span>
          </div>
        </div>

        {/* High-Converting Action Bar */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
              ৳{salePrice.toLocaleString('en-BD')}
            </span>
            <span className="text-lg text-slate-400 line-through">
              ৳{originalPrice.toLocaleString('en-BD')}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-black border border-rose-500/20">
              -{discountPercent}% OFF
            </span>
          </div>

          <button
            type="button"
            onClick={() => onInstantBuy(product)}
            className="w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-2.5 py-3.5 px-8 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm sm:text-base shadow-xl shadow-red-900/30 active:scale-98 transition cursor-pointer select-none"
          >
            <svg className="w-5 h-5 fill-current text-amber-300 shrink-0" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Buy Now • Instant Download</span>
          </button>
        </div>

        {/* Bottom Global Native Ad (If Configured) */}
        {isAdsEnabled && bottomAd?.enabled && bottomAd.targetUrl && (
          <div className="w-full bg-gradient-to-r from-slate-100 to-teal-50/50 dark:from-slate-950/90 dark:to-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 text-center shadow-xs mt-4">
            <a
              href={bottomAd.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 group"
            >
              <div className="text-left overflow-hidden flex-1">
                <div className="font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-400 transition-colors text-xs sm:text-sm">
                  {bottomAd.title || 'Sponsored Offer'}
                </div>
                {bottomAd.subtext && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {bottomAd.subtext}
                  </p>
                )}
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-teal-500 text-slate-950 font-black text-xs flex items-center gap-1 shrink-0">
                <span>{bottomAd.ctaText || 'Claim Offer'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </a>
          </div>
        )}

      </div>

      {/* Toast Notification for Clipboard Copy */}
      {copiedLink && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-emerald-500/50 text-emerald-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs sm:text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>🔗 Preview link copied to clipboard!</span>
        </div>
      )}

    </div>
  );
};

export default WatchPreviewPage;
