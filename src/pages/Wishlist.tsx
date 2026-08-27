import { formatDirectImageUrl } from '../utils/formatImageUrl';
import React from 'react';
import { Product } from '../types';
import { navigateTo, getProductSlug } from '../router';
import { getAuthStatus } from '../lib/authGuard';
import { Heart, Trash2, Eye, Download, ArrowLeft, Search } from 'lucide-react';

export interface WishlistProps {
  wishlistItems?: Product[] | any[];
  onRemoveFromWishlist?: (id: string) => void;
  onAddToCart?: (product: Product | any) => void;
  onViewDetails?: (product: Product | any) => void;
}

export default function Wishlist({ 
  wishlistItems = [], 
  onRemoveFromWishlist, 
  onAddToCart,
  onViewDetails
}: WishlistProps) {

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo('/', { title: 'FileMarket — Digital Assets Marketplace' });
    }
  };

  const handleNavigateToProduct = (product: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (onViewDetails) {
      onViewDetails(product);
      return;
    }
    const productId = product.id || product.productId;
    const slug = product.title ? getProductSlug(product) : productId;
    navigateTo(`/product/${slug}`, { title: `${product.title || 'Product'} — FileMarket` });
  };

  const handleWishlistBuy = (product: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (onAddToCart) {
      onAddToCart(product);
      return;
    }

    const productId = product.id || product.productId;
    const slug = product.title ? getProductSlug(product) : productId;
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

  const handleRemove = (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const productId = product.id || product.productId;
    if (onRemoveFromWishlist && productId) {
      onRemoveFromWishlist(productId);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="w-full max-w-5xl mx-auto px-4 py-6 sm:p-8 space-y-6 box-border">
        
        {/* Header Section */}
        <div className="pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Your Wishlist
              </h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              These are the premium digital assets you have saved. Ready to checkout? Purchase them instantly and get lifetime Google Drive access.
            </p>
          </div>
        </div>

        {/* Empty State */}
        {wishlistItems.length === 0 ? (
          <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 text-center shadow-sm space-y-4 box-border">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-sm">
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
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold rounded-2xl text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Explore Products</span>
            </button>
          </div>
        ) : (
          /* Wishlist Items Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {wishlistItems.map((product) => {
              const productId = product.id || product.productId;
              const title = product.title || 'Digital Asset';
              const price = product.priceBDT || product.price || 0;
              const thumbnail = product.thumbnail || product.image;

              return (
                <div 
                  key={productId}
                  onClick={() => handleNavigateToProduct(product)}
                  className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/50 rounded-3xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-200 cursor-pointer box-border relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex gap-3.5 items-start">
                      {thumbnail ? (
                        <div 
                          onClick={(e) => handleNavigateToProduct(product, e)}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shrink-0 bg-slate-950 relative group/thumb cursor-pointer"
                        >
                          <img 
                            src={formatDirectImageUrl(thumbnail) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'} 
                            alt={title} 
                            className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div 
                          onClick={(e) => handleNavigateToProduct(product, e)}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl shrink-0 cursor-pointer"
                        >
                          🎁
                        </div>
                      )}

                      <div className="space-y-1 min-w-0 flex-1">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate max-w-full">
                          {product.category || 'Digital Asset'}
                        </span>
                        <h3 
                          onClick={(e) => handleNavigateToProduct(product, e)}
                          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug cursor-pointer"
                          title={title}
                        >
                          {title}
                        </h3>
                        <div className="flex items-baseline gap-1.5 pt-0.5">
                          <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                            ৳{price.toLocaleString('en-BD')} BDT
                          </span>
                          {product.originalPriceBDT && (
                            <span className="text-[10px] text-slate-400 line-through">
                              ৳{product.originalPriceBDT.toLocaleString('en-BD')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80">
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={(e) => handleRemove(product, e)}
                      className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition cursor-pointer min-h-[42px] min-w-[42px] flex items-center justify-center"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Quick Preview Button */}
                    <button
                      type="button"
                      onClick={(e) => handleNavigateToProduct(product, e)}
                      className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/10 text-slate-700 dark:text-slate-300 hover:text-emerald-500 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer min-h-[42px] min-w-[42px] flex items-center justify-center"
                      title="View product details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Instant Buy Button */}
                    <button
                      type="button"
                      onClick={(e) => handleWishlistBuy(product, e)}
                      className="relative overflow-hidden flex-1 py-2.5 px-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:brightness-105 active:scale-95 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition animate-neon-halo shadow-md cursor-pointer min-h-[42px]"
                      title="Buy now"
                    >
                      <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-sweep-light pointer-events-none" />
                      <Download className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">Buy Now</span>
                    </button>
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

