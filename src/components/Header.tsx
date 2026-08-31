import React, { memo, useMemo } from 'react';
import { Menu, Search, ShoppingBag } from 'lucide-react';
import { Currency } from '../types';
import { useBrand } from '../context/BrandContext';
import { useCart } from '../context/CartContext';
import { formatDirectImageUrl } from '../utils/formatImageUrl';

interface HeaderProps {
  darkMode?: boolean;
  setDarkMode?: (value: boolean | ((prev: boolean) => boolean)) => void;
  currency?: Currency;
  setCurrency?: (currency: Currency) => void;
  onOpenXmlStudio?: () => void;
  onOpenProfile?: () => void;
  onOpenDrawer?: () => void;
  onOpenSearch?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = memo(({
  onOpenDrawer,
  onOpenSearch,
}) => {
  const { logoUrl, brandName } = useBrand();
  const { totalItemsCount, setIsCartDrawerOpen } = useCart();

  // Dynamic dual-tone split for any admin-configured brand name
  const currentBrand = (brandName || 'FileMarket').trim();

  const { brandFirst, brandSecond } = useMemo(() => {
    const name = currentBrand;
    if (name.includes(' ')) {
      const parts = name.split(/\s+/);
      const second = parts.pop() || '';
      return { brandFirst: parts.join(' '), brandSecond: second };
    }
    const camelMatch = name.match(/^([A-Z][a-z0-9]+)([A-Z][a-z0-9]+.*)$/);
    if (camelMatch) {
      return { brandFirst: camelMatch[1], brandSecond: camelMatch[2] };
    }
    if (name.length > 5) {
      const mid = Math.ceil(name.length / 2);
      return { brandFirst: name.slice(0, mid), brandSecond: name.slice(mid) };
    }
    return { brandFirst: name, brandSecond: '' };
  }, [currentBrand]);

  const initials = useMemo(() => {
    return currentBrand
      .split(/\s+/)
      .map(w => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || currentBrand.slice(0, 2).toUpperCase() || 'FM';
  }, [currentBrand]);

  return (
    <header className="relative w-full backdrop-blur-xl bg-white/95 dark:bg-[#0B0F19]/95 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white transition-colors duration-300 z-[9999]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-[4.25rem] sm:min-h-[4.75rem] py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 w-full">
        
        {/* Large Prominent Brand Logo & Name with Subtle Professional Glow */}
        <a
          href="/"
          className="flex items-center gap-2.5 sm:gap-4 shrink min-w-0 select-none group outline-hidden"
          aria-label={`${currentBrand} Home`}
        >
          {/* Logo Container with Smooth Radiant Backlight Light Beams */}
          <div className="relative flex items-center justify-center shrink-0">
            {/* Outer Blooming Radiant Light Aura (Emerald, Teal & Cyan Glow - Soft & Balanced) */}
            <div className="absolute -inset-2.5 sm:-inset-3 rounded-3xl bg-gradient-to-tr from-emerald-500/80 via-teal-400/70 to-cyan-400/60 blur-lg sm:blur-xl opacity-45 sm:opacity-55 animate-radiant-bloom pointer-events-none transition-all duration-500 group-hover:opacity-80 group-hover:blur-xl" />
            
            {/* Core Light Beam Pulse */}
            <div className="absolute -inset-1 sm:-inset-1.5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 blur-sm sm:blur-md opacity-50 animate-radiant-pulse pointer-events-none" />

            {/* Prominently Enlarged Logo Badge */}
            {logoUrl ? (
              <img
                src={formatDirectImageUrl(logoUrl)}
                alt={currentBrand}
                className="relative z-10 h-11 w-11 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] rounded-xl sm:rounded-3xl object-contain shadow-2xl ring-2 ring-emerald-400/60 dark:ring-emerald-400/70 bg-slate-900/80 p-0.5 transition-transform duration-300 group-hover:scale-105 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="relative z-10 h-11 w-11 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem] rounded-xl sm:rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-base sm:text-2xl md:text-3xl shadow-2xl shadow-emerald-500/30 ring-2 ring-emerald-400/60 transition-transform duration-300 group-hover:scale-105 shrink-0">
                {initials}
              </div>
            )}
          </div>

          {/* Large Bold Brand Name */}
          <div className="relative flex items-center font-heading text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-[2.6rem] font-black tracking-tight select-none leading-none truncate py-1">
            {/* First Part of Brand Name */}
            <span className="relative z-10 text-black dark:text-white transition-all duration-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
              {brandFirst}
            </span>

            {/* Second Part of Brand Name with Deep Rich Emerald Gradient */}
            {brandSecond && (
              <span className="relative z-10 ml-1 sm:ml-1.5 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-800 dark:from-emerald-400 dark:via-emerald-300 dark:to-teal-300 bg-clip-text text-transparent animate-brand-gradient font-black transition-all duration-300 group-hover:brightness-110">
                {brandSecond}
              </span>
            )}
          </div>
        </a>

        {/* Right Side Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Cart Drawer Trigger Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsCartDrawerOpen(true);
            }}
            aria-label="Open Cart"
            className="relative w-[40px] h-[40px] rounded-xl bg-slate-100 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-emerald-400 hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-md shrink-0"
          >
            <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md animate-in zoom-in duration-200">
                {totalItemsCount > 99 ? '99+' : totalItemsCount}
              </span>
            )}
          </button>

          {/* Search Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenSearch?.();
            }}
            aria-label="Open Search"
            className="w-[40px] h-[40px] rounded-xl bg-slate-100 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-emerald-400 hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-md shrink-0"
          >
            <Search className="w-5 h-5 stroke-[2.2]" />
          </button>

          {/* Hamburger Menu (3-Line Icon ☰) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onOpenDrawer?.();
            }}
            aria-label="Open Navigation Menu"
            className="w-[40px] h-[40px] rounded-xl bg-slate-100 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-emerald-400 hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow-md shrink-0"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

      </div>
    </header>
  );
});

Header.displayName = 'Header';
export default Header;
