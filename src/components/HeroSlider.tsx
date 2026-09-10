import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Currency } from '../types';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { formatDirectImageUrl } from '../utils/formatImageUrl';
import { navigateTo } from '../router';

interface HeroSliderProps {
  currency?: Currency;
  onSelectCategory?: (category: string) => void;
  onInstantBuy?: (product: any) => void;
  onViewDetails?: (product: any) => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = memo(({
  onSelectCategory,
}) => {
  const { heroBanners } = useGlobalSettings();

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const isMouseDown = useRef<boolean>(false);
  const minSwipeDistance = 45; // Minimum pixel drag to trigger slide change
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const banners = heroBanners?.isEnabled && heroBanners?.banners ? heroBanners.banners : [];
  const totalSlides = banners.length;
  const autoPlayInterval = heroBanners?.autoPlayInterval || 5000;

  const nextSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Autoplay handler with configurable interval (pauses when touching or dragging)
  useEffect(() => {
    if (totalSlides === 0 || isPaused) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      nextSlide();
    }, autoPlayInterval);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPaused, nextSlide, autoPlayInterval, totalSlides]);

  // Touch Handlers for Mobile Devices
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) {
      touchStartX.current = 0;
      touchEndX.current = 0;
      return;
    }

    const distanceX = touchStartX.current - touchEndX.current;
    const distanceY = Math.abs((touchStartY.current || 0) - (touchEndY.current || 0));

    // Valid horizontal swipe: horizontal distance exceeds minimum threshold and exceeds vertical motion
    if (Math.abs(distanceX) > minSwipeDistance && Math.abs(distanceX) > distanceY) {
      if (distanceX > 0) {
        nextSlide(); // Swiped left -> show next
      } else {
        prevSlide(); // Swiped right -> show previous
      }
    }

    // Reset touch coordinates
    touchStartX.current = 0;
    touchEndX.current = 0;
    touchStartY.current = 0;
    touchEndY.current = 0;
  };

  // Optional Mouse Drag Handlers for Desktop Touch/Trackpad
  const handleMouseDown = (e: React.MouseEvent) => {
    isMouseDown.current = true;
    setIsPaused(true);
    touchStartX.current = e.clientX;
    touchEndX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown.current) return;
    touchEndX.current = e.clientX;
  };

  const handleMouseUp = () => {
    if (!isMouseDown.current) return;
    isMouseDown.current = false;
    setIsPaused(false);
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleBannerClick = (e: React.MouseEvent, actionLink?: string) => {
    e.stopPropagation(); // Prevent carousel swipe/scroll conflict

    const scrollToStore = () => {
      const targetEl = document.getElementById('categories-section') || document.getElementById('products-section');
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    if (!actionLink || !actionLink.trim() || actionLink.trim() === '#') {
      scrollToStore();
      return;
    }

    const trimmed = actionLink.trim();

    // 1. Handle external links (WhatsApp, Google Drive, Telegram, external website URLs)
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('//')
    ) {
      window.open(trimmed, '_blank', 'noopener,noreferrer');
      return;
    }

    if (
      trimmed.startsWith('mailto:') ||
      trimmed.startsWith('tel:') ||
      trimmed.startsWith('whatsapp:')
    ) {
      window.location.href = trimmed;
      return;
    }

    const lower = trimmed.toLowerCase();

    // 2. Handle category links (e.g. /category/scripts, category:apps, #category)
    if (
      lower.startsWith('/category/') ||
      lower.startsWith('category:') ||
      lower.startsWith('#category') ||
      lower.includes('/category')
    ) {
      if (onSelectCategory) {
        if (lower.includes('script') || lower.includes('php')) {
          onSelectCategory('PHP Scripts');
        } else if (lower.includes('graphic') || lower.includes('asset') || lower.includes('vector') || lower.includes('service')) {
          onSelectCategory('Digital Services');
        } else if (lower.includes('app') || lower.includes('mobile')) {
          onSelectCategory('Premium Apps');
        } else if (lower.includes('software') || lower.includes('pc')) {
          onSelectCategory('Premium PC Software');
        } else if (lower.includes('course')) {
          onSelectCategory('Online Courses');
        } else if (lower.includes('book') || lower.includes('ebook')) {
          onSelectCategory('E-Books');
        } else if (lower.includes('video') || lower.includes('bundle')) {
          onSelectCategory('Video Bundles');
        } else if (lower.includes('blogger') || lower.includes('template')) {
          onSelectCategory('Blogger Templates');
        } else if (lower.includes('prompt') || lower.includes('ai')) {
          onSelectCategory('AI Prompts');
        } else {
          onSelectCategory('All Products');
        }
      }

      scrollToStore();
      return;
    }

    // 3. Handle page anchors (e.g. #categories-section, #products-section, #faq)
    if (trimmed.startsWith('#')) {
      const el = document.getElementById(trimmed.replace(/^#/, ''));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      scrollToStore();
      return;
    }

    // 4. Handle internal SPA routing (Product page, Checkout, Profile, Orders, Locker, Admin, Policy, etc.)
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    navigateTo(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (totalSlides === 0) {
    return null;
  }

  return (
    <section 
      aria-label="Promotional Hero Banners"
      className="w-full mb-0 select-none touch-pan-y"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => {
        setIsPaused(false);
        if (isMouseDown.current) {
          isMouseDown.current = false;
          touchStartX.current = 0;
          touchEndX.current = 0;
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* 1. ORIGINAL FULL-BLEED BANNER CARD CONTAINER */}
      <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800 aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9] min-h-[220px] sm:min-h-[300px] flex items-end group select-none">
        
        {/* Slides Track */}
        <div 
          className="absolute inset-0 w-full h-full flex transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform select-none"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((slide, idx) => {
            const isCurrent = idx === currentIndex;

            return (
              <div 
                key={slide.id || idx}
                className="relative w-full h-full shrink-0 overflow-hidden cursor-pointer select-none"
                onClick={(e) => handleBannerClick(e, slide.actionLink)}
              >
                {/* Full Background Image */}
                <img
                  src={formatDirectImageUrl(slide.imageUrl) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1400&q=80'}
                  alt={slide.headline}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out pointer-events-none select-none"
                />

                {/* 2. CINEMATIC GRADIENT OVERLAY (POINTER EVENTS NONE) */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent pointer-events-none z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-transparent to-transparent pointer-events-none hidden sm:block z-10" />

                {/* 3. CLEAN BOTTOM-ALIGNED CONTENT */}
                {slide.subtext && (
                  <div className="relative z-20 pointer-events-auto p-5 sm:p-7 md:p-8 w-full h-full flex flex-col justify-end items-start">
                    <p className={`text-xs sm:text-sm text-slate-300 mt-1 line-clamp-1 max-w-xl hidden sm:block transition-all duration-700 delay-200 ${
                      isCurrent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                    }`}>
                      {slide.subtext}
                    </p>
                  </div>
                )}

              </div>
            );
          })}
        </div>

        {/* 4. SLIDER CONTROLS & PAGINATION */}
        {/* Dots at bottom-center: absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 select-none">
          {banners.map((_, dotIdx) => {
            const isActive = dotIdx === currentIndex;
            return (
              <button
                key={dotIdx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(dotIdx);
                }}
                aria-label={`Go to slide ${dotIdx + 1}`}
                className={`transition-all duration-300 rounded-full h-1.5 cursor-pointer ${
                  isActive
                    ? 'w-6 bg-emerald-500'
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            );
          })}
        </div>

      </div>
    </section>
  );
});

HeroSlider.displayName = 'HeroSlider';

export const HeroBannerSlider = HeroSlider;
export default HeroSlider;
