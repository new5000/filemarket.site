import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../data/products';
import { useGlobalSettings } from '../context/GlobalSettingsContext';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  productsCounts?: Record<string, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = memo(({
  selectedCategory,
  onSelectCategory,
  productsCounts,
}) => {
  const { globalConfig } = useGlobalSettings();
  const cmsCategories = globalConfig?.categories || [];

  let rawNames: string[] = cmsCategories.length > 0
    ? cmsCategories.map(c => (typeof c === 'string' ? c : c.name))
    : [...CATEGORIES];

  rawNames = rawNames.filter(c => c !== 'All Products');
  if (!rawNames.includes('Digital Services')) {
    rawNames.unshift('Digital Services');
  } else {
    rawNames = ['Digital Services', ...rawNames.filter(c => c !== 'Digital Services')];
  }

  const displayCategories = ['All Products', ...rawNames];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const getCategoryIcon = (catName: string) => {
    const matchedCms = cmsCategories.find(c => c.name === catName);
    if (matchedCms && matchedCms.iconEmoji) {
      return matchedCms.iconEmoji;
    }

    switch (catName) {
      case 'All Products':
        return '🔥';
      case 'Digital Services':
        return '🛠️';
      case 'Video Bundles':
        return '🎬';
      case 'Online Courses':
        return '🎓';
      case 'E-Books':
        return '📚';
      case 'Premium Apps':
        return '📱';
      case 'Premium PC Software':
        return '💻';
      case 'AI Prompts':
        return '🤖';
      case 'PHP Scripts':
        return '⚡';
      case 'Blogger Templates':
        return '💎';
      case 'Others':
        return '📦';
      default:
        return '✨';
    }
  };

  const checkScrollability = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScrollability();
    const handleResize = () => checkScrollability();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkScrollability]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkScrollability, 350);
    }
  };

  const handleCategoryClick = (cat: string, e: React.MouseEvent<HTMLButtonElement>) => {
    onSelectCategory(cat);
    e.currentTarget.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  };

  return (
    <section id="categories-section" className="relative w-full z-10 select-none">
      {/* 100% Transparent Container */}
      <div className="w-full bg-transparent py-3 relative">
        
        {/* Left Scroll Navigation Button (Desktop) */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleScroll('left')}
              aria-label="Scroll Categories Left"
              className="absolute -left-2 top-1/2 -translate-y-1/2 z-30 hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer group"
            >
              <ChevronLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Scrollable Ribbon Track */}
        <div
          ref={scrollRef}
          onScroll={checkScrollability}
          className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar scrollbar-none scroll-smooth snap-x snap-mandatory px-1 sm:px-0 py-1.5 focus:outline-none w-full max-w-full whitespace-nowrap"
        >
          {displayCategories.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = productsCounts ? productsCounts[cat] : undefined;

            return (
              <button
                key={cat}
                type="button"
                onClick={(e) => handleCategoryClick(cat, e)}
                className={`relative flex-shrink-0 snap-center shrink-0 whitespace-nowrap inline-flex items-center justify-center px-4.5 py-2.5 sm:px-5 sm:py-2.5 rounded-full text-sm sm:text-base transition-colors duration-200 active:scale-95 cursor-pointer select-none outline-none ${
                  isSelected
                    ? 'text-slate-950 font-black z-10'
                    : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-400/80 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                {/* Smooth Framer Motion Active Background */}
                {isSelected && (
                  <motion.div
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full shadow-md shadow-emerald-500/30 -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Micro-Icon */}
                <span className="relative z-10 text-base sm:text-lg mr-1.5 inline-block shrink-0 leading-none select-none">
                  {getCategoryIcon(cat)}
                </span>

                {/* Category Label */}
                <span className="relative z-10 font-extrabold tracking-tight whitespace-nowrap leading-none">
                  {cat}
                </span>

                {/* Micro Counter / Badge */}
                {cat === 'All Products' ? (
                  <span
                    className={`relative z-10 ml-2 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-black transition-colors ${
                      isSelected
                        ? 'bg-black/15 text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{count ?? 'HOT'}</span>
                  </span>
                ) : count !== undefined ? (
                  <span
                    className={`relative z-10 ml-2 px-2 py-0.5 rounded-full text-xs font-black transition-colors ${
                      isSelected
                        ? 'bg-black/15 text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Right Scroll Navigation Button (Desktop) */}
        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleScroll('right')}
              aria-label="Scroll Categories Right"
              className="absolute -right-2 top-1/2 -translate-y-1/2 z-30 hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer group"
            >
              <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
});

CategoryFilter.displayName = 'CategoryFilter';

