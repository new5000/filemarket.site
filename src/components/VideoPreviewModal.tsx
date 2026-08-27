import React from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { DEFAULT_GLOBAL_CONFIG, PreviewBlock, PreviewPlayer } from '../types';
import { DynamicPreviewRenderer } from './DynamicPreviewRenderer';

export interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  previewWebsiteUrl?: string;
  previewPlayers?: PreviewPlayer[];
  previewBlocks?: PreviewBlock[];
  title?: string;
  thumbnailUrl?: string;
}

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  previewWebsiteUrl,
  previewPlayers,
  previewBlocks,
  title = 'Video Preview & Asset Walkthrough',
}) => {
  const { globalConfig } = useGlobalSettings();

  if (!isOpen) return null;

  const adsConfig = globalConfig?.previewVideoAds || DEFAULT_GLOBAL_CONFIG.previewVideoAds!;
  const isAdsEnabled = adsConfig.enabled ?? true;
  const topAd = adsConfig.topBannerAd || DEFAULT_GLOBAL_CONFIG.previewVideoAds!.topBannerAd;
  const bottomAd = adsConfig.bottomNativeAd || DEFAULT_GLOBAL_CONFIG.previewVideoAds!.bottomNativeAd;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 animate-fade-in">
      <div className="relative w-full max-w-2xl flex flex-col bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between gap-2 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] z-10 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
              ▶
            </div>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all shrink-0 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="max-h-[82vh] overflow-y-auto overscroll-contain p-4 space-y-4">
          {/* Top Ad */}
          {isAdsEnabled && topAd?.enabled && (
            <div className="w-full flex justify-center">
              <div className="w-full bg-gradient-to-r from-slate-100 to-emerald-50/50 dark:from-slate-950/90 dark:to-slate-900 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-2.5 text-center shadow-xs">
                {topAd.targetUrl && (
                  <a
                    href={topAd.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 group"
                  >
                    <div className="text-left overflow-hidden flex-1">
                      <div className="font-bold text-slate-900 dark:text-white truncate group-hover:text-emerald-500 transition-colors text-xs">
                        {topAd.title || 'Advertisement'}
                      </div>
                      {topAd.subtext && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {topAd.subtext}
                        </p>
                      )}
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white font-black text-[10px] flex items-center gap-1 shrink-0">
                      <span>{topAd.ctaText || 'Get Offer'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Dynamic Render of All Custom Players & Ads */}
          <DynamicPreviewRenderer
            previewBlocks={previewBlocks}
            previewPlayers={previewPlayers}
            videoUrl={videoUrl}
          />

          {/* Live Demo Button */}
          {previewWebsiteUrl && (
            <div className="w-full flex justify-center">
              <a
                href={previewWebsiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm tracking-wide shadow-xl shadow-red-600/30 cursor-pointer"
              >
                <span>🌐 Click Here to Open Live Demo Website ↗</span>
              </a>
            </div>
          )}

          {/* Security Notice */}
          <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 py-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>All files are verified 100% virus-free and securely tested.</span>
          </p>

          {/* Bottom Ad */}
          {isAdsEnabled && bottomAd?.enabled && (
            <div className="w-full flex justify-center">
              <div className="w-full bg-gradient-to-r from-slate-100 to-teal-50/50 dark:from-slate-950/90 dark:to-slate-900 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-2.5 text-center shadow-xs">
                {bottomAd.targetUrl && (
                  <a
                    href={bottomAd.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 group"
                  >
                    <div className="text-left overflow-hidden flex-1">
                      <div className="font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-400 transition-colors text-xs">
                        {bottomAd.title || 'Sponsored Offer'}
                      </div>
                      {bottomAd.subtext && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {bottomAd.subtext}
                        </p>
                      )}
                    </div>
                    <div className="px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-black text-[10px] flex items-center gap-1 shrink-0">
                      <span>{bottomAd.ctaText || 'Claim Offer'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewModal;
