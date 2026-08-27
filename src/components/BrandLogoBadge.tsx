import React from 'react';
import { useBrand } from '../context/BrandContext';
import { formatDirectImageUrl } from '../utils/formatImageUrl';

export interface BrandLogoBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showAnimation?: boolean;
  className?: string;
}

export default function BrandLogoBadge({
  size = 'lg',
  showAnimation = true,
  className = '',
}: BrandLogoBadgeProps) {
  const { logoUrl, brandName } = useBrand();
  
  const sizeClasses =
    size === 'lg'
      ? 'w-16 h-16 sm:w-20 sm:h-20'
      : size === 'md'
      ? 'w-12 h-12'
      : 'w-10 h-10';

  return (
    <div
      className={`relative inline-flex items-center justify-center ${
        showAnimation ? 'animate-smooth-float' : ''
      } ${className}`}
    >
      {/* Outer Emerald Neon Glow Ring */}
      <div className="absolute inset-0 rounded-2xl bg-emerald-500/25 blur-lg scale-110 animate-pulse pointer-events-none" />

      {/* Solid Pitch-Black Logo Container */}
      <div
        className={`${sizeClasses} relative rounded-2xl bg-black border-2 border-emerald-500/40 overflow-hidden shadow-2xl shadow-emerald-500/20 flex items-center justify-center p-1 z-10 animate-luxury-box`}
      >
        <img
          src={formatDirectImageUrl(logoUrl) || "https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10"}
          alt={`${brandName} Avatar Logo`}
          className="w-full h-full object-cover rounded-xl bg-black"
          loading="eager"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
}
