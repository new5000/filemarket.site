import React, { useState, useEffect } from 'react';
import { Save, ShieldCheck, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ProductGuaranteeData, DEFAULT_PRODUCT_GUARANTEE } from '../../context/GlobalSettingsContext';

export const ProductGuaranteeSettingsCard = () => {
  const [settings, setSettings] = useState<ProductGuaranteeData>(DEFAULT_PRODUCT_GUARANTEE);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'system_settings', 'product_guarantee');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as ProductGuaranteeData);
        }
      } catch (err) {
        console.error("Error fetching product guarantee settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      await setDoc(doc(db, 'system_settings', 'product_guarantee'), {
        ...settings,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFastTrackChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setSettings(prev => ({
      ...prev,
      fastTrack: { ...prev.fastTrack, [name]: val }
    }));
  };

  const handleGuaranteeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setSettings(prev => ({
      ...prev,
      guarantee: { ...prev.guarantee, [name]: val }
    }));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Product Trust & Guarantees</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage fast-track and money-back guarantee content</p>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Changes</span>
        </button>
      </div>

      <div className="p-6 space-y-8">
        {saveSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {saveError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Fast-Track Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
              <Zap className="w-4 h-4 text-emerald-500" />
              <h4>Direct Founder Fast-Track Desk</h4>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isEnabled"
                checked={settings.fastTrack.isEnabled}
                onChange={handleFastTrackChange}
                className="w-4 h-4 rounded text-emerald-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable</span>
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Badge Text</label>
              <input
                type="text"
                name="badge"
                value={settings.fastTrack.badge}
                onChange={handleFastTrackChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
              <input
                type="text"
                name="title"
                value={settings.fastTrack.title}
                onChange={handleFastTrackChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <textarea
                name="description"
                value={settings.fastTrack.description}
                onChange={handleFastTrackChange}
                rows={2}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none dark:text-white"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Button Text</label>
              <input
                type="text"
                name="buttonText"
                value={settings.fastTrack.buttonText}
                onChange={handleFastTrackChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Money-Back Guarantee Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h4>Money-Back Quality Protection</h4>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isEnabled"
                checked={settings.guarantee.isEnabled}
                onChange={handleGuaranteeChange}
                className="w-4 h-4 rounded text-emerald-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable</span>
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title (Bengali)</label>
              <input
                type="text"
                name="titleBN"
                value={settings.guarantee.titleBN}
                onChange={handleGuaranteeChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title (English)</label>
              <input
                type="text"
                name="titleEN"
                value={settings.guarantee.titleEN}
                onChange={handleGuaranteeChange}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description (Include 'Instant 100%' for split)</label>
              <textarea
                name="description"
                value={settings.guarantee.description}
                onChange={handleGuaranteeChange}
                rows={3}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
