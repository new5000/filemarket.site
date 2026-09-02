import React from 'react';
import { formatDirectImageUrl } from '../utils/formatImageUrl';
import { Product, Currency } from '../types';
import { navigateTo, getProductSlug } from '../router';
import { getAuthStatus } from '../lib/authGuard';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useSavedProducts } from '../hooks/useSavedProducts';
import { 
  Heart, 
  Trash2, 
  Eye as EyeIcon, 
  ShoppingBag as ShoppingBagIcon, 
  Download, 
  Search, 
  ShieldCheck, 
  Star, 
  Package 
} from 'lucide-react';

export interface WishlistProps {
  wishlistItems?: Product[] | any[];
  savedProductIds?: string[];
  onRemoveFromWishlist?: (id: string) => void;
  onToggleSave?: (id: string) => void;
  onAddToCart?: (product: Product | any) => void;
  onViewDetails?: (product: Product | any) => void;
  onSelectProduct?: (product: Product | any) => void;
  onOpenPreview?: (product: Product | any) => void;
  onDirectBuy?: (product: Product | any) => void;
  onInstantBuy?: (product: Product | any) => void;
  currency?: Currency;
  isOpen?: boolean;
  onClose?: () => void;
  onExploreStore?: () => void;
}

export default function Wishlist({ 
  wishlistItems, 
  savedProductIds,
  onRemoveFromWishlist, 
  onToggleSave,
  onAddToCart,
  onViewDetails,
  onSelectProduct,
  onOpenPreview,
  onDirectBuy,
  onInstantBuy,
  currency = 'BDT',
  onClose,
  onExploreStore
}: WishlistProps) {
  const { addToCart } = useCart();
  const { products } = useProducts();
  const { savedProducts: hookSavedIds, toggleProduct: hookToggleSave } = useSavedProducts();

  // Determine items to display: prioritize wishlistItems prop, then savedProductIds, then hookSavedIds
  const itemsToRender: Product[] = React.useMemo(() => {
    if (Array.isArray(wishlistItems) && wishlistItems.length > 0) {
      return wishlistItems;
    }
    const ids = savedProductIds || hookSavedIds || [];
    if (ids.length > 0 && Array.isArray(products)) {
      return products.filter(p => ids.includes(p.id));
    }
    return Array.isArray(wishlistItems) ? wishlistItems : [];
  }, [wishlistItems, savedProductIds, hookSavedIds, products]);

  const handleGoBack = () => {
    if (onClose) {
      onClose();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo('/', { title: 'FileMarket — Digital Assets Marketplace' });
    }
  };

  const handleSelectProduct = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('a')) {
        return;
      }
    }
    
    if (onSelectProduct) {
      onSelectProduct(product);
      return;
    }
    if (onViewDetails) {
      onViewDetails(product);
      return;
    }
    const slug = getProductSlug(product);
    navigateTo(`/product/${slug}`, { title: `${product.title || 'Product'} — FileMarket` });
  };

  const handleOpenWatchPreview = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onOpenPreview) {
      onOpenPreview(product);
      return;
    }
    if (onViewDetails) {
      onViewDetails(product);
      return;
    }
    const slug = getProductSlug(product);
    navigateTo(`/watch-preview/${slug}`, { title: `Watch Preview: ${product.title || 'Product'} — FileMarket` });
  };

  const handleAddToCartClick = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      addToCart(product);
    }
  };

  const handleDirectBuyClick = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onDirectBuy) {
      onDirectBuy(product);
      return;
    }
    if (onInstantBuy) {
      onInstantBuy(product);
      return;
    }

    const slug = getProductSlug(product);
    const checkoutPath = `/checkout/${slug}`;
    const authStatus = getAuthStatus();

    if (!authStatus.isLoggedIn) {
      sessionStorage.setItem('auth_redirect_url', checkoutPath);
      navigateTo('/login', {
        state: { from: checkoutPath, product, message: 'Please sign in or create an account to complete checkout!' },
        title: 'Sign In — FileMarket'
      });
    } else {
      navigateTo(checkoutPath, { title: `Checkout ${product.title || 'Digital Asset'} — FileMarket` });
    }
  };

  const handleRemove = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const productId = product.id || (product as any).productId;
    if (onRemoveFromWishlist && productId) {
      onRemoveFromWishlist(productId);
    } else if (onToggleSave && productId) {
      onToggleSave(productId);
    } else if (productId) {
      hookToggleSave(productId);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="w-full max-w-6xl mx-auto px-4 py-6 sm:p-8 space-y-6 box-border">
        
        {/* Header Section */}
        <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Your Wishlist
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {itemsToRender.length} {itemsToRender.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              These are the premium digital assets you have saved. Ready to checkout? Purchase them instantly and get lifetime Google Drive access.
            </p>
          </div>

          {onExploreStore && (
            <button
              type="button"
              onClick={onExploreStore}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition cursor-pointer self-start sm:self-center"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Browse Marketplace</span>
            </button>
          )}
        </div>

        {/* Empty State */}
        {itemsToRender.length === 0 ? (
          <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-xs space-y-4 box-border">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-xs">
              <Heart className="w-8 h-8 fill-rose-500/20" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                You haven&apos;t saved any products yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Browse our premium store and click the heart icon on any digital product to add it to your lifetime wishlist.
              </p>
            </div>

            <button
              type="button"
              onClick={onExploreStore || handleGoBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold rounded-2xl text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Explore Products</span>
            </button>
          </div>
        ) : (
          /* Wishlist Items Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {itemsToRender.map((product) => {
              const productId = product.id || (product as any).productId;
              const title = product.title || 'Digital Asset';
              const priceDisplay = currency === 'USD'
                ? `$${(product.priceUSD ?? 0).toFixed(0)}`
                : `৳${(product.priceBDT ?? (product as any).salePrice ?? (product as any).price ?? 0).toLocaleString('en-BD')} BDT`;
              const originalPriceDisplay = currency === 'USD'
                ? (product.originalPriceBDT ? `$${((product.priceUSD || 0) * 2).toFixed(0)}` : null)
                : (product.originalPriceBDT ? `৳${product.originalPriceBDT.toLocaleString('en-BD')}` : (product as any).originalPrice ? `৳${(product as any).originalPrice}` : null);
              const thumbnail = (product as any).coverImage || product.thumbnail || (product as any).image;
              const categoryText = product.category || 'DIGITAL ASSET';
              const likesDisplay = product.likesCount ? String(product.likesCount) : ((product as any).likes || '4.1k');
              const ratingDisplay = product.rating ? String(product.rating) : ((product as any).rating || '4.9');
              const fileSizeDisplay = product.fileSize || ((product as any).fileSize || 'Instant Drive');
              const licenseText = (product as any).licenseBadge || product.license || 'Personal Lifetime License';

              return (
                <div 
                  key={productId}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelectProduct(product, e); // Open Product Details View
                  }}
                  className="group cursor-pointer bg-white dark:bg-slate-900 rounded-2xl p-2.5 sm:p-3.5 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/50 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 box-border relative overflow-hidden"
                >
                  {/* Upper Content Wrap */}
                  <div>
                    {/* 1. Thumbnail Media Box */}
                    <div 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenWatchPreview(product, e);
                      }}
                      className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center mb-2.5 cursor-pointer group/thumb"
                    >
                      <img 
                        src={formatDirectImageUrl(thumbnail) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'} 
                        alt={title} 
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Top Badges */}
                      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none z-10">
                        {product.badge ? (
                          <span className="bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-md">
                            {product.badge}
                          </span>
                        ) : <span />}
                        
                        <button
                          type="button"
                          onClick={(e) => handleRemove(product, e)}
                          title="Remove from wishlist"
                          className="pointer-events-auto p-1.5 rounded-lg bg-slate-900/80 hover:bg-rose-600 text-white/80 hover:text-white backdrop-blur-md transition shadow-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* 2. Category & Stats */}
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 gap-1 flex-wrap">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider truncate max-w-[110px]">
                        {categoryText}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="flex items-center gap-0.5 text-rose-500">
                          <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500 inline" /> {likesDisplay}
                        </span>
                        <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500 inline" /> {ratingDisplay}
                        </span>
                        <span className="flex items-center gap-0.5 text-slate-400">
                          <Package className="w-2.5 h-2.5 inline" /> {fileSizeDisplay}
                        </span>
                      </div>
                    </div>

                    {/* 3. Product Title */}
                    <h3 
                      onClick={(e) => {
                        e.preventDefault();
                        handleSelectProduct(product, e);
                      }}
                      className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-2 leading-snug mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                      title={title}
                    >
                      {title}
                    </h3>

                    {/* Verified License Badge */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-3 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 rounded-md w-fit">
                      <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                      <span className="truncate">{licenseText}</span>
                    </div>
                  </div>

                  {/* Bottom Footer: Price & Action Buttons Row */}
                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-auto gap-1.5">
                    {/* Price Breakdown */}
                    <div className="flex flex-col">
                      <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">INSTANT DRIVE</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                          {priceDisplay}
                        </span>
                        {originalPriceDisplay && (
                          <span className="text-[9px] text-slate-400 line-through">
                            {originalPriceDisplay}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center gap-1 mt-auto pt-0">
                      {/* 1. Watch Preview Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation(); // Stop parent card click
                          handleOpenWatchPreview(product, e); // Open Dedicated Watch Preview Page/Modal
                        }}
                        title="Watch Preview"
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors border border-slate-200/60 dark:border-slate-700 cursor-pointer active:scale-95 shrink-0"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                      </button>

                      {/* 2. Add to Cart Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddToCartClick(product, e); // Add to cart with success toast, DO NOT redirect to home
                        }}
                        title="Add to Cart"
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors border border-slate-200/60 dark:border-slate-700 cursor-pointer active:scale-95 shrink-0"
                      >
                        <ShoppingBagIcon className="w-3.5 h-3.5" />
                      </button>

                      {/* 3. Direct Buy Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDirectBuyClick(product, e); // Open Direct Checkout modal for this item
                        }}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
                      >
                        Buy
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}


