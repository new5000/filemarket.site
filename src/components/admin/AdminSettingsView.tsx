import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Store, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle, 
  Send, 
  SlidersHorizontal, 
  Layers,
  Globe
} from 'lucide-react';
import { StoreSettings, fetchStoreSettings, saveStoreSettings } from '../../lib/adminServices';
import { TelegramSettingsCard } from './TelegramSettingsCard';
import { BrandAndSocialSettingsCard } from './BrandAndSocialSettingsCard';
import { SeoSettingsCard } from './SeoSettingsCard';
import AdminAccessSettings from './AdminAccessSettings';

interface AdminSettingsViewProps {
  onRefresh: () => void;
}

type SettingsSection = 'all' | 'seo' | 'branding' | 'telegram' | 'access' | 'system';

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ onRefresh }) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('all');
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'FileMarket Digital Marketplace',
    supportEmail: 'support@filemarket.site',
    supportPhone: '+8801673833783',
    defaultCurrency: 'BDT',
    maintenanceMode: false,
    autoApproveOrders: false,
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchStoreSettings().then(s => setSettings(s));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    await saveStoreSettings(settings);
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    onRefresh();
  };

  const sections: { id: SettingsSection; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'seo', label: 'SEO & Webmaster', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'branding', label: 'Branding & CTA', icon: <Store className="w-3.5 h-3.5" /> },
    { id: 'telegram', label: 'Telegram Alerts', icon: <Send className="w-3.5 h-3.5" /> },
    { id: 'access', label: 'Admin Access', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'system', label: 'System Toggles', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-500" />
            <span>Store Settings</span>
          </h1>
        </div>
      </div>

      {/* Mobile-Friendly Category Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
        {sections.map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setActiveSection(sec.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition active:scale-95 cursor-pointer ${
              activeSection === sec.id
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            {sec.icon}
            <span>{sec.label}</span>
          </button>
        ))}
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Settings saved and synchronized!</span>
        </div>
      )}

      <div className="space-y-4 text-xs">
        {/* Section: SEO & Webmaster Settings */}
        {(activeSection === 'all' || activeSection === 'seo') && (
          <SeoSettingsCard onSaved={onRefresh} />
        )}

        {/* Section: Brand, Identity & Social Links */}
        {(activeSection === 'all' || activeSection === 'branding') && (
          <BrandAndSocialSettingsCard />
        )}

        {/* Section: Telegram Live Order Alerts */}
        {(activeSection === 'all' || activeSection === 'telegram') && (
          <TelegramSettingsCard onSaved={onRefresh} />
        )}

        {/* Section: Master Admin Access Control */}
        {(activeSection === 'all' || activeSection === 'access') && (
          <AdminAccessSettings onUpdated={onRefresh} />
        )}

        {/* Section: Automation & Mode Flags */}
        {(activeSection === 'all' || activeSection === 'system') && (
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>System Operations</span>
              </h2>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-emerald-500 transition">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">Auto-Approve Orders</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Instant access link after customer order submission
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoApproveOrders}
                  onChange={(e) => setSettings({ ...settings, autoApproveOrders: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer shrink-0 ml-3"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-rose-500 transition">
                <div>
                  <div className="font-bold text-rose-500 text-xs sm:text-sm flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Maintenance Mode</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Temporarily pause checkout for customers
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  className="w-5 h-5 accent-rose-500 rounded cursor-pointer shrink-0 ml-3"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
