import React, { memo } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Product, Currency, ProductType } from '../types';
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
  onInstantBuy,
  onViewDetails,
}) => {
  const { addToCart } = useCart();

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

  // Price calculations
  const priceDisplay = currency === 'USD' 
    ? `$${(product.priceUSD ?? 0).toFixed(0)}`
    : `৳${(product.priceBDT ?? (product as any).salePrice ?? (product as any).price ?? 0).toLocaleString('en-BD')}`;

  const originalPriceDisplay = currency === 'USD'
    ? (product.originalPriceBDT ? `$${((product.priceUSD || 0) * 2).toFixed(0)}` : null)
    : (product.originalPriceBDT ? `৳${product.originalPriceBDT.toLocaleString('en-BD')}` : (product as any).originalPrice ? `৳${(product as any).originalPrice}` : null);

  const coverImg = formatDirectImageUrl((product as any).coverImage || product.thumbnail) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
  const categoryText = product.category || 'VIDEO BUNDLES';
  const ratingDisplay = product.rating ? String(product.rating) : ((product as any).rating || '9.2');
  const fileSizeDisplay = product.fileSize || ((product as any).fileSize || '15 GB');

  return (
    <article
      id={`product-card-${product.id}`}
      onClick={handleCardClick}
      className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 shadow-xs hover:shadow-lg border border-slate-100 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between group relative cursor-pointer"
    >
      {/* Upper Content Wrap */}
      <div>
        {/* 1. Thumbnail Media Box (Strict 16:9 Aspect Video with Full Visibility) */}
        <div 
          onClick={handleOpenPreview}
          className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center mb-2.5 cursor-pointer"
        >
          <img 
            src={coverImg} 
            alt={product.title || 'Product Cover'}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.badge && (
            <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-md z-10">
              {product.badge}
            </span>
          )}
        </div>

        {/* 2. Unified Single-Line Meta Row */}
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 my-1.5 gap-1">
          {/* Category Pill/Text */}
          <span className="text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate max-w-[95px]">
            {categoryText}
          </span>

          {/* Compact Rating & Size (No wrapping) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="flex items-center gap-0.5 text-amber-500 font-extrabold">
              ★ {ratingDisplay}
            </span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="text-slate-400 font-medium">
              {fileSizeDisplay}
            </span>
          </div>
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
      <div className="pt-2.5 mt-auto border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        {/* Left: Price Display */}
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">INSTANT ACCESS</span>
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
              {priceDisplay}
            </span>
            {originalPriceDisplay && (
              <span className="text-[10px] text-slate-400 line-through">
                {originalPriceDisplay}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions with Enlarged Primary Buy Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Compact Cart Icon */}
          <button 
            type="button"
            onClick={handleAddToCart}
            title="Add to Cart"
            aria-label="Add to Cart"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors border border-slate-200/60 dark:border-slate-700 cursor-pointer active:scale-95 shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>

          {/* Large, Prominent Buy Now Button */}
          <button 
            type="button"
            onClick={handleDirectBuy}
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:scale-95 text-white text-sm sm:text-base font-black tracking-wide rounded-xl shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <span className="text-sm sm:text-base">⚡</span>
            <span className="text-sm sm:text-base font-black">Buy</span>
          </button>
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;


