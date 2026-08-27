import React, { useState, memo, useMemo } from 'react';
import { ShieldCheck, Clock, Eye, ShoppingBag, Package } from 'lucide-react';
import { motion } from 'motion/react';
import { Product, Currency, ProductType } from '../types';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { useCart } from '../context/CartContext';
import { formatDirectImageUrl } from '../utils/formatImageUrl';

interface ProductCardProps {
  product: Product;
  currency: Currency;
  type?: ProductType;
  onInstantBuy?: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  isSaved?: boolean;
  onToggleSave?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  currency,
  type,
  onInstantBuy,
  onViewDetails,
  isSaved = false,
  onToggleSave,
}) => {
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const { generalConfig } = useGlobalSettings();
  const { addToCart } = useCart();
  const aspectStyle = generalConfig?.imageSizes?.productThumbRatio === '1/1' ? '1 / 1' : generalConfig?.imageSizes?.productThumbRatio === '4/3' ? '4 / 3' : '16 / 9';

  const isPhysical = product?.productKind === 'physical';
  const isService = type === 'service' || product?.type === 'service' || product?.category === 'Digital Services';

  // Likes display calculation (uses custom product.likesCount if set, else deterministic fallback)
  const displayLikes = useMemo(() => {
    if (!product) return '500';
    if (product.likesCount !== undefined && product.likesCount !== null && String(product.likesCount).trim() !== '') {
      const raw = String(product.likesCount).trim();
      if (raw.toLowerCase().endsWith('k')) {
        const num = parseFloat(raw.toLowerCase().replace('k', ''));
        if (!isNaN(num)) {
          const base = Math.round(num * 1000);
          const val = isSaved ? base + 1 : base;
          return val >= 1000 ? (val / 1000).toFixed(1) + 'k' : String(val);
        }
        return raw;
      }
      if (raw.toLowerCase().endsWith('m')) {
        const num = parseFloat(raw.toLowerCase().replace('m', ''));
        if (!isNaN(num)) {
          const base = Math.round(num * 1000000);
          const val = isSaved ? base + 1 : base;
          return (val / 1000000).toFixed(1) + 'm';
        }
        return raw;
      }
      const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed)) {
        const val = isSaved ? parsed + 1 : parsed;
        return val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toLocaleString();
      }
      return raw;
    }

    let hash = 0;
    const id = product.id || 'p';
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const baseLikes = 500 + (Math.abs(hash) % 9500);
    const calculated = isSaved ? baseLikes + 1 : baseLikes;
    return calculated > 999 ? (calculated / 1000).toFixed(1) + 'k' : String(calculated);
  }, [product?.id, product?.likesCount, isSaved]);

  if (!product) return null;

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHeartAnimating(true);
    setTimeout(() => setIsHeartAnimating(false), 300);
    if (onToggleSave) onToggleSave(product.id);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    e.preventDefault();
    onViewDetails(product);
  };

  return (
    <article
      id={`product-card-${product.id}`}
      onClick={handleCardClick}
      style={{
        transform: 'translateZ(0)',
        contain: 'paint layout',
        WebkitFontSmoothing: 'antialiased'
      }}
      className="group relative flex flex-col rounded-2xl bg-white dark:bg-[#111827] border-2 border-transparent overflow-hidden shadow-xs hover:shadow-xl hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/15 hover:border-emerald-500/40 dark:hover:border-emerald-500/50 hover:-translate-y-1.5 transition-all duration-300 ease-out will-change-transform master-products-grid-item cursor-pointer"
    >
      {/* THUMBNAIL CONTAINER (Starts from the very top with rounded corners) */}
      <div 
        className="relative w-full overflow-hidden bg-slate-100 dark:bg-slate-950 cursor-pointer aspect-[4/3] will-change-transform"
        style={{ aspectRatio: aspectStyle || '4/3', contain: 'paint' }} 
        onClick={() => onViewDetails(product)}
      >
        {/* Top-Left: Deal Badge (Floating) */}
        {product.badge && (
          <div className="absolute top-2 left-2 z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-red-600/95 text-white shadow-xs">
              <span>{product.badge}</span>
            </span>
          </div>
        )}

        <img
          src={formatDirectImageUrl(product.thumbnail) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'}
          alt={product.title || 'Product Thumbnail'}
          loading="lazy"
          decoding="async"
          style={{ transform: 'translateZ(0)' }}
          className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-105 transition-transform duration-500 ease-out will-change-transform"
        />

        {/* Floating Quick View Overlay Button */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
          <span className="transform translate-y-1 group-hover:translate-y-0 transition-transform duration-200 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white font-heading font-bold text-xs flex items-center gap-1.5 shadow-lg border border-white/20">
            <Eye className="w-3.5 h-3.5 text-emerald-500" />
            <span>{isService ? 'Service Details' : 'Quick Preview'}</span>
          </span>
        </div>
      </div>

      {/* 2. COMPACT CONTENT BODY (Zero Dead Space) */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-2">
        
        {/* Upper Content */}
        <div className="space-y-1.5">
          {/* Sleek Metadata Row Below Image */}
          <div className="flex flex-wrap items-center justify-between gap-y-1 gap-x-2 text-[10px] pb-1 border-b border-slate-100 dark:border-slate-800/60">
            {/* Category Name */}
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide truncate max-w-[40%]">
              {product.category || 'Asset'}
            </span>

            {/* Stats: Likes, Rating & Size in a Clean Tag */}
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold shrink-0">
              {/* Like Button */}
              <button
                type="button"
                onClick={handleSaveClick}
                aria-label="Save product to wishlist"
                className="flex items-center gap-0.5 text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer group/heart shrink-0"
              >
                <svg className={`w-2.5 h-2.5 transition-transform duration-200 ${isSaved ? 'text-rose-500 fill-current' : 'text-slate-400 dark:text-slate-500 fill-current'} ${isHeartAnimating ? 'scale-125' : 'group-hover/heart:scale-110'}`} viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span>{displayLikes}</span>
              </button>

              {/* Bullet Separator */}
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

              {/* Rating */}
              <div className="flex items-center gap-0.5 text-amber-500 dark:text-amber-400 shrink-0">
                <span className="text-[10px]">★</span>
                <span>{product.rating ? product.rating.toFixed(1) : '4.9'}</span>
              </div>

              {/* Bullet Separator */}
              <span className="text-slate-300 dark:text-slate-600">•</span>

              {/* File Size / Stock / Delivery Time */}
              <div className="flex items-center gap-0.5 shrink-0">
                {isPhysical ? (
                  <>
                    <Package className="w-2.5 h-2.5 text-cyan-500 shrink-0" />
                    <span className="truncate max-w-[50px] sm:max-w-[70px] text-cyan-600 dark:text-cyan-400 font-semibold">
                      {product.stockQuantity !== undefined ? `${product.stockQuantity} in stock` : 'In Stock'}
                    </span>
                  </>
                ) : isService ? (
                  <>
                    <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[50px] sm:max-w-[70px]">{product.deliveryTime || '24–48h'}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-2.5 h-2.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                    <span className="truncate max-w-[50px] sm:max-w-[75px]">{product.fileSize || 'Instant'}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => onViewDetails(product)}
            className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer transition-colors"
            title={product.title}
          >
            {product.title}
          </h3>

          {/* Product Description (Clean Unboxed) */}
          <p className="text-[11.5px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed font-normal antialiased">
            {product.description || (isPhysical ? 'High quality physical goods & accessories.' : 'Premium digital assets and resources.')}
          </p>

          {/* License Badge / Card Subtitle */}
          <div className="flex items-center gap-1 text-[9.5px] font-medium text-slate-600 dark:text-slate-300 pt-0.5">
            <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
            <span className="truncate">{product.cardSubtitle || product.licenseTerms || product.license || (isPhysical ? 'Official Authentic Product' : 'Commercial & Personal Lifetime License')}</span>
          </div>
        </div>

        {/* 3. FOOTER PRICE & ACTIONS (Tightly Connected) */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60">
          <div>
            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 block leading-none uppercase">
              {isPhysical ? 'PARCEL DELIVERY' : isService ? 'Starting Rate' : 'INSTANT DRIVE'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                {currency === 'USD' ? `$${(product.priceUSD ?? 0).toFixed(0)}` : `৳${(product.priceBDT ?? 0).toLocaleString('en-BD')}`}
              </span>
              {product.originalPriceBDT && (
                <span className="text-[9.5px] text-slate-400 line-through">
                  {currency === 'USD' ? `$${((product.priceUSD || 0) * 2).toFixed(0)}` : `৳${product.originalPriceBDT.toLocaleString('en-BD')}`}
                </span>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Preview Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(product);
              }}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shrink-0"
              title="Preview details"
              aria-label="Preview product"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Quick Add to Cart Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product);
              }}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15 border border-slate-200/60 dark:border-slate-700/60 transition-all active:scale-95 cursor-pointer shrink-0"
              title="Add to Cart"
              aria-label="Add to cart"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
            </button>
            
            {/* Instant Buy Button */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onInstantBuy) {
                    onInstantBuy(product);
                  } else {
                    onViewDetails(product);
                  }
                }}
                className="relative inline-flex items-center gap-1 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-[12.5px] transition-transform duration-150 active:scale-95 shadow-md shadow-emerald-500/25 cursor-pointer"
              >
                <span className="tracking-wide">Buy</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

