import React from 'react';
import AnimatedBrandTitle from './AnimatedBrandTitle';
import { useBrand, DEFAULT_LOGO } from '../context/BrandContext';
import { formatDirectImageUrl } from '../utils/formatImageUrl';

export interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
  onClick?: () => void;
}

export default function BrandLogo({
  className = "h-11",
  showText = true,
  textClassName = "",
  onClick,
}: BrandLogoProps) {
  const { logoUrl, brandName } = useBrand();

  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''}`}
    >
      <img
        src={formatDirectImageUrl(logoUrl) || DEFAULT_LOGO}
        alt={`${brandName} Logo`}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={(e) => {
          e.currentTarget.src = DEFAULT_LOGO;
        }}
        className={`w-auto object-contain rounded-2xl shadow-sm ${className}`}
        loading="eager"
      />
      {showText && (
        <span
          className={`font-black text-xl sm:text-2xl tracking-tight text-slate-900 dark:text-white ${textClassName}`}
        >
          <AnimatedBrandTitle text={brandName} />
        </span>
      )}
    </div>
  );
}
