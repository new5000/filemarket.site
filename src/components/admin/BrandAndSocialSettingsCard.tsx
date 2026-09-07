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

  // Global CTA Button Customization
  const [defaultBuyButtonText, setDefaultBuyButtonText] = useState('Buy');
  const [defaultBuyButtonIcon, setDefaultBuyButtonIcon] = useState('lightning');
  const [defaultBuyButtonColor, setDefaultBuyButtonColor] = useState('emerald');
  const [defaultWatchPreviewText, setDefaultWatchPreviewText] = useState('Watch Preview');

  // Global Card Meta Display Controls
  const [showCardFileSize, setShowCardFileSize] = useState(true);
  const [showCardRating, setShowCardRating] = useState(true);

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
          if (data.buyButtonText) setDefaultBuyButtonText(data.buyButtonText);
          if (data.buyButtonIcon) setDefaultBuyButtonIcon(data.buyButtonIcon);
          if (data.buyButtonColor) setDefaultBuyButtonColor(data.buyButtonColor);
          if (data.watchPreviewButtonText) setDefaultWatchPreviewText(data.watchPreviewButtonText);
          if (data.showCardFileSize !== undefined) setShowCardFileSize(Boolean(data.showCardFileSize));
          if (data.showCardRating !== undefined) setShowCardRating(Boolean(data.showCardRating));

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

        // Global CTA Button Labels & Styling
        buyButtonText: (defaultBuyButtonText || 'Buy').trim(),
        buyButtonIcon: defaultBuyButtonIcon || 'lightning',
        buyButtonColor: defaultBuyButtonColor || 'emerald',
        watchPreviewButtonText: (defaultWatchPreviewText || 'Watch Preview').trim(),

        // Global Card Meta Display Controls (Storewide)
        showCardFileSize: Boolean(showCardFileSize),
        showCardRating: Boolean(showCardRating),

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

      // 2. Immediately cache locally & broadcast to all store pages
      try {
        localStorage.setItem('fm_general_config', JSON.stringify(settingsPayload));
        window.dispatchEvent(new CustomEvent('fm_settings_updated', { detail: settingsPayload }));
      } catch {}

      // 3. Immediately update DOM Favicon if updated
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
    <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 space-y-5">
      {/* Header & Quick Save */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
          <Store className="w-4 h-4 text-emerald-500" />
          <span>Brand &amp; Appearance</span>
        </h2>
        <button
          type="button"
          onClick={handleSaveAllSettings}
          disabled={isSaving}
          className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving...' : 'Save'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Settings saved successfully!</span>
        </div>
      )}
      {saveError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Identity & Logos */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" /> Store Identity
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Site Title</label>
            <input
              type="text"
              required
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="e.g. FileMarket"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tagline</label>
            <input
              type="text"
              value={siteTagline}
              onChange={(e) => setSiteTagline(e.target.value)}
              placeholder="e.g. Digital Goods Marketplace"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Footer Description</label>
            <textarea
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Store Address</label>
            <input
              type="text"
              value={physicalAddress}
              onChange={(e) => setPhysicalAddress(e.target.value)}
              placeholder="Address / Location"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Header Logo */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Header Logo URL</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={headerLogoUrl}
                onChange={(e) => setHeaderLogoUrl(formatDirectImageUrl(e.target.value))}
                placeholder="https://..."
                className="flex-1 min-w-0 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
              />
              <label className="cursor-pointer shrink-0 px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/40 rounded-xl font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition active:scale-95 text-xs sm:text-sm">
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') setHeaderLogoUrl(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Favicon */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Favicon URL</label>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(formatDirectImageUrl(e.target.value))}
                placeholder="https://..."
                className="flex-1 min-w-0 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
              />
              <label className="cursor-pointer shrink-0 px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/40 rounded-xl font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition active:scale-95 text-xs sm:text-sm">
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') setFaviconUrl(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Founder Avatar */}
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Founder Avatar</label>
            <div className="flex gap-2 items-center">
              <input
                type="url"
                value={founderAvatarUrl}
                onChange={(e) => setFounderAvatarUrl(formatDirectImageUrl(e.target.value))}
                placeholder="https://..."
                className="flex-1 min-w-0 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
              />
              <label className="cursor-pointer shrink-0 px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-700/40 rounded-xl font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition active:scale-95 text-xs sm:text-sm">
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === 'string') setFounderAvatarUrl(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-emerald-500/30 shrink-0 flex items-center justify-center">
                <img 
                  src={founderAvatarUrl || 'https://i.ibb.co/vzR0h2M/default-avatar.png'} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons & Badges */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>⚡</span> Product Card Action Buttons
          </h3>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
            Global
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              "Buy" Button Label
            </label>
            <input
              type="text"
              value={defaultBuyButtonText}
              onChange={(e) => setDefaultBuyButtonText(e.target.value)}
              placeholder="e.g. Buy / কিনুন"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 text-sm"
            />
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {['Buy', 'Buy Now', '⚡ কিনুন', 'Order Now'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDefaultBuyButtonText(p)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600 transition cursor-pointer"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              "Watch Preview" Label
            </label>
            <input
              type="text"
              value={defaultWatchPreviewText}
              onChange={(e) => setDefaultWatchPreviewText(e.target.value)}
              placeholder="e.g. Watch Preview"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
        </div>

        {/* Button Icon & Color Theme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Button Icon
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
              {[
                { id: 'lightning', label: '⚡ Bolt', icon: '⚡' },
                { id: 'cart', label: '🛒 Cart', icon: '🛒' },
                { id: 'download', label: '📥 Down', icon: '📥' },
                { id: 'chat', label: '💬 Chat', icon: '💬' },
                { id: 'fire', label: '🔥 Fire', icon: '🔥' },
                { id: 'sparkle', label: '✨ Sparkle', icon: '✨' },
                { id: 'none', label: 'None', icon: '🚫' }
              ].map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDefaultBuyButtonIcon(item.id)}
                  className={`py-1.5 px-1 rounded-xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                    defaultBuyButtonIcon === item.id
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-[8px] truncate max-w-full">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Button Color
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
              {[
                { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
                { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-600' },
                { id: 'amber', label: 'Amber', bg: 'bg-amber-500' },
                { id: 'rose', label: 'Rose', bg: 'bg-rose-500' },
                { id: 'violet', label: 'Violet', bg: 'bg-violet-600' },
                { id: 'slate', label: 'Dark', bg: 'bg-slate-900' }
              ].map(theme => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setDefaultBuyButtonColor(theme.id)}
                  className={`py-1.5 px-1 rounded-xl border text-center font-bold text-xs flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                    defaultBuyButtonColor === theme.id
                      ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-slate-100 dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${theme.bg}`} />
                  <span className="text-[9px] text-slate-600 dark:text-slate-400 truncate max-w-full">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Button Preview:</span>
          <div className={`px-4 py-1.5 rounded-xl text-white font-black text-xs shadow-sm flex items-center gap-1.5 select-none ${
            defaultBuyButtonColor === 'indigo' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' :
            defaultBuyButtonColor === 'amber' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950' :
            defaultBuyButtonColor === 'rose' ? 'bg-gradient-to-r from-rose-500 to-rose-600' :
            defaultBuyButtonColor === 'violet' ? 'bg-gradient-to-r from-violet-500 to-violet-600' :
            defaultBuyButtonColor === 'slate' ? 'bg-gradient-to-r from-slate-800 to-slate-950' :
            'bg-gradient-to-r from-emerald-500 to-emerald-600'
          }`}>
            {defaultBuyButtonIcon !== 'none' && (
              <span>
                {defaultBuyButtonIcon === 'cart' ? '🛒' :
                 defaultBuyButtonIcon === 'download' ? '📥' :
                 defaultBuyButtonIcon === 'chat' ? '💬' :
                 defaultBuyButtonIcon === 'fire' ? '🔥' :
                 defaultBuyButtonIcon === 'sparkle' ? '✨' : '⚡'}
              </span>
            )}
            <span>{defaultBuyButtonText || 'Buy'}</span>
          </div>
        </div>

        {/* Card Meta Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-emerald-500 transition">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Show File Size on Cards
            </span>
            <input
              type="checkbox"
              checked={showCardFileSize}
              onChange={(e) => setShowCardFileSize(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-amber-500 transition">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Show Star Ratings on Cards
            </span>
            <input
              type="checkbox"
              checked={showCardRating}
              onChange={(e) => setShowCardRating(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Dimensions */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" /> Dimensions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Logo Width</label>
            <input
              type="number"
              value={logoWidth}
              onChange={(e) => setLogoWidth(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Logo Height</label>
            <input
              type="number"
              value={logoHeight}
              onChange={(e) => setLogoHeight(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Thumbnail Ratio</label>
            <select
              value={productThumbRatio}
              onChange={(e) => setProductThumbRatio(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="16/9">16/9</option>
              <option value="4/3">4/3</option>
              <option value="1/1">1/1</option>
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Banner Height</label>
            <input
              type="number"
              value={bannerHeight}
              onChange={(e) => setBannerHeight(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Social & Support */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <LinkIcon className="w-3.5 h-3.5" /> Social &amp; Support Contacts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Telegram URL</label>
            <input
              type="text"
              value={telegramUrl}
              onChange={(e) => setTelegramUrl(e.target.value)}
              placeholder="https://t.me/..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">WhatsApp Number</label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+8801XXXXXXXXX"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Support Email</label>
            <input
              type="email"
              value={supportEmail ?? 'filemarket.help@gmail.com'}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="support@example.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium text-sm"
            />
          </div>
        </div>
      </div>

      {/* Play Store App Banner */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
            <span>🤖</span> Play Store Download Banner
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(playStoreEnabled)}
              onChange={(e) => setPlayStoreEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {playStoreEnabled && (
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <input
              type="url"
              value={playStoreUrl || ''}
              onChange={(e) => setPlayStoreUrl(e.target.value)}
              placeholder="https://play.google.com/store/apps/details?id=..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white outline-none focus:border-emerald-500 font-medium"
            />
          </div>
        )}
      </div>

      {/* Bottom Save Button for Mobile Accessibility */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSaveAllSettings}
          disabled={isSaving}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
        </button>
      </div>
    </div>
  );
};
