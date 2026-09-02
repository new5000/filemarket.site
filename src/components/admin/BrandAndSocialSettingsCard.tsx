import React, { useState, useEffect } from 'react';
import { Store, Save, CheckCircle2, AlertTriangle, Image as ImageIcon, Link as LinkIcon, Users } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatDirectImageUrl } from '../../utils/formatImageUrl';

export const BrandAndSocialSettingsCard = () => {
  // Branding
  const [siteTitle, setSiteTitle] = useState('FileMarket');
  const [siteTagline, setSiteTagline] = useState('');
  const [siteDescription, setSiteDescription] = useState("Bangladesh's premier digital marketplace for video bundles, online courses, software, AI prompts, and Blogger templates with instant bKash & Nagad verification.");
  const [physicalAddress, setPhysicalAddress] = useState('Bangladesh Chittagong bayzid 4214');
  const [headerLogoUrl, setHeaderLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [founderAvatarUrl, setFounderAvatarUrl] = useState('');

  // Image Sizes
  const [logoWidth, setLogoWidth] = useState('42');
  const [logoHeight, setLogoHeight] = useState('42');
  const [productThumbRatio, setProductThumbRatio] = useState('16/9');
  const [bannerHeight, setBannerHeight] = useState('260');

  // Social Links
  const [telegramUrl, setTelegramUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [supportEmail, setSupportEmail] = useState('filemarket.help@gmail.com');
  const [playStoreEnabled, setPlayStoreEnabled] = useState(false);
  const [playStoreUrl, setPlayStoreUrl] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'system_settings', 'general_config');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.siteTitle) setSiteTitle(data.siteTitle);
          if (data.siteTagline) setSiteTagline(data.siteTagline);
          if (data.siteDescription) setSiteDescription(data.siteDescription);
          if (data.physicalAddress) setPhysicalAddress(data.physicalAddress);
          if (data.supportEmail) setSupportEmail(data.supportEmail);
          if (data.headerLogoUrl) setHeaderLogoUrl(data.headerLogoUrl);
          if (data.faviconUrl) setFaviconUrl(data.faviconUrl);
          if (data.founderAvatarUrl) setFounderAvatarUrl(data.founderAvatarUrl);

          if (data.imageSizes) {
            setLogoWidth(data.imageSizes.logoWidth?.toString() || '42');
            setLogoHeight(data.imageSizes.logoHeight?.toString() || '42');
            setProductThumbRatio(data.imageSizes.productThumbRatio || '16/9');
            setBannerHeight(data.imageSizes.bannerHeight?.toString() || '260');
          }

          if (data.supportLinks) {
            setTelegramUrl(data.supportLinks.telegramLink || '');
            setWhatsappNumber(data.supportLinks.whatsappNumber || '');
            if (data.supportLinks.supportEmail) setSupportEmail(data.supportLinks.supportEmail);
            if (data.supportLinks.playStoreEnabled !== undefined) setPlayStoreEnabled(Boolean(data.supportLinks.playStoreEnabled));
            if (data.supportLinks.playStoreUrl) setPlayStoreUrl(data.supportLinks.playStoreUrl);
          } else if (data.socialLinks) {
            setTelegramUrl(data.socialLinks.telegram || '');
            setWhatsappNumber(data.socialLinks.whatsapp || '');
          }
          if (data.playStoreEnabled !== undefined) setPlayStoreEnabled(Boolean(data.playStoreEnabled));
          if (data.playStoreUrl) setPlayStoreUrl(data.playStoreUrl);
        }

        const supportRef = doc(db, 'system_settings', 'support_links');
        const supportSnap = await getDoc(supportRef);
        if (supportSnap.exists()) {
          const sData = supportSnap.data();
          if (sData.whatsappNumber) setWhatsappNumber(sData.whatsappNumber);
          if (sData.telegramLink) setTelegramUrl(sData.telegramLink);
          if (sData.supportEmail) setSupportEmail(sData.supportEmail);
          if (sData.playStoreEnabled !== undefined) setPlayStoreEnabled(Boolean(sData.playStoreEnabled));
          if (sData.playStoreUrl) setPlayStoreUrl(sData.playStoreUrl);
        }
      } catch (err) {
        console.warn('Error fetching brand settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveAllSettings = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      const cleanWhatsApp = whatsappNumber.replace(/[^0-9+]/g, '');

      const supportPayload = {
        whatsappNumber: cleanWhatsApp.trim(),
        telegramLink: telegramUrl.trim(),
        supportEmail: (supportEmail || 'filemarket.help@gmail.com').trim(),
        playStoreEnabled,
        playStoreUrl: playStoreUrl.trim(),
        updatedAt: new Date().toISOString()
      };

      const settingsPayload = {
        // Branding & Logos
        siteTitle: (siteTitle || 'FileMarket').trim(),
        siteTagline: (siteTagline || '').trim(),
        siteDescription: (siteDescription || '').trim(),
        physicalAddress: (physicalAddress || '').trim(),
        supportEmail: (supportEmail || 'filemarket.help@gmail.com').trim(),
        headerLogoUrl: (headerLogoUrl || '').trim(),
        faviconUrl: (faviconUrl || '').trim(),
        founderAvatarUrl: (founderAvatarUrl || '').trim(),

        // Dimensions & Image Sizing
        imageSizes: {
          logoWidth: Number(logoWidth) || 42,
          logoHeight: Number(logoHeight) || 42,
          productThumbRatio: productThumbRatio || '16/9',
          bannerHeight: Number(bannerHeight) || 260
        },

        // Social & Support Channels
        socialLinks: {
          telegram: (telegramUrl || '').trim(),
          whatsapp: cleanWhatsApp.trim()
        },
        supportLinks: supportPayload,

        updatedAt: new Date().toISOString()
      };

      // 1. Save to primary system settings documents
      await setDoc(doc(db, 'system_settings', 'general_config'), settingsPayload, { merge: true });
      await setDoc(doc(db, 'system_settings', 'branding'), settingsPayload, { merge: true });
      await setDoc(doc(db, 'system_settings', 'support_links'), supportPayload, { merge: true });
      await setDoc(doc(db, 'system_settings', 'founder_profile'), { founderAvatarUrl: (founderAvatarUrl || '').trim() }, { merge: true });

      // 2. Immediately update DOM Favicon if updated
      if (faviconUrl) {
        const link = (document.querySelector("link[rel~='icon']") as HTMLLinkElement) || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = faviconUrl.trim();
        document.getElementsByTagName('head')[0].appendChild(link);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (error) {
      console.error('Error saving system settings:', error);
      setSaveError('Failed to save settings. Please check Firestore Admin rules.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
          <Store className="w-4 h-4 text-emerald-500" />
          Brand, Identity & Social Links
        </h2>
        <button
          type="button"
          onClick={handleSaveAllSettings}
          disabled={isSaving}
          className="py-1.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer"
        >
          {isSaving ? 'Saving...' : 'Save Brand Settings'}
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Brand & Social settings successfully saved!
        </div>
      )}
      {saveError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {saveError}
        </div>
      )}

      {/* Dynamic Branding */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5" /> Site Branding
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Site Title</label>
            <input
              type="text"
              required
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Site Tagline</label>
            <input
              type="text"
              value={siteTagline}
              onChange={(e) => setSiteTagline(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Footer Description</label>
            <textarea
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 min-h-[80px]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Physical Address</label>
            <input
              type="text"
              value={physicalAddress}
              onChange={(e) => setPhysicalAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Header Logo URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={headerLogoUrl}
                onChange={(e) => setHeaderLogoUrl(formatDirectImageUrl(e.target.value))}
                placeholder="https://..."
                className="flex-1 w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <label className="cursor-pointer shrink-0 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/40 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                <span>📁 Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          setHeaderLogoUrl(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Favicon URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(formatDirectImageUrl(e.target.value))}
                placeholder="https://..."
                className="flex-1 w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <label className="cursor-pointer shrink-0 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/40 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                <span>📁 Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          setFaviconUrl(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Founder / Admin Avatar URL</label>
            <div className="flex gap-2 sm:gap-4 items-center">
              <input
                type="url"
                value={founderAvatarUrl}
                onChange={(e) => setFounderAvatarUrl(formatDirectImageUrl(e.target.value))}
                placeholder="https://..."
                className="flex-1 w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
              <label className="cursor-pointer shrink-0 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/40 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                <span>📁 Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') {
                          setFounderAvatarUrl(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              <div className="flex-shrink-0 relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-emerald-500/30 flex items-center justify-center">
                <img 
                  src={founderAvatarUrl || 'https://i.ibb.co/vzR0h2M/default-avatar.png'} 
                  alt="Live Avatar Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Sizing */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5" /> Dimensions & Layout
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Logo Width (px)</label>
            <input
              type="number"
              value={logoWidth}
              onChange={(e) => setLogoWidth(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Logo Height (px)</label>
            <input
              type="number"
              value={logoHeight}
              onChange={(e) => setLogoHeight(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Product Aspect Ratio</label>
            <select
              value={productThumbRatio}
              onChange={(e) => setProductThumbRatio(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="16/9">16/9 (Widescreen)</option>
              <option value="4/3">4/3 (Standard)</option>
              <option value="1/1">1/1 (Square)</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Banner Height (px)</label>
            <input
              type="number"
              value={bannerHeight}
              onChange={(e) => setBannerHeight(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <LinkIcon className="w-3.5 h-3.5" /> Social & Support Links
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Telegram Channel URL</label>
            <input
              type="text"
              value={telegramUrl}
              onChange={(e) => setTelegramUrl(e.target.value)}
              placeholder="https://t.me/yourchannel"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">WhatsApp Support Number</label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+8801XXXXXXXXX"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>✉️</span> Official Support Email
            </label>
            <input
              type="email"
              value={supportEmail ?? 'filemarket.help@gmail.com'}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="filemarket.help@gmail.com"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Google Play Store Integration */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3 mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <span>🤖</span> Play Store App Promotion Banner
            </h4>
            <p className="text-[10px] text-slate-400">Show a smart floating download prompt on mobile & desktop</p>
          </div>
          
          {/* ON / OFF Switch */}
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(playStoreEnabled)}
              onChange={(e) => setPlayStoreEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {playStoreEnabled && (
          <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Google Play Store App URL
            </label>
            <input
              type="url"
              value={playStoreUrl || ''}
              onChange={(e) => setPlayStoreUrl(e.target.value)}
              placeholder="https://play.google.com/store/apps/details?id=com.filemarket.app"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
          </div>
        )}
      </div>

    </div>
  );
};
