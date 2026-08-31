import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Save, 
  CheckCircle2, 
  Eye, 
  Tv, 
  LayoutGrid, 
  Layers,
  Sparkles
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

  useEffect(() => {
    if (globalConfig?.globalAds) {
      const g = globalConfig.globalAds as any;
      setAdsConfig({
        ...DEFAULT_GLOBAL_ADS_CONFIG,
        ...globalConfig.globalAds,
        previewMediaTop: { ...DEFAULT_GLOBAL_ADS_CONFIG.previewMediaTop, ...(g.previewMediaTop || g.previewPageTop || {}) },
        previewMediaBottom: { ...DEFAULT_GLOBAL_ADS_CONFIG.previewMediaBottom, ...(g.previewMediaBottom || g.previewPageBottom || {}) },
        footerTopBanner: { ...DEFAULT_GLOBAL_ADS_CONFIG.footerTopBanner, ...(g.footerTopBanner || g.preFooterBanner || g.footerSponsored || {}) },
        footerBottomBanner: { ...DEFAULT_GLOBAL_ADS_CONFIG.footerBottomBanner, ...(g.footerBottomBanner || g.footerAbsoluteBottom || {}) },
      });
    }
  }, [globalConfig]);

  const updateGlobalToggle = (enabled: boolean) => {
    setAdsConfig(prev => ({ ...prev, enabled }));
  };

  const updateSlot = (slotKey: SlotKey, updates: Partial<GlobalAdSlotConfig>) => {
    setAdsConfig(prev => ({
      ...prev,
      [slotKey]: {
        ...(prev[slotKey] || DEFAULT_GLOBAL_ADS_CONFIG[slotKey]),
        ...updates,
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedConfig = {
        ...adsConfig,
        previewPageTop: adsConfig.previewMediaTop,
        previewPageBottom: adsConfig.previewMediaBottom,
        preFooterBanner: adsConfig.footerTopBanner,
        footerAbsoluteBottom: adsConfig.footerBottomBanner,
      };

      const newGlobalConfig = {
        ...globalConfig,
        globalAds: updatedConfig,
      };

      await saveGlobalConfig(newGlobalConfig);
      setToastMessage('✅ Master Ads configuration saved successfully!');
      setTimeout(() => setToastMessage(null), 3500);

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to save ads config:', err);
      setToastMessage('❌ Failed to save ads configuration. Please retry.');
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const masterEnabled = adsConfig.enabled;

  const renderCard = (
    key: SlotKey, 
    title: string, 
    Icon: any, 
    sizePresets: { value: string, label: string }[]
  ) => {
    const slot = adsConfig[key] || DEFAULT_GLOBAL_ADS_CONFIG[key];
    
    return (
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={slot.enabled} 
              onChange={(e) => updateSlot(key, { enabled: e.target.checked })} 
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/20 rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
            <span className="ml-3 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
              {slot.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>

        {slot.enabled && (
          <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ad Format
                </label>
                <select
                  value={slot.type}
                  onChange={(e) => updateSlot(key, { type: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                >
                  <option value="html">Ad Code (Script / HTML)</option>
                  <option value="custom_image">Direct Image Banner</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ad Size Preset
                </label>
                <select
                  value={slot.adSizePreset || 'responsive'}
                  onChange={(e) => updateSlot(key, { adSizePreset: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                >
                  {sizePresets.map(preset => (
                    <option key={preset.value} value={preset.value}>{preset.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {slot.type === 'custom_image' ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Banner Image URL</label>
                  <input
                    type="url"
                    value={slot.imageUrl || ''}
                    onChange={(e) => updateSlot(key, { imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target URL (Link)</label>
                  <input
                    type="url"
                    value={slot.targetUrl || ''}
                    onChange={(e) => updateSlot(key, { targetUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Title</label>
                    <input
                      type="text"
                      value={slot.title || ''}
                      onChange={(e) => updateSlot(key, { title: e.target.value })}
                      placeholder="Special Offer"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Subtext</label>
                    <input
                      type="text"
                      value={slot.subtext || ''}
                      onChange={(e) => updateSlot(key, { subtext: e.target.value })}
                      placeholder="Limited time..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ad Code (HTML / Script / Direct Banner Link)</label>
                <textarea
                  rows={4}
                  value={slot.code || ''}
                  onChange={(e) => updateSlot(key, { code: e.target.value })}
                  placeholder="<!-- Paste your HTML, ad script, or Adsterra code here -->"
                  className="w-full p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-300 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {masterEnabled && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5 mb-2">
                  <Eye className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase">Live Preview</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex justify-center min-h-[100px]">
                  <AdSlotRenderer slot={slot} showBadge={true} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 shrink-0">
            <Megaphone className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Ads & Monetization</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Manage the 4 streamlined global ad placements automatically rendered across the app.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <label className="relative inline-flex items-center cursor-pointer p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={masterEnabled} 
              onChange={(e) => updateGlobalToggle(e.target.checked)} 
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[14px] after:left-[14px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
            <span className="ml-3 text-sm font-bold text-slate-700 dark:text-slate-300">
              Master Toggle
            </span>
          </label>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex flex-1 items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all text-white font-bold rounded-2xl disabled:opacity-50 shadow-lg shadow-emerald-500/20 shrink-0"
          >
            <Save className="w-5 h-5" />
            <span>{isSaving ? 'Saving...' : 'Save All Ads'}</span>
          </button>
        </div>
      </div>

      {!masterEnabled && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          Master Ads Toggle is currently OFF. All ad placements below are globally disabled.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-100 transition-opacity" style={{ opacity: masterEnabled ? 1 : 0.6, pointerEvents: masterEnabled ? 'auto' : 'none' }}>
        {renderCard('previewMediaTop', 'Card 1: 🎬 Watch Preview - Top Media Ad', Tv, [
          { value: 'responsive', label: 'Responsive Auto' },
          { value: 'mobile_banner_320x50', label: 'Mobile 320x50' },
          { value: 'banner_468x60', label: 'Banner 468x60' },
          { value: 'leaderboard_728x90', label: 'Leaderboard 728x90' }
        ])}

        {renderCard('previewMediaBottom', 'Card 2: 🎬 Watch Preview - Bottom Media Ad', Tv, [
          { value: 'responsive', label: 'Responsive Auto' },
          { value: 'medium_rectangle_300x250', label: 'Medium Rectangle 300x250' },
          { value: 'mobile_banner_320x50', label: 'Mobile 320x50' },
          { value: 'leaderboard_728x90', label: 'Leaderboard 728x90' }
        ])}

        {renderCard('footerTopBanner', 'Card 3: 🏷️ Footer Top Sponsored Banner', Sparkles, [
          { value: 'responsive', label: 'Responsive Auto' },
          { value: 'leaderboard_728x90', label: 'Leaderboard 728x90' },
          { value: 'mobile_banner_320x50', label: 'Mobile 320x50' }
        ])}

        {renderCard('footerBottomBanner', 'Card 4: 🔻 Footer Absolute Bottom Ad', LayoutGrid, [
          { value: 'responsive', label: 'Responsive Auto' },
          { value: 'leaderboard_728x90', label: 'Leaderboard 728x90' },
          { value: 'mobile_banner_320x50', label: 'Mobile 320x50' }
        ])}
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900/95 border border-emerald-500/50 text-emerald-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs sm:text-sm font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
export default AdminAdsView;
