import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, X, PowerOff, Power } from 'lucide-react';
import { GlobalAdSlotConfig, AdSizePreset, DEFAULT_GLOBAL_ADS_CONFIG } from '../../types';
import { useGlobalSettings } from '../../context/GlobalSettingsContext';
import { auth } from '../../lib/firebase';
import { saveGlobalConfig } from '../../lib/adminServices';

export type AdSlotKey = 
  | 'footerTopBanner'
  | 'footerBottomBanner'
  | 'previewMediaTop'
  | 'previewMediaBottom'
  // Backward compatibility aliases
  | 'previewTopAd'
  | 'previewBottomAd'
  | 'preFooterBanner'
  | 'footerAbsoluteBottom'
  | 'previewPageTop'
  | 'previewPageBottom'
  | 'footerSponsored'
  | 'homeTopBanner' 
  | 'homeInGrid' 
  | 'productRelatedBanner' 
  | 'homeInFeed' 
  | 'productDetailInContent' 
  | 'inGridAd'
  | 'headerBanner'
  | 'productDetailAd'
  | 'floatingMobileBottom';

interface AdSlotRendererProps {
  slot?: GlobalAdSlotConfig;
  slotKey?: AdSlotKey;
  className?: string;
  showBadge?: boolean;
  onDismiss?: () => void;
  isGridCardStyle?: boolean; // When rendered inside product grid as an item card
  darkContainer?: boolean;
}

export const AdSlotRenderer: React.FC<AdSlotRendererProps> = ({
  slot: directSlot,
  slotKey,
  className = '',
  showBadge = true,
  onDismiss,
  isGridCardStyle = false,
  darkContainer = false,
}) => {
  const { globalConfig } = useGlobalSettings();
  const htmlContainerRef = useRef<HTMLDivElement>(null);
  const [dismissed, setDismissed] = useState(false);

  const checkIsAdmin = () => {
    const cached = localStorage.getItem('fm_master_admin_email') || 'new144506@gmail.com';
    const isEmailMatch = Boolean(auth.currentUser?.email && auth.currentUser.email.toLowerCase().trim() === cached.toLowerCase().trim());
    const hasAdminSession = 
      localStorage.getItem('fm_admin_logged_in') === 'true' || 
      localStorage.getItem('fm_is_admin') === 'true' ||
      Boolean(localStorage.getItem('fm_admin_session'));
    return isEmailMatch || hasAdminSession;
  };

  const [isAdmin, setIsAdmin] = useState<boolean>(checkIsAdmin);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(() => {
      setIsAdmin(checkIsAdmin());
    });
    return () => unsub();
  }, []);

  const handleAdminTurnOff = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!slotKey) return;

    const currentAds: any = { ...(globalConfig?.globalAds || DEFAULT_GLOBAL_ADS_CONFIG) };
    const currentSlot = currentAds[slotKey] || DEFAULT_GLOBAL_ADS_CONFIG[slotKey as keyof typeof DEFAULT_GLOBAL_ADS_CONFIG] || {};
    const disabledSlot = { ...currentSlot, enabled: false };

    currentAds[slotKey] = disabledSlot;

    if (slotKey === 'previewMediaTop' || slotKey === 'previewPageTop' || slotKey === 'previewTopAd') {
      currentAds.previewMediaTop = disabledSlot;
      currentAds.previewPageTop = disabledSlot;
      currentAds.previewTopAd = disabledSlot;
    } else if (slotKey === 'previewMediaBottom' || slotKey === 'previewPageBottom' || slotKey === 'previewBottomAd') {
      currentAds.previewMediaBottom = disabledSlot;
      currentAds.previewPageBottom = disabledSlot;
      currentAds.previewBottomAd = disabledSlot;
    } else if (slotKey === 'footerTopBanner' || slotKey === 'preFooterBanner' || slotKey === 'footerSponsored') {
      currentAds.footerTopBanner = disabledSlot;
      currentAds.preFooterBanner = disabledSlot;
      currentAds.footerSponsored = disabledSlot;
    } else if (slotKey === 'footerBottomBanner' || slotKey === 'footerAbsoluteBottom') {
      currentAds.footerBottomBanner = disabledSlot;
      currentAds.footerAbsoluteBottom = disabledSlot;
    }

    // Do not set dismissed so admin can immediately see the OFF status bar and easily turn it back ON
    setDismissed(false);

    try {
      await saveGlobalConfig({
        ...globalConfig,
        globalAds: currentAds,
      });
    } catch (err) {
      console.error('Failed to turn off ad via admin button:', err);
    }
  };

  const handleAdminTurnOn = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!slotKey) return;

    const currentAds: any = { ...(globalConfig?.globalAds || DEFAULT_GLOBAL_ADS_CONFIG) };
    const fallbackSlot = DEFAULT_GLOBAL_ADS_CONFIG[slotKey as keyof typeof DEFAULT_GLOBAL_ADS_CONFIG] || {};
    const existingSlot = currentAds[slotKey] || fallbackSlot;
    const enabledSlot = { ...existingSlot, enabled: true };

    currentAds[slotKey] = enabledSlot;
    currentAds.enabled = true; // Ensure master toggle is active

    if (slotKey === 'previewMediaTop' || slotKey === 'previewPageTop' || slotKey === 'previewTopAd') {
      currentAds.previewMediaTop = enabledSlot;
      currentAds.previewPageTop = enabledSlot;
      currentAds.previewTopAd = enabledSlot;
    } else if (slotKey === 'previewMediaBottom' || slotKey === 'previewPageBottom' || slotKey === 'previewBottomAd') {
      currentAds.previewMediaBottom = enabledSlot;
      currentAds.previewPageBottom = enabledSlot;
      currentAds.previewBottomAd = enabledSlot;
    } else if (slotKey === 'footerTopBanner' || slotKey === 'preFooterBanner' || slotKey === 'footerSponsored') {
      currentAds.footerTopBanner = enabledSlot;
      currentAds.preFooterBanner = enabledSlot;
      currentAds.footerSponsored = enabledSlot;
    } else if (slotKey === 'footerBottomBanner' || slotKey === 'footerAbsoluteBottom') {
      currentAds.footerBottomBanner = enabledSlot;
      currentAds.footerAbsoluteBottom = enabledSlot;
    }

    setDismissed(false);

    try {
      await saveGlobalConfig({
        ...globalConfig,
        globalAds: currentAds,
      });
    } catch (err) {
      console.error('Failed to turn on ad via admin button:', err);
    }
  };

  const globalAdsEnabled = globalConfig?.globalAds?.enabled ?? true;

  // Resolve slot config with fallback mapping
  const resolveSlot = (): GlobalAdSlotConfig | undefined => {
    if (directSlot) return directSlot;
    if (!slotKey || !globalConfig?.globalAds) return undefined;

    const ads = globalConfig.globalAds as any;

    if (slotKey === 'footerTopBanner' || slotKey === 'preFooterBanner' || slotKey === 'footerSponsored') {
      const candidate = ads.footerTopBanner || ads.preFooterBanner || ads.footerSponsored;
      let isEnabled = true;
      if (ads.footerTopBanner?.enabled !== undefined) {
        isEnabled = Boolean(ads.footerTopBanner.enabled);
      } else if (ads.preFooterBanner?.enabled !== undefined) {
        isEnabled = Boolean(ads.preFooterBanner.enabled);
      } else if (candidate?.enabled !== undefined) {
        isEnabled = Boolean(candidate.enabled);
      }
      return { ...(candidate || {}), enabled: isEnabled };
    }
    if (slotKey === 'footerBottomBanner' || slotKey === 'footerAbsoluteBottom') {
      const candidate = ads.footerBottomBanner || ads.footerAbsoluteBottom;
      let isEnabled = true;
      if (ads.footerBottomBanner?.enabled !== undefined) {
        isEnabled = Boolean(ads.footerBottomBanner.enabled);
      } else if (ads.footerAbsoluteBottom?.enabled !== undefined) {
        isEnabled = Boolean(ads.footerAbsoluteBottom.enabled);
      } else if (candidate?.enabled !== undefined) {
        isEnabled = Boolean(candidate.enabled);
      }
      return { ...(candidate || {}), enabled: isEnabled };
    }
    if (slotKey === 'previewMediaTop' || slotKey === 'previewPageTop' || slotKey === 'previewTopAd') {
      const candidate = ads.previewMediaTop || ads.previewPageTop || ads.previewTopAd;
      let isEnabled = true;
      if (ads.previewMediaTop?.enabled !== undefined) {
        isEnabled = Boolean(ads.previewMediaTop.enabled);
      } else if (ads.previewPageTop?.enabled !== undefined) {
        isEnabled = Boolean(ads.previewPageTop.enabled);
      } else if (ads.previewTopAd?.enabled !== undefined) {
        isEnabled = Boolean(ads.previewTopAd.enabled);
      } else if (candidate?.enabled !== undefined) {
        isEnabled = Boolean(candidate.enabled);
      }
      return { ...(candidate || {}), enabled: isEnabled };
    }
    if (slotKey === 'previewMediaBottom' || slotKey === 'previewPageBottom' || slotKey === 'previewBottomAd') {
      const candidate = ads.previewMediaBottom || ads.previewPageBottom || ads.previewBottomAd;
      let isEnabled = true;
      if (ads.previewMediaBottom?.enabled !== undefined) {
        isEnabled = Boolean(ads.previewMediaBottom.enabled);
      } else if (ads.previewPageBottom?.enabled !== undefined) {
        isEnabled = Boolean(ads.previewPageBottom.enabled);
      } else if (candidate?.enabled !== undefined) {
        isEnabled = Boolean(candidate.enabled);
      }
      return { ...(candidate || {}), enabled: isEnabled };
    }
    if (slotKey === 'homeTopBanner') {
      return ads.homeTopBanner || ads.headerBanner;
    }
    if (slotKey === 'homeInGrid' || slotKey === 'homeInFeed') {
      return ads.homeInGrid || ads.homeInFeed || ads.inGridAd;
    }
    if (slotKey === 'productRelatedBanner' || slotKey === 'productDetailInContent') {
      return ads.productRelatedBanner || ads.productDetailInContent || ads.productDetailAd;
    }

    return ads[slotKey];
  };

  const slot = resolveSlot();

  // Extract and execute scripts when custom HTML/script ads are mounted
  useEffect(() => {
    const isScriptType = slot?.type === 'script' || slot?.type === 'html';
    if (!slot || !slot.enabled || !isScriptType || !slot.code || !htmlContainerRef.current) {
      return;
    }

    const container = htmlContainerRef.current;
    container.innerHTML = slot.code;

    // Execute any script tags dynamically with safe execution guards
    const scripts = container.querySelectorAll('script');
    scripts.forEach((oldScript: HTMLScriptElement) => {
      try {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr: Attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });

        // Ensure window.aclib exists before running AdCash scripts
        if (oldScript.innerHTML.includes('aclib') && !(window as any).aclib) {
          const stub = () => {};
          (window as any).aclib = new Proxy({
            runAutoTag: stub,
            runPop: stub,
            runBanner: stub,
            runInPagePush: stub,
            init: stub
          }, {
            get: (target: any, prop: string) => target[prop] || stub
          });
        }

        if (oldScript.src) {
          newScript.src = oldScript.src;
          newScript.async = true;
          newScript.onerror = () => {
            console.warn(`[AdSlotRenderer] Ad script failed to load: ${oldScript.src}`);
          };
        } else if (oldScript.innerHTML) {
          // Wrap inline scripts in a try-catch so third-party runtime errors never crash the host app
          newScript.text = `try { ${oldScript.innerHTML} } catch (err) { console.warn("[AdSlotRenderer] Safe ad execution:", err); }`;
        }

        if (oldScript.parentNode) {
          oldScript.parentNode.replaceChild(newScript, oldScript);
        }
      } catch (err) {
        console.warn('[AdSlotRenderer] Dynamic script injection handled:', err);
      }
    });
  }, [slot?.code, slot?.enabled, slot?.type]);

  if (!globalAdsEnabled || !slot || !slot.enabled || dismissed) {
    if (isAdmin && slotKey && !dismissed) {
      return (
        <div className={`w-full max-w-[728px] mx-auto my-2 py-2 px-3.5 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/20 flex flex-wrap items-center justify-between gap-2 text-xs select-none transition-all ${className}`}>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-[11px] font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
            <span>Ad Slot (<strong>{slotKey}</strong>): <span className="text-rose-500 font-bold uppercase">OFF</span></span>
            <span className="hidden sm:inline text-slate-400 text-[10px]">| সাধারণ ভিজিটরদের কাছে এটি লুকানো আছে</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdminTurnOn}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition shadow-sm cursor-pointer active:scale-95"
              title="Admin Quick Control: Turn this ad ON"
            >
              <Power className="w-3.5 h-3.5" />
              <span>Turn ON Ad (Admin)</span>
            </button>
            <a
              href="/admin?tab=ads"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition cursor-pointer"
              title="Open Ads Manager in Admin Panel"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Admin Panel</span>
            </a>
          </div>
        </div>
      );
    }
    return null;
  }

  const isScriptType = slot.type === 'script' || slot.type === 'html';

  // Compute sizing dimensions based on preset
  const getSizeStyles = (): { containerStyle: React.CSSProperties; containerClasses: string } => {
    const preset = slot.adSizePreset || 'responsive';

    switch (preset) {
      case 'mobile_banner_320x50':
        return {
          containerStyle: { maxWidth: '320px', minHeight: '50px' },
          containerClasses: 'w-full max-w-[320px] min-h-[50px]',
        };
      case 'banner_468x60':
        return {
          containerStyle: { maxWidth: '468px', minHeight: '60px' },
          containerClasses: 'w-full max-w-[468px] min-h-[60px]',
        };
      case 'medium_rectangle_300x250':
        return {
          containerStyle: { width: '300px', minHeight: '250px' },
          containerClasses: 'w-[300px] max-w-full min-h-[250px]',
        };
      case 'leaderboard_728x90':
        return {
          containerStyle: { maxWidth: '728px', minHeight: '90px' },
          containerClasses: 'w-full max-w-[728px] min-h-[90px]',
        };
      case 'custom': {
        const customStyle: React.CSSProperties = {};
        if (slot.customWidth) customStyle.width = slot.customWidth;
        if (slot.customHeight) customStyle.height = slot.customHeight;
        return {
          containerStyle: customStyle,
          containerClasses: 'max-w-full overflow-hidden',
        };
      }
      case 'responsive':
      default:
        return {
          containerStyle: {},
          containerClasses: 'w-full max-w-[728px]',
        };
    }
  };

  const { containerStyle, containerClasses } = getSizeStyles();
  const isDarkContainer = darkContainer || slotKey === 'footerBottomBanner' || slotKey === 'footerAbsoluteBottom' || slotKey === 'footerTopBanner';

  // 1. Script / Raw HTML Ad Type
  if (isScriptType) {
    if (!slot.code || slot.code.trim().length === 0) return null;

    return (
      <div 
        className={`w-full max-w-[728px] mx-auto my-4 px-2 flex flex-col items-center justify-center ${className}`}
      >
        {/* Subtle • SPONSORED label */}
        {showBadge && (
          <div className="w-full flex items-center justify-between px-1 mb-1 text-[9px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest select-none">
            <span className="flex items-center gap-1">
              <span className="text-emerald-500 font-bold">•</span>
              {slot.badge || 'SPONSORED'}
            </span>
            {onDismiss && (
              <button
                type="button"
                onClick={() => {
                  setDismissed(true);
                  if (onDismiss) onDismiss();
                }}
                className="p-0.5 hover:text-slate-400 transition cursor-pointer"
                title="Dismiss ad"
                aria-label="Dismiss advertisement"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Frameless, clean ad element without harsh grey box */}
        <div 
          className={`${containerClasses} w-full flex justify-center items-center overflow-x-auto rounded-xl p-0 bg-transparent border-0 shadow-none max-w-full`}
          style={containerStyle}
        >
          <div 
            ref={htmlContainerRef}
            className="w-full max-w-full overflow-x-auto flex justify-center items-center"
          />
        </div>
      </div>
    );
  }

  // 2. Custom Image + Target Link / Banner Ad Type
  const hasImage = Boolean(slot.imageUrl && slot.imageUrl.trim().length > 0);
  const hasTitle = Boolean(slot.title && slot.title.trim().length > 0);

  if (!hasImage && !hasTitle) {
    return null;
  }

  const targetHref = slot.targetUrl?.trim() || 'https://filemarket.site';
  const bannerBadge = slot.badge?.trim() || 'SPONSORED';
  const ctaText = slot.ctaText?.trim() || 'Learn More ↗';

  // If rendered as a natural grid item card
  if (isGridCardStyle) {
    return (
      <div className="group relative flex flex-col justify-between bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-3 sm:p-4 shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all h-full">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
              <span className="text-emerald-500 font-bold">•</span>
              {bannerBadge}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20">
              FEATURED
            </span>
          </div>

          <a 
            href={targetHref} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3 relative group-hover:opacity-95 transition"
          >
            {hasImage ? (
              <img 
                src={slot.imageUrl} 
                alt={slot.title || 'Sponsored Advertisement'} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                loading="lazy" 
                referrerPolicy="no-referrer" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-emerald-900 to-slate-900 text-white font-black text-xs p-4 text-center">
                {slot.title}
              </div>
            )}
          </a>

          {slot.title && (
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 mb-1">
              {slot.title}
            </h4>
          )}
          {slot.subtext && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
              {slot.subtext}
            </p>
          )}
        </div>

        <a
          href={targetHref}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition active:scale-95"
        >
          <span>{ctaText}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  // Standard In-Content & Footer Container
  return (
    <div 
      className={`w-full max-w-[728px] mx-auto my-3 px-2 flex flex-col items-center justify-center overflow-hidden rounded-xl ${className}`}
      style={{ contain: 'content' }}
    >
      {/* Subtle • SPONSORED label & Admin Quick Controls */}
      <div className={`w-full flex items-center justify-between px-1 mb-1.5 text-[9px] font-bold ${
        isDarkContainer ? 'text-slate-500 dark:text-slate-600' : 'text-slate-400 dark:text-slate-500'
      } uppercase tracking-widest select-none gap-2`}>
        <div className="flex items-center gap-1.5">
          {showBadge && (
            <>
              <span className="text-emerald-500 font-bold">•</span>
              <span>{bannerBadge}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && slotKey && (
            <>
              <button
                type="button"
                onClick={handleAdminTurnOff}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/20 text-[9px] font-bold tracking-normal transition-colors cursor-pointer"
                title="Admin Quick Control: Turn off this ad immediately"
              >
                <PowerOff className="w-2.5 h-2.5" />
                <span>Turn OFF Ad (Admin)</span>
              </button>
              <a
                href="/admin?tab=ads"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] font-bold tracking-normal transition cursor-pointer"
                title="Open Ads Manager in Admin Panel"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                <span>Admin</span>
              </a>
            </>
          )}

          {onDismiss && (
            <button
              type="button"
              onClick={() => {
                setDismissed(true);
                if (onDismiss) onDismiss();
              }}
              className="p-0.5 hover:text-slate-400 transition cursor-pointer"
              title="Dismiss ad"
              aria-label="Dismiss advertisement"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Banner Card */}
      <a
        href={targetHref}
        target="_blank"
        rel="noopener noreferrer"
        className={`${containerClasses} block rounded-xl overflow-hidden ${
          isDarkContainer 
            ? 'bg-slate-900/40 text-slate-200 border border-slate-800/60' 
            : 'bg-white dark:bg-[#111827] text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800'
        } shadow-sm hover:shadow-md hover:border-emerald-500/40 transition-all duration-300 group/ad cursor-pointer max-w-full`}
        style={containerStyle}
      >
        {hasImage ? (
          <div className="relative w-full aspect-[4/1] sm:aspect-[6/1] min-h-[75px] max-h-[140px] overflow-hidden bg-slate-950 flex items-center justify-center">
            <img
              src={slot.imageUrl}
              alt={slot.altText || slot.title || 'Sponsored Advertisement'}
              className="w-full h-full object-cover group-hover/ad:scale-103 transition-transform duration-500"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {hasTitle && (
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center p-3 sm:p-5">
                <div className="max-w-md space-y-0.5">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[9px] font-black uppercase tracking-wider">
                    {bannerBadge}
                  </span>
                  <h4 className="text-xs sm:text-sm font-black text-white line-clamp-1 drop-shadow-md">
                    {slot.title}
                  </h4>
                  {slot.subtext && (
                    <p className="text-[11px] text-slate-200 line-clamp-1 hidden sm:block drop-shadow-sm">
                      {slot.subtext}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg">
              <span>{ctaText}</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </div>
        ) : (
          <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 text-white">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase">
                  {bannerBadge}
                </span>
                <span className="text-xs sm:text-sm font-black text-white line-clamp-1">
                  {slot.title}
                </span>
              </div>
              {slot.subtext && (
                <p className="text-xs text-slate-300 line-clamp-1">
                  {slot.subtext}
                </p>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 group-hover/ad:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition active:scale-95">
              <span>{ctaText}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>
        )}
      </a>
    </div>
  );
};

export default AdSlotRenderer;
