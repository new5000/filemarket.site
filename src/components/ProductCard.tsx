import React, { memo } from 'react';
import { Eye, ShoppingBag } from 'lucide-react';
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
}) => {
  const { generalConfig } = useGlobalSettings();
  const { addToCart } = useCart();
  const aspectStyle = generalConfig?.imageSizes?.productThumbRatio === '1/1' ? '1 / 1' : generalConfig?.imageSizes?.productThumbRatio === '4/3' ? '4 / 3' : '16 / 9';

  const isPhysical = product?.productKind === 'physical';
  const isService = type === 'service' || product?.type === 'service' || product?.category === 'Digital Services';

  if (!product) return null;

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
        <div>
          {/* Product Title */}
          <h3
            onClick={() => onViewDetails(product)}
            className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug hover:text-emerald-500 dark:hover:text-emerald-400 cursor-pointer transition-colors"
            title={product.title}
          >
            {product.title}
          </h3>
        </div>

        {/* 3. FOOTER PRICE & ACTIONS (Tightly Connected) */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60">
          <div>
            <div className="flex items-baseline gap-1">
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

