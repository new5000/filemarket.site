import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Store, 
  PhoneCall, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { StoreSettings, fetchStoreSettings, saveStoreSettings } from '../../lib/adminServices';
import { TelegramSettingsCard } from './TelegramSettingsCard';
import { BrandAndSocialSettingsCard } from './BrandAndSocialSettingsCard';
import AdminAccessSettings from './AdminAccessSettings';
import { ProductGuaranteeSettingsCard } from './ProductGuaranteeSettingsCard';

interface AdminSettingsViewProps {
  onRefresh: () => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ onRefresh }) => {
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

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-500" />
          Store Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configure store metadata, support links, brand identity, and platform operation controls
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Store settings successfully saved & synchronized!
        </div>
      )}

      <div className="space-y-6 text-xs">
        {/* Section: Brand, Identity & Social Links */}
        <BrandAndSocialSettingsCard />

        {/* Section: Telegram Live Order Alerts */}
        <TelegramSettingsCard onSaved={onRefresh} />

        {/* Section: Master Admin Access Control */}
        <AdminAccessSettings onUpdated={onRefresh} />

        {/* Section: Automation & Mode Flags */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 space-y-4">
          <h2 className="text-sm font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            Platform Operational Toggles
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Auto-Approve Orders</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Instantly verify and issue drive download access upon customer submission
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoApproveOrders}
                onChange={(e) => setSettings({ ...settings, autoApproveOrders: e.target.checked })}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <div>
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-rose-500">
                  <AlertTriangle className="w-3.5 h-3.5" /> Maintenance Mode
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Temporarily pause checkout for maintenance updates
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-5 h-5 accent-rose-500 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="py-3 px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};
