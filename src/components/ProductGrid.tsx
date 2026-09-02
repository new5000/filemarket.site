import React, { useState, useEffect } from 'react';
import { Product, Currency } from '../types';
import { ProductCard } from './ProductCard';
import { Sparkles } from 'lucide-react';
import { useGlobalSettings } from '../context/GlobalSettingsContext';

interface ProductGridProps {
  products?: Product[];
  selectedCategory: string;
  searchQuery: string;
  currency: Currency;
  onInstantBuy: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  savedProducts?: string[];
  onToggleSave?: (productId: string) => void;
  isLoading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = React.memo(({
  products,
  selectedCategory,
  searchQuery,
  currency,
  onInstantBuy,
  onViewDetails,
  savedProducts,
  onToggleSave,
  isLoading = false,
}) => {
  const { globalConfig } = useGlobalSettings();

  const safeProducts = Array.isArray(products) ? products : [];
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  // Reset pagination when category or search changes
  useEffect(() => {
    setVisibleCount(12);
  }, [selectedCategory, searchQuery]);

  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 12);
      setIsLoadingMore(false);
    }, 250);
  };

  const displayedProducts = safeProducts.slice(0, visibleCount);

  const productGridHeading = 'Featured Verified Assets';
  const loadMoreText = 'Load More Assets';

  return (
    <div className="space-y-6">
      {/* Section Header with Category */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-heading text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>
              {searchQuery
                ? `Search results for "${searchQuery}"`
                : selectedCategory === 'All Products'
                ? productGridHeading
                : selectedCategory}
            </span>
          </h2>
        </div>
      </div>

      {/* Grid of Products */}
      {isLoading ? (
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 w-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-3.5 border border-slate-100 dark:border-slate-800 animate-pulse flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="aspect-video w-full rounded-xl bg-slate-200 dark:bg-slate-800 mb-2.5" />
                <div className="flex items-center justify-between my-1.5">
                  <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded mt-2 mb-1" />
                <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="pt-2.5 mt-auto border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="h-2 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  <div className="w-16 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayedProducts && displayedProducts.length > 0 ? (
        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 w-full">
          {displayedProducts.map((product) => {
            if (!product || !product.id) return null;

            return (
              <ProductCard
                key={product.id}
                product={product}
                currency={currency}
                onInstantBuy={onInstantBuy}
                onViewDetails={onViewDetails}
                isSaved={Array.isArray(savedProducts) && savedProducts.includes(product.id)}
                onToggleSave={onToggleSave}
              />
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="text-4xl">🔍</div>
          <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
            No products found matching your search
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try searching for a different keyword or browse through our categories.
          </p>
        </div>
      )}

      {/* Load More Button */}
      {visibleCount < safeProducts.length && (
        <div className="flex justify-center w-full mt-8">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="group px-8 py-3 rounded-xl font-heading font-bold text-sm sm:text-base bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700/60 text-white shadow-lg shadow-emerald-900/20 active:scale-98 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoadingMore ? (
              <>
                <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Loading next assets...</span>
              </>
            ) : (
              <span>{loadMoreText}</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';

export default ProductGrid;
