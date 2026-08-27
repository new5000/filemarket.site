import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, Loader2, HardDrive, Lock } from 'lucide-react';
import { useBrand } from '../context/BrandContext';
import { formatDirectImageUrl } from '../utils/formatImageUrl';
import AnimatedBrandTitle from './AnimatedBrandTitle';

export interface GlobalLoaderProps {
  statusText?: string;
  subText?: string;
  fullScreen?: boolean;
  fadeOut?: boolean;
}

export const GlobalLoader: React.FC<GlobalLoaderProps> = ({
  statusText,
  subText = 'Securing Digital Vault...',
  fullScreen = true,
  fadeOut = false,
}) => {
  const { logoUrl, brandName } = useBrand();
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);

  const statusMessages = [
    statusText || 'Securing Digital Vault...',
    'Loading Digital Assets...',
    'Verifying Licenses & Instant Access...',
    'Preparing Marketplace...',
  ];

  useEffect(() => {
    if (statusText) return;
    const interval = setInterval(() => {
      setCurrentStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [statusText]);

  const activeMessage = statusText || statusMessages[currentStatusIndex];

  const content = (
    <div className="relative flex flex-col items-center justify-center space-y-5 text-center p-6 z-10 max-w-sm mx-auto">
      {/* Glow Aura & Floating Avatar */}
      <div className="relative flex items-center justify-center my-2">
        {/* Pulsing Emerald Glow Ring */}
        <div className="absolute -inset-5 sm:-inset-7 rounded-full bg-gradient-to-r from-emerald-500/30 via-teal-500/20 to-cyan-500/30 blur-2xl animate-pulse-ring pointer-events-none" />
        
        {/* Logo Avatar Box */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xl flex items-center justify-center animate-smooth-float backdrop-blur-xl">
          <img
            src={formatDirectImageUrl(logoUrl) || "https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10"}
            alt={`${brandName} Preloader Logo`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain rounded-xl drop-shadow-md"
          />
          {/* Subtle Corner Badge */}
          <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-slate-950 rounded-full shadow-lg border-2 border-white dark:border-slate-900">
            <Lock className="w-3 h-3 stroke-[2.5]" />
          </span>
        </div>
      </div>

      {/* Brand Typography */}
      <div className="space-y-1">
        <h1 className="font-heading font-black text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
          <AnimatedBrandTitle text={brandName} />
        </h1>
      </div>

      {/* Smooth Animated Progress Bar */}
      <div className="w-56 sm:w-64 space-y-2.5">
        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800/80 overflow-hidden relative border border-slate-300/40 dark:border-slate-700/60 shadow-inner">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 animate-progress-shimmer w-full shadow-sm" />
        </div>

        {/* Subtle Dynamic Status Text */}
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 transition-all duration-300 min-h-[20px] flex items-center justify-center gap-1.5">
          <span>{activeMessage}</span>
        </p>
      </div>
    </div>
  );

  if (!fullScreen) {
    return (
      <div className="w-full py-12 flex items-center justify-center bg-transparent">
        {content}
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-white transition-all duration-500 overflow-hidden select-none ${
        fadeOut ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 pointer-events-auto scale-100'
      }`}
    >
      {/* Radial Background Ambient Lights */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[280px] sm:w-[420px] h-[280px] sm:h-[420px] rounded-full bg-teal-500/10 dark:bg-cyan-500/10 blur-3xl pointer-events-none" />

      {content}
    </div>
  );
};

/* ==========================================================================
   REUSABLE MICRO-LOADERS & SKELETONS
   ========================================================================== */

/**
 * Sleek Pulse Skeleton Loader for Product Grid Cards
 */
export const CardSkeletonLoader: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`card-skeleton-${idx}`}
          className="rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 overflow-hidden p-3.5 space-y-3.5 shadow-xs animate-pulse"
        >
          {/* Image Skeleton */}
          <div className="w-full aspect-video rounded-2xl bg-slate-200 dark:bg-slate-800 animate-skeleton-shimmer" />

          {/* Details Skeleton */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="w-20 h-4 rounded-md bg-slate-200 dark:bg-slate-800 animate-skeleton-shimmer" />
              <div className="w-12 h-4 rounded-md bg-slate-200 dark:bg-slate-800 animate-skeleton-shimmer" />
            </div>

            <div className="w-3/4 h-5 rounded-md bg-slate-200 dark:bg-slate-800 animate-skeleton-shimmer" />
            <div className="w-1/2 h-4 rounded-md bg-slate-200 dark:bg-slate-800 animate-skeleton-shimmer" />

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80">
              <div className="w-24 h-6 rounded-lg bg-slate-200 dark:bg-slate-800 animate-skeleton-shimmer" />
              <div className="w-20 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 animate-skeleton-shimmer" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Reusable Spinning Button Loader with Status Text
 */
export const ButtonSpinner: React.FC<{ text?: string; className?: string }> = ({
  text = 'Please wait...',
  className = '',
}) => {
  return (
    <span className={`inline-flex items-center justify-center gap-2 font-extrabold ${className}`}>
      <Loader2 className="w-4 h-4 animate-spin-fast text-emerald-500" />
      <span>{text}</span>
    </span>
  );
};

/**
 * Reusable Overlay Spinner for Checkout & Modals
 */
export const ModalCheckoutSpinner: React.FC<{ message?: string }> = ({
  message = 'Processing Transaction...',
}) => {
  return (
    <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
      <div className="relative">
        <div className="absolute -inset-3 rounded-full bg-emerald-500/20 blur-lg animate-pulse" />
        <div className="relative w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-lg">
          <Loader2 className="w-6 h-6 animate-spin-fast text-emerald-500" />
        </div>
      </div>
      <div className="space-y-1">
        <h4 className="font-heading font-extrabold text-sm text-slate-900 dark:text-white">
          {message}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
          <HardDrive className="w-3 h-3 text-emerald-500" />
          <span>Verifying encrypted response...</span>
        </p>
      </div>
    </div>
  );
};

export default GlobalLoader;
