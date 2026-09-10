import React, { memo, useState, useEffect } from 'react';
import { ShoppingBag, Tv, Edit3 } from 'lucide-react';
import { Product, Currency, ProductType } from '../types';
import { useCart } from '../context/CartContext';
import { formatDirectImageUrl } from '../utils/formatImageUrl';
import { auth } from '../lib/firebase';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { toggleProductInHeroBanner, isProductInHeroBanners } from '../lib/heroBannerService';

interface ProductCardProps {
  product: Product;
  currency: Currency;
  type?: ProductType;
  onInstantBuy?: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  isSaved?: boolean;
  onToggleSave?: (productId: string) => void;
}

// Shared module-level admin state listener so multiple ProductCards do not register redundant listeners
let cachedAdminState: boolean = false;
const adminListeners = new Set<(isAdmin: boolean) => void>();

if (typeof window !== 'undefined') {
  auth.onAuthStateChanged((user) => {
    const cached = localStorage.getItem('fm_master_admin_email') || 'new144506@gmail.com';
    cachedAdminState = Boolean(user && user.email?.toLowerCase().trim() === cached.toLowerCase().trim());
    adminListeners.forEach(cb => cb(cachedAdminState));
  });
}

export const ProductCard: React.FC<ProductCardProps> = memo(({
  product,
  currency,
  onInstantBuy,
  onViewDetails,
}) => {
  const { addToCart } = useCart();
  const { heroBanners, generalConfig } = useGlobalSettings();

  const [isAdmin, setIsAdmin] = useState<boolean>(cachedAdminState);
  const [isTogglingHero, setIsTogglingHero] = useState(false);

  useEffect(() => {
    const listener = (val: boolean) => setIsAdmin(val);
    adminListeners.add(listener);
    return () => {
      adminListeners.delete(listener);
    };
  }, []);

  const inHero = isProductInHeroBanners(product, heroBanners?.banners || []);

  const handleAdminToggleHero = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTogglingHero(true);
    try {
      await toggleProductInHeroBanner(product);
    } catch (err) {
      console.error('Failed to toggle product in hero banner:', err);
    } finally {
      setIsTogglingHero(false);
    }
  };

  if (!product) return null;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    e.preventDefault();
    onViewDetails(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const handleDirectBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onInstantBuy) {
      onInstantBuy(product);
    } else {
      onViewDetails(product);
    }
  };

  const handleOpenPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onViewDetails(product);
  };

  const isService = product.productKind === 'service' || product.category === 'Digital Services';

  // Resolve buy button text, icon, and color theme from product-level override or global config
  const resolvedButtonText = product.buyButtonText?.trim() || generalConfig?.buyButtonText?.trim() || (isService ? 'Order' : 'Buy');
  const resolvedIconType = (product.buyButtonIcon && product.buyButtonIcon !== 'default') 
    ? product.buyButtonIcon 
    : (generalConfig?.buyButtonIcon || (isService ? 'chat' : 'lightning'));
  const resolvedColorTheme = (product.buyButtonColor && product.buyButtonColor !== 'default')
    ? product.buyButtonColor
    : (generalConfig?.buyButtonColor || 'emerald');

  const getColorClasses = (theme: string) => {
    switch (theme) {
      case 'indigo':
        return 'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-indigo-500/25 text-white';
      case 'amber':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/25 text-slate-950';
      case 'rose':
        return 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-500/25 text-white';
      case 'violet':
        return 'bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 shadow-violet-500/25 text-white';
      case 'slate':
        return 'bg-gradient-to-r from-slate-800 to-slate-950 hover:from-slate-900 hover:to-black shadow-slate-900/25 text-white';
      case 'emerald':
      default:
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25 text-white';
    }
  };

  const renderButtonIcon = () => {
    if (resolvedIconType === 'none') return null;
    switch (resolvedIconType) {
      case 'cart': return <span className="text-xs sm:text-sm md:text-base leading-none">🛒</span>;
      case 'download': return <span className="text-xs sm:text-sm md:text-base leading-none">📥</span>;
      case 'chat': return <span className="text-xs sm:text-sm md:text-base leading-none">💬</span>;
      case 'fire': return <span className="text-xs sm:text-sm md:text-base leading-none">🔥</span>;
      case 'sparkle': return <span className="text-xs sm:text-sm md:text-base leading-none">✨</span>;
      case 'lightning':
      default:
        return <span className="text-xs sm:text-sm md:text-base leading-none">⚡</span>;
    }
  };

  // Price calculations
  const priceDisplay = currency === 'USD' 
    ? `$${(product.priceUSD ?? 0).toFixed(0)}`
    : `৳${(product.priceBDT ?? (product as any).salePrice ?? (product as any).price ?? 0).toLocaleString('en-BD')}`;

  const originalPriceDisplay = currency === 'USD'
    ? (product.originalPriceBDT ? `$${((product.priceUSD || 0) * 2).toFixed(0)}` : null)
    : (product.originalPriceBDT ? `৳${product.originalPriceBDT.toLocaleString('en-BD')}` : (product as any).originalPrice ? `৳${(product as any).originalPrice}` : null);

  const coverImg = formatDirectImageUrl((product as any).coverImage || product.thumbnail) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
  const categoryText = product.category || 'VIDEO BUNDLES';

  // Support turning off File Size & Star Rating per-product or globally
  const rawFileSize = (product.fileSize !== undefined && product.fileSize !== null) ? String(product.fileSize).trim() : '';
  const isFileSizeExplicitlyOff = rawFileSize.toLowerCase() === 'off' || rawFileSize.toLowerCase() === 'none' || rawFileSize.toLowerCase() === 'hide' || rawFileSize.toLowerCase() === 'hidden';
  
  const isGlobalFileSizeEnabled = generalConfig?.showCardFileSize !== false;
  const isProductFileSizeEnabled = (product as any).showFileSize !== false && !isFileSizeExplicitlyOff && rawFileSize !== '';
  const showFileSize = isGlobalFileSizeEnabled && isProductFileSizeEnabled;
  const fileSizeDisplay = rawFileSize;

  const isGlobalRatingEnabled = generalConfig?.showCardRating !== false;
  const isProductRatingEnabled = (product as any).showRating !== false;
  const showRating = isGlobalRatingEnabled && isProductRatingEnabled;
  const ratingDisplay = product.rating !== undefined && product.rating !== null ? String(product.rating) : '4.9';

  return (
    <article
      id={`product-card-${product.id}`}
      onClick={handleCardClick}
      className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 min-[360px]:p-3 sm:p-3.5 shadow-xs hover:shadow-lg border border-slate-100 dark:border-slate-800 transition-colors duration-200 flex flex-col justify-between group relative cursor-pointer gpu-layer touch-manipulation"
    >
      {/* Upper Content Wrap */}
      <div>
        {/* 1. Thumbnail Media Box (Strict 16:9 Aspect Video with Full Visibility) */}
        <div 
          onClick={handleOpenPreview}
          className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center mb-2.5 sm:mb-3 cursor-pointer touch-manipulation"
        >
          <img 
            src={coverImg} 
            alt={product.title || 'Product Cover'}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none select-none"
          />
          {product.badge && (
            <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[8px] sm:text-[9px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-md shadow-md z-10 pointer-events-none tracking-wide">
              {product.badge}
            </span>
          )}
          {isAdmin && (
            <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/admin?tab=products&edit=${product.id}`;
                }}
                className="px-1.5 sm:px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-black bg-slate-950/80 hover:bg-emerald-500 text-white hover:text-slate-950 backdrop-blur-md border border-slate-700/80 hover:border-emerald-500 transition-all shadow-md flex items-center gap-0.5 sm:gap-1 cursor-pointer active:scale-90 touch-manipulation"
                title="Edit this product details & file size in Admin Panel"
              >
                <Edit3 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={handleAdminToggleHero}
                disabled={isTogglingHero}
                className={`px-1.5 sm:px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-black transition-all shadow-md flex items-center gap-0.5 sm:gap-1 cursor-pointer active:scale-90 touch-manipulation ${
                  inHero
                    ? 'bg-amber-500 hover:bg-rose-500 text-slate-950 hover:text-white'
                    : 'bg-slate-950/80 hover:bg-emerald-500 text-white hover:text-slate-950 backdrop-blur-md border border-slate-700/80 hover:border-emerald-500'
                } ${isTogglingHero ? 'opacity-60 cursor-wait' : ''}`}
                title={inHero ? "In Homepage Hero Slider (Click to remove in 1 click)" : "Add this published product to Homepage Hero Slider in 1 click"}
              >
                <Tv className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>{inHero ? '✓ Hero' : '+ Hero'}</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. Unified Single-Line Meta Row */}
        <div className="flex items-center justify-between text-[9px] min-[360px]:text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 my-1 sm:my-1.5 gap-1">
          {/* Category Pill/Text */}
          <span className="text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate max-w-[75px] min-[380px]:max-w-[100px] sm:max-w-[120px]">
            {categoryText}
          </span>

          {/* Compact Rating & Size */}
          {(showRating || showFileSize) && (
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
              {showRating && (
                <span className="flex items-center gap-0.5 text-amber-500 font-extrabold">
                  ★ {ratingDisplay}
                </span>
              )}
              {showRating && showFileSize && (
                <span className="text-slate-300 dark:text-slate-600">|</span>
              )}
              {showFileSize && (
                <span className="text-slate-400 font-medium">
                  {fileSizeDisplay}
                </span>
              )}
            </div>
          )}
        </div>

        {/* 3. Product Title (2-line clamp) */}
        <h3 
          onClick={handleOpenPreview}
          className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-2 leading-snug mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
          title={product.title}
        >
          {product.title}
        </h3>
      </div>

      {/* 4. Footer: Pricing & Action Buttons */}
      <div className="pt-2 sm:pt-2.5 mt-auto border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Left: Price Display */}
        <div className="flex flex-col min-w-0 shrink">
          <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-tight truncate">
            {isService ? 'SERVICE' : 'INSTANT ACCESS'}
          </span>
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-sm min-[380px]:text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
              {priceDisplay}
            </span>
            {originalPriceDisplay && (
              <span className="text-[9px] sm:text-[10px] text-slate-400 line-through whitespace-nowrap">
                {originalPriceDisplay}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions with Enlarged Primary Buy Button */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Compact Cart Icon */}
          <button 
            type="button"
            onClick={handleAddToCart}
            title="Add to Cart"
            aria-label="Add to Cart"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors border border-slate-200/60 dark:border-slate-700 cursor-pointer active:scale-90 shrink-0 flex items-center justify-center touch-manipulation"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Large, Prominent Buy Now Button */}
          <button 
            type="button"
            onClick={handleDirectBuy}
            className={`px-2.5 min-[360px]:px-3 sm:px-4 md:px-5 py-1.5 min-[360px]:py-2 sm:py-2.5 min-h-[32px] min-[360px]:min-h-[36px] sm:min-h-[40px] ${getColorClasses(resolvedColorTheme)} active:scale-95 text-xs sm:text-sm md:text-base font-black tracking-wide rounded-xl shadow-xs sm:shadow-md flex items-center justify-center gap-1 sm:gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap touch-manipulation select-none`}
          >
            {renderButtonIcon()}
            <span className="leading-none">
              {resolvedButtonText}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;


