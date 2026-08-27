import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Loader2, Search, ShoppingBag, Trash2, X } from 'lucide-react';
import { Currency, Product } from '../types';
import { ProductCard } from './ProductCard';
import { getAuthStatus } from '../lib/authGuard';
import { useProducts } from '../context/ProductContext';
import { navigateTo } from '../router';

interface SavedProductsPageProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  onExploreStore: () => void;
  savedProductIds: string[];
  onToggleSave: (productId: string) => void;
  onInstantBuy: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export const SavedProductsPage: React.FC<SavedProductsPageProps> = ({
  isOpen,
  onClose,
  currency,
  onExploreStore,
  savedProductIds,
  onToggleSave,
  onInstantBuy,
  onViewDetails,
}) => {
  const { products } = useProducts();
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authStatus, setAuthStatus] = useState(() => getAuthStatus());

  useEffect(() => {
    if (!isOpen) return;

    setAuthStatus(getAuthStatus());
    
    const filtered = products.filter(p => savedProductIds.includes(p.id));
    setSavedProducts(filtered);
    
    // Only simulate loading on initial open if it's currently loading
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen, savedProductIds, products]);

  // Reset loading state when closed
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(true);
    }
  }, [isOpen]);

  const handleInstantBuy = (product: Product) => {
    onClose();
    if (onInstantBuy) {
      onInstantBuy(product);
    } else {
      const authStatus = getAuthStatus();
      if (!authStatus.isLoggedIn) {
        sessionStorage.setItem('auth_redirect_url', `/checkout/${product.id}`);
        navigateTo('/login', { state: { from: `/checkout/${product.id}` } });
      } else {
        navigateTo(`/checkout/${product.id}`);
      }
    }
  };

  const handleViewDetails = (product: Product) => {
    onClose();
    if (onViewDetails) {
      onViewDetails(product);
    } else {
      navigateTo(`/product/${product.id}`);
    }
  };

  if (!isOpen) return null;

  const handleGoBack = () => {
    if (onClose) {
      onClose();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      navigateTo('/');
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-2xl flex flex-col overflow-y-auto overflow-x-hidden text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200 w-screen max-w-full box-border transition-colors duration-200">
      
      {/* Main Content Container */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-10 box-border overflow-x-hidden space-y-6">
        
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Your Wishlist
            </h1>
            <span className="px-3 py-1 bg-rose-500/10 dark:bg-rose-500/20 border border-rose-500/20 rounded-full text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0">
              {savedProducts.length} {savedProducts.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            These are the premium digital assets you have saved. Ready to checkout? Purchase them instantly and get lifetime Google Drive access.
          </p>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-70">
            <Loader2 className="w-10 h-10 animate-spin text-rose-500 mb-4" />
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading your saved products...</span>
          </div>
        ) : !authStatus.isLoggedIn ? (
          /* Unauthenticated State */
          <div className="w-full max-w-xl mx-auto mt-8 p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm box-border">
            <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">Sign in to save items</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 max-w-sm mx-auto">
              You need to create an account or sign in to build a wishlist and save your favorite products permanently.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                const currentPath = window.location.pathname + window.location.search;
                if (currentPath && currentPath !== '/login' && currentPath !== '/signup') {
                  sessionStorage.setItem('auth_redirect_url', currentPath);
                }
                navigateTo('/login', { state: { from: currentPath } });
              }}
              className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              Sign In to Continue
            </button>
          </div>
        ) : savedProducts.length > 0 ? (
          /* Grid of Saved Products */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-6">
            {savedProducts.map((product) => (
              <ProductCard
                key={product.id || (product as any).productId}
                product={product}
                currency={currency}
                onInstantBuy={handleInstantBuy}
                onViewDetails={handleViewDetails}
                isSaved={true}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="w-full max-w-xl mx-auto mt-8 p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm space-y-4 box-border">
            <div className="w-20 h-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full animate-ping bg-rose-500/10" style={{ animationDuration: '3s' }}></div>
              <Heart className="w-9 h-9 text-rose-500 fill-rose-500/20" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                You haven&apos;t saved any products yet
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                Browse our premium store and click the heart icon on any digital product to add it to your lifetime wishlist.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onExploreStore();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold rounded-2xl text-xs shadow-md shadow-emerald-500/10 transition cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Explore Products</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default SavedProductsPage;
