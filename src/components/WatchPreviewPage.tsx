import React, { useEffect, useState } from 'react';
import { 
  Star, 
  ShieldCheck, 
  Zap, 
  CheckCircle2
} from 'lucide-react';
import { Product, Currency } from '../types';
import { WatchPreviewCarousel } from './WatchPreviewCarousel';

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
  const [copiedLink, setCopiedLink] = useState(false);

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
          ← Return to Marketplace
        </button>
      </div>
    );
  }

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

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8 animate-in fade-in duration-300 pb-8 sm:pb-12 space-y-6">
      
      {/* Main Preview Container Card */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-8 shadow-sm space-y-6" style={{ contain: 'content' }}>
        
        {/* 2. Title & Category Badges */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Interactive Showcase
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
              {product.category}
            </span>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-black">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{product.rating || 4.9}</span>
            </div>
          </div>

          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
            {product.title}
          </h1>

          {product.description && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Watch Preview Carousel (Adaptive aspect ratio 9:16 / 16:9, swipes, lightbox, specs) */}
        <div className="w-full">
          <WatchPreviewCarousel
            product={product}
            onInstantBuy={onInstantBuy}
          />
        </div>

        {/* Security & Verification Banner */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-3 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-slate-900 dark:text-slate-200">100% Virus-Free Scanned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="font-semibold">Instant Google Drive Delivery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold">Lifetime Commercial License</span>
          </div>
        </div>

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
