import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Save, 
  CheckCircle2, 
  Tv, 
  LayoutGrid, 
  Sparkles,
  PowerOff,
  Power,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  Check
} from 'lucide-react';
import { GlobalAdsManagerConfig, GlobalAdSlotConfig, DEFAULT_GLOBAL_ADS_CONFIG } from '../../types';
import { useGlobalSettings } from '../../context/GlobalSettingsContext';
import { saveGlobalConfig } from '../../lib/adminServices';
import { AdSlotRenderer } from '../ads/AdSlotRenderer';

interface AdminAdsViewProps {
  onRefresh?: () => void;
}

type SlotKey = 'previewMediaTop' | 'previewMediaBottom' | 'footerTopBanner' | 'footerBottomBanner';

export const AdminAdsView: React.FC<AdminAdsViewProps> = ({ onRefresh }) => {
  const { globalConfig } = useGlobalSettings();

  const [adsConfig, setAdsConfig] = useState<GlobalAdsManagerConfig>(() => {
    if (globalConfig?.globalAds) {
      const g = globalConfig.globalAds as any;
      return {
        ...DEFAULT_GLOBAL_ADS_CONFIG,
        ...globalConfig.globalAds,
        enabled: globalConfig.globalAds.enabled ?? true,
        previewMediaTop: { ...DEFAULT_GLOBAL_ADS_CONFIG.previewMediaTop, ...(g.previewMediaTop || g.previewPageTop || {}) },
        previewMediaBottom: { ...DEFAULT_GLOBAL_ADS_CONFIG.previewMediaBottom, ...(g.previewMediaBottom || g.previewPageBottom || {}) },
        footerTopBanner: { ...DEFAULT_GLOBAL_ADS_CONFIG.footerTopBanner, ...(g.footerTopBanner || g.preFooterBanner || g.footerSponsored || {}) },
        footerBottomBanner: { ...DEFAULT_GLOBAL_ADS_CONFIG.footerBottomBanner, ...(g.footerBottomBanner || g.footerAbsoluteBottom || {}) },
      };
    }
    return DEFAULT_GLOBAL_ADS_CONFIG;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedSlots, setExpandedSlots] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (globalConfig?.globalAds) {
      const g = globalConfig.globalAds as any;
      setAdsConfig(prev => ({
        ...DEFAULT_GLOBAL_ADS_CONFIG,
        ...globalConfig.globalAds,
        enabled: globalConfig.globalAds?.enabled ?? prev.enabled ?? true,
        previewMediaTop: { 
          ...DEFAULT_GLOBAL_ADS_CONFIG.previewMediaTop, 
          ...(g.previewMediaTop || g.previewPageTop || {}),
          enabled: (g.previewMediaTop?.enabled !== undefined) ? g.previewMediaTop.enabled : (g.previewPageTop?.enabled ?? DEFAULT_GLOBAL_ADS_CONFIG.previewMediaTop.enabled)
        },
        previewMediaBottom: { 
          ...DEFAULT_GLOBAL_ADS_CONFIG.previewMediaBottom, 
          ...(g.previewMediaBottom || g.previewPageBottom || {}),
          enabled: (g.previewMediaBottom?.enabled !== undefined) ? g.previewMediaBottom.enabled : (g.previewPageBottom?.enabled ?? DEFAULT_GLOBAL_ADS_CONFIG.previewMediaBottom.enabled)
        },
        footerTopBanner: { 
          ...DEFAULT_GLOBAL_ADS_CONFIG.footerTopBanner, 
          ...(g.footerTopBanner || g.preFooterBanner || g.footerSponsored || {}),
          enabled: (g.footerTopBanner?.enabled !== undefined) ? g.footerTopBanner.enabled : (g.preFooterBanner?.enabled ?? DEFAULT_GLOBAL_ADS_CONFIG.footerTopBanner.enabled)
        },
        footerBottomBanner: { 
          ...DEFAULT_GLOBAL_ADS_CONFIG.footerBottomBanner, 
          ...(g.footerBottomBanner || g.footerAbsoluteBottom || {}),
          enabled: (g.footerBottomBanner?.enabled !== undefined) ? g.footerBottomBanner.enabled : (g.footerAbsoluteBottom?.enabled ?? DEFAULT_GLOBAL_ADS_CONFIG.footerBottomBanner.enabled)
        },
      }));
    }
  }, [globalConfig]);

  const toggleExpand = (slotKey: string) => {
    setExpandedSlots(prev => ({ ...prev, [slotKey]: !prev[slotKey] }));
  };

  // Immediate Auto-Save on any Slot Toggle
  const handleToggleSlot = async (slotKey: SlotKey, newEnabled: boolean) => {
    const currentSlot = adsConfig[slotKey] || DEFAULT_GLOBAL_ADS_CONFIG[slotKey];
    const updatedSlot = { ...currentSlot, enabled: newEnabled };

    const updatedAdsConfig: any = {
      ...adsConfig,
      [slotKey]: updatedSlot,
    };

    // If enabling any ad, make sure master ads is enabled so it displays immediately
    if (newEnabled) {
      updatedAdsConfig.enabled = true;
    }

    // Keep all legacy aliases 100% in sync
    if (slotKey === 'previewMediaTop') {
      updatedAdsConfig.previewPageTop = updatedSlot;
      updatedAdsConfig.previewTopAd = updatedSlot;
    } else if (slotKey === 'previewMediaBottom') {
      updatedAdsConfig.previewPageBottom = updatedSlot;
      updatedAdsConfig.previewBottomAd = updatedSlot;
    } else if (slotKey === 'footerTopBanner') {
      updatedAdsConfig.preFooterBanner = updatedSlot;
      updatedAdsConfig.footerSponsored = updatedSlot;
    } else if (slotKey === 'footerBottomBanner') {
      updatedAdsConfig.footerAbsoluteBottom = updatedSlot;
    }

    setAdsConfig(updatedAdsConfig);

    setIsSaving(true);
    try {
      const newGlobalConfig = {
        ...globalConfig,
        globalAds: updatedAdsConfig,
      };
      await saveGlobalConfig(newGlobalConfig);
      setToastMessage(newEnabled ? '✅ Ad Enabled & Saved!' : '✅ Ad Turned OFF & Saved!');
      setTimeout(() => setToastMessage(null), 2500);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to toggle ad slot:', err);
      setToastMessage('❌ Error saving. Please try again.');
      setTimeout(() => setToastMessage(null), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  // Immediate Auto-Save on Master Toggle
  const handleToggleMaster = async (newEnabled: boolean) => {
    const updatedAdsConfig = {
      ...adsConfig,
      enabled: newEnabled,
    };
    setAdsConfig(updatedAdsConfig);

    setIsSaving(true);
    try {
      const newGlobalConfig = {
        ...globalConfig,
        globalAds: updatedAdsConfig,
      };
      await saveGlobalConfig(newGlobalConfig);
      setToastMessage(newEnabled ? '✅ All Ads Activated!' : '✅ All Ads Turned OFF Globally!');
      setTimeout(() => setToastMessage(null), 2500);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to update master ads toggle:', err);
      setToastMessage('❌ Error saving. Please try again.');
      setTimeout(() => setToastMessage(null), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  // Turn ALL individual slots OFF at once
  const handleTurnOffAllSlots = async () => {
    const updatedAdsConfig: any = {
      ...adsConfig,
      enabled: false,
    };

    (['previewMediaTop', 'previewMediaBottom', 'footerTopBanner', 'footerBottomBanner'] as SlotKey[]).forEach(k => {
      const cur = adsConfig[k] || DEFAULT_GLOBAL_ADS_CONFIG[k];
      const disabledSlot = { ...cur, enabled: false };
      updatedAdsConfig[k] = disabledSlot;
    });

    updatedAdsConfig.previewPageTop = updatedAdsConfig.previewMediaTop;
    updatedAdsConfig.previewTopAd = updatedAdsConfig.previewMediaTop;
    updatedAdsConfig.preFooterBanner = updatedAdsConfig.footerTopBanner;
    updatedAdsConfig.footerSponsored = updatedAdsConfig.footerTopBanner;
    updatedAdsConfig.footerAbsoluteBottom = updatedAdsConfig.footerBottomBanner;

    setAdsConfig(updatedAdsConfig);

    setIsSaving(true);
    try {
      await saveGlobalConfig({
        ...globalConfig,
        globalAds: updatedAdsConfig,
      });
      setToastMessage('✅ All Ads completely turned OFF!');
      setTimeout(() => setToastMessage(null), 3000);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      setToastMessage('❌ Error saving.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSlotDetails = (slotKey: SlotKey, updates: Partial<GlobalAdSlotConfig>) => {
    setAdsConfig(prev => {
      const updatedSlot = {
        ...(prev[slotKey] || DEFAULT_GLOBAL_ADS_CONFIG[slotKey]),
        ...updates,
      };
      const nextConfig: any = {
        ...prev,
        [slotKey]: updatedSlot,
      };

      if (slotKey === 'previewMediaTop') {
        nextConfig.previewPageTop = updatedSlot;
        nextConfig.previewTopAd = updatedSlot;
      } else if (slotKey === 'previewMediaBottom') {
        nextConfig.previewPageBottom = updatedSlot;
        nextConfig.previewBottomAd = updatedSlot;
      } else if (slotKey === 'footerTopBanner') {
        nextConfig.preFooterBanner = updatedSlot;
        nextConfig.footerSponsored = updatedSlot;
      } else if (slotKey === 'footerBottomBanner') {
        nextConfig.footerAbsoluteBottom = updatedSlot;
      }

      return nextConfig;
    });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const updatedConfig = {
        ...adsConfig,
        previewPageTop: adsConfig.previewMediaTop,
        previewTopAd: adsConfig.previewMediaTop,
        previewPageBottom: adsConfig.previewMediaBottom,
        previewBottomAd: adsConfig.previewMediaBottom,
        preFooterBanner: adsConfig.footerTopBanner,
        footerSponsored: adsConfig.footerTopBanner,
        footerAbsoluteBottom: adsConfig.footerBottomBanner,
      };

      await saveGlobalConfig({
        ...globalConfig,
        globalAds: updatedConfig,
      });

      setToastMessage('✅ Ads configuration saved successfully!');
      setTimeout(() => setToastMessage(null), 2500);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to save ads config:', err);
      setToastMessage('❌ Failed to save. Please retry.');
      setTimeout(() => setToastMessage(null), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const masterEnabled = Boolean(adsConfig.enabled);

  const renderCard = (
    key: SlotKey, 
    title: string, 
    banglaTitle: string,
    Icon: any, 
    sizePresets: { value: string, label: string }[]
  ) => {
    const slot = adsConfig[key] || DEFAULT_GLOBAL_ADS_CONFIG[key];
    const isExpanded = Boolean(expandedSlots[key]);
    const isSlotEnabled = Boolean(slot.enabled);

    return (
      <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111827] border transition-all duration-200 shadow-sm ${
        isSlotEnabled 
          ? 'border-emerald-500/40 ring-1 ring-emerald-500/10' 
          : 'border-slate-200 dark:border-slate-800 opacity-85'
      }`}>
        {/* Card Header with Big Responsive Touch Switch */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isSlotEnabled 
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {title}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {banglaTitle}
              </p>
            </div>
          </div>

          {/* Touch-Friendly Toggle Switch */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleToggleSlot(key, !isSlotEnabled)}
              disabled={isSaving}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                isSlotEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              aria-label={`Toggle ${title}`}
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isSlotEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-bold w-12 ${
              isSlotEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
            }`}>
              {isSlotEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Quick Visual Thumbnail if custom image is set */}
        {slot.type !== 'html' && slot.imageUrl && (
          <div className="mt-2.5 flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <img 
              src={slot.imageUrl} 
              alt={slot.title || title} 
              className="w-16 h-9 object-cover rounded-lg shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-800"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1 text-[11px]">
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{slot.title || 'Banner Image'}</p>
              <p className="text-slate-400 truncate text-[10px]">{slot.targetUrl || 'No target link'}</p>
            </div>
          </div>
        )}

        {/* Collapsible Edit Section */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => toggleExpand(key)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-1 cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{isExpanded ? 'Hide Settings' : 'Edit Banner & Link'}</span>
          </button>

          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
            isSlotEnabled 
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            {isSlotEnabled ? 'Active' : 'Disabled'}
          </span>
        </div>

        {/* Expandable Form Fields */}
        {isExpanded && (
          <div className="space-y-3 pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Type
                </label>
                <select
                  value={slot.type || 'custom_image'}
                  onChange={(e) => updateSlotDetails(key, { type: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="custom_image">Direct Image Banner</option>
                  <option value="html">Custom HTML / Script</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Preset Size
                </label>
                <select
                  value={slot.adSizePreset || 'responsive'}
                  onChange={(e) => updateSlotDetails(key, { adSizePreset: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  {sizePresets.map(preset => (
                    <option key={preset.value} value={preset.value}>{preset.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {slot.type === 'custom_image' ? (
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Banner Image URL
                  </label>
                  <input
                    type="url"
                    value={slot.imageUrl || ''}
                    onChange={(e) => updateSlotDetails(key, { imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Link (URL)
                  </label>
                  <input
                    type="url"
                    value={slot.targetUrl || ''}
                    onChange={(e) => updateSlotDetails(key, { targetUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Script / HTML Code
                </label>
                <textarea
                  rows={3}
                  value={slot.code || ''}
                  onChange={(e) => updateSlotDetails(key, { code: e.target.value })}
                  placeholder="<!-- HTML / Script Code -->"
                  className="w-full p-3 font-mono text-xs rounded-xl bg-slate-950 text-emerald-300 border border-slate-800"
                />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Save Details
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-12 px-2 sm:px-4">
      {/* Top Header & Master Controls */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20 shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              বিজ্ঞাপন ম্যানেজার (Ads Manager)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              যেকোনো বিজ্ঞাপন এক ক্লিকে চালু বা বন্ধ করুন
            </p>
          </div>
        </div>

        {/* Master ON/OFF Switch */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              মাস্টার টগল (All Ads):
            </span>
            <button
              type="button"
              onClick={() => handleToggleMaster(!masterEnabled)}
              disabled={isSaving}
              className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                masterEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              aria-label="Master Ads Toggle"
            >
              <span
                className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  masterEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-black ${
              masterEnabled ? 'text-emerald-500' : 'text-slate-400'
            }`}>
              {masterEnabled ? 'ON' : 'OFF'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleTurnOffAllSlots}
            disabled={isSaving}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-500/20 text-xs font-bold rounded-2xl transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            title="Turn off all ads immediately"
          >
            <PowerOff className="w-3.5 h-3.5" />
            <span>সব বন্ধ করুন (Turn OFF All)</span>
          </button>
        </div>
      </div>

      {/* Notice Banner if Master is OFF */}
      {!masterEnabled && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs sm:text-sm font-bold flex items-center gap-2.5">
          <PowerOff className="w-4 h-4 shrink-0" />
          <span>মাস্টার টগল বন্ধ রয়েছে। ওয়েবসাইটে বর্তমানে কোনো বিজ্ঞাপন প্রদর্শিত হচ্ছে না।</span>
        </div>
      )}

      {/* Clean 1-col on mobile, 2-col on larger screens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderCard(
          'previewMediaTop', 
          '🎬 Media Carousel Top Ad', 
          'প্রোডাক্ট প্রিভিউ/ভিডিওর উপরের বিজ্ঞাপন',
          Tv, 
          [
            { value: 'responsive', label: 'Responsive Auto' },
            { value: 'mobile_banner_320x50', label: 'Mobile 320x50' },
            { value: 'banner_468x60', label: 'Banner 468x60' },
            { value: 'leaderboard_728x90', label: 'Leaderboard 728x90' }
          ]
        )}

        {renderCard(
          'footerTopBanner', 
          '🏷️ Pre-Founder Banner', 
          'ফাউন্ডার সেকশনের ঠিক উপরের ব্যানার',
          Sparkles, 
          [
            { value: 'responsive', label: 'Responsive Auto' },
            { value: 'leaderboard_728x90', label: 'Leaderboard 728x90' },
            { value: 'mobile_banner_320x50', label: 'Mobile 320x50' }
          ]
        )}

        {renderCard(
          'footerBottomBanner', 
          '🔻 Footer Bottom Ad', 
          'ফুটারের সর্বনিম্নে কপিরাইটের নিচের ব্যানার',
          LayoutGrid, 
          [
            { value: 'responsive', label: 'Responsive Auto' },
            { value: 'leaderboard_728x90', label: 'Leaderboard 728x90' },
            { value: 'mobile_banner_320x50', label: 'Mobile 320x50' }
          ]
        )}
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900/95 border border-emerald-500/50 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs sm:text-sm font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default AdminAdsView;
