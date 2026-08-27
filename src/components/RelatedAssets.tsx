import React, { useEffect, useState, useRef } from 'react';
import { Product, Currency } from '../types';
import { useProducts } from '../context/ProductContext';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { motion, AnimatePresence } from 'motion/react';

interface RelatedAssetsProps {
  category: string;
  currentProductId: string;
  currency: Currency;
  onInstantBuy: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  savedProducts?: string[];
  onToggleSave?: (productId: string) => void;
}

const RelatedAssets: React.FC<RelatedAssetsProps> = ({ 
  category, 
  currentProductId, 
  currency, 
  onInstantBuy, 
  onSelectProduct, 
  savedProducts, 
  onToggleSave 
}) => {
  const { products } = useProducts();
  const [related, setRelated] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [direction, setDirection] = useState(1);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const items = products.filter(p => p.category === category && p.id !== currentProductId).slice(0, 30);
    const fallback = items.length >= 3 ? items : products.filter(p => p.id !== currentProductId).slice(0, 30);
    setRelated(fallback);
  }, [category, currentProductId, products]);

  // Reset page when switching products
  useEffect(() => {
    setCurrentPage(1);
  }, [currentProductId]);

  if (related.length === 0) return null;

  const totalPages = Math.ceil(Math.min(related.length, 30) / ITEMS_PER_PAGE); // Max 3 pages
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = related.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleNext = () => {
    if (currentPage < totalPages) {
      setDirection(1);
      setCurrentPage(prev => prev + 1);
      scrollToSection();
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setDirection(-1);
      setCurrentPage(prev => prev - 1);
      scrollToSection();
    }
  };

  const scrollToSection = () => {
    if (sectionRef.current) {
      const top = sectionRef.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <div ref={sectionRef} className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 scroll-mt-20">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Similar Assets &amp; AI Recommendations</span>
        </h3>
        <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          ✨ Best Match
        </span>
      </div>
      
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={currentPage}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5"
          >
            {currentItems.map(rec => (
              <div key={rec.id} className="recommendations-grid-item">
                <ProductCard
                  product={rec}
                  currency={currency}
                  onInstantBuy={onInstantBuy}
                  onViewDetails={() => onSelectProduct && onSelectProduct(rec)}
                  isSaved={savedProducts?.includes(rec.id) || false}
                  onToggleSave={onToggleSave}
                />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 sm:gap-4 pt-6 pb-2">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="group flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed active:scale-95
                     bg-slate-100 text-slate-700 hover:bg-slate-200 border border-transparent
                     dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:shadow-[0_0_15px_rgba(16,185,129,0.35)] dark:hover:border-emerald-400"
          >
            <ChevronLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          
          <div className="flex items-center justify-center px-4 py-2 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800/60 shadow-inner">
            <span className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
              Page{' '}
              <span className="inline-block relative w-3 text-center font-bold text-slate-800 dark:text-slate-200">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={currentPage}
                    initial={{ opacity: 0, y: direction > 0 ? 10 : -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: direction > 0 ? -10 : 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    {currentPage}
                  </motion.span>
                </AnimatePresence>
                {/* Invisible spacer to maintain width */}
                <span className="invisible">{currentPage}</span>
              </span>{' '}
              of {totalPages}
            </span>
          </div>

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="group flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 border border-transparent
                     bg-emerald-600 text-white shadow-md shadow-emerald-900/30 hover:bg-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.35)] hover:border-emerald-400"
          >
            <span className="hidden sm:inline">Next Assets</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default RelatedAssets;
