import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Image as ImageIcon, 
  Layers, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  ExternalLink,
  PhoneCall,
  Phone,
  Mail,
  Share2,
  X,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  FileText,
  Sparkles,
  MapPin,
  MessageCircle,
  HelpCircle,
  Link as LinkIcon
} from 'lucide-react';
import { GlobalConfig, DEFAULT_GLOBAL_CONFIG } from '../../types';
import { subscribeGlobalConfig, saveGlobalConfig } from '../../lib/adminServices';
import { useBrand } from '../../context/BrandContext';
import { ImageUploadField } from './ImageUploadField';
import { AdminCustomPagesEditor } from './AdminCustomPagesEditor';

interface NavLinkItem {
  id: string;
  label: string;
  url: string;
  openInNewTab?: boolean;
  badge?: string;
}

const DEFAULT_NAV_LINKS: NavLinkItem[] = [
  { id: '1', label: 'All Products', url: '/', openInNewTab: false },
  { id: '2', label: 'Video Bundles', url: '/category/bundles', openInNewTab: false, badge: '🔥 Hot' },
  { id: '3', label: 'Online Courses', url: '/category/courses', openInNewTab: false },
  { id: '4', label: 'PHP Scripts', url: '/category/scripts', openInNewTab: false },
  { id: '5', label: 'Premium Apps', url: '/category/apps', openInNewTab: false },
  { id: '6', label: 'Cloud Locker', url: '/my-products', openInNewTab: false, badge: '⚡ Vault' },
];

export const AdminCMSView: React.FC = () => {
  const [config, setConfig] = useState<GlobalConfig>(DEFAULT_GLOBAL_CONFIG);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const { updateBrand } = useBrand();

  // Active Sub-Tab: 'header' | 'navigation' | 'footer' | 'social' | 'policies' | 'custom-pages'
  const [activeSubTab, setActiveSubTab] = useState<'header' | 'navigation' | 'footer' | 'social' | 'policies' | 'custom-pages'>('header');

  // Header & Branding Form State
  const [siteTitle, setSiteTitle] = useState('FileMarket Digital');
  const [siteFavicon, setSiteFavicon] = useState('https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10');
  const [mainLogoUrl, setMainLogoUrl] = useState('https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10');
  const [darkLogoUrl, setDarkLogoUrl] = useState('https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10');
  const [headerTagline, setHeaderTagline] = useState('World-Class Source Codes & Digital Assets');
  const [announcementText, setAnnouncementText] = useState('⚡ Flash Deal: 50% Off Lifetime VIP Access across all digital products today!');

  // Navigation Links Builder State
  const [navLinks, setNavLinks] = useState<NavLinkItem[]>(() => {
    try {
      const saved = localStorage.getItem('fm_custom_nav_links');
      return saved ? JSON.parse(saved) : DEFAULT_NAV_LINKS;
    } catch {
      return DEFAULT_NAV_LINKS;
    }
  });
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);
  const [editingNavIndex, setEditingNavIndex] = useState<number | null>(null);
  const [navForm, setNavForm] = useState<NavLinkItem>({
    id: '',
    label: '',
    url: '',
    openInNewTab: false,
    badge: ''
  });

  // Footer & Contact Info State
  const [footerAbout, setFooterAbout] = useState('FileMarket is Bangladesh’s premier digital asset powerhouse delivering premium scripts, video reels, graphic bundles, and online courses with instant automated verification.');
  const [copyrightNotice, setCopyrightNotice] = useState(`© ${new Date().getFullYear()} FileMarket Digital Marketplace. All Rights Reserved.`);
  const [supportEmail, setSupportEmail] = useState('support@filemarket.site');
  const [supportPhone, setSupportPhone] = useState('+8801673833783');
  const [officeAddress, setOfficeAddress] = useState('Dhaka, Bangladesh');
  const [whatsappNumber, setWhatsappNumber] = useState('01673833783');

  // Social Media Links
  const [socialFacebook, setSocialFacebook] = useState('https://facebook.com/filemarket');
  const [socialYoutube, setSocialYoutube] = useState('https://youtube.com/@filemarket');
  const [socialTiktok, setSocialTiktok] = useState('https://tiktok.com/@filemarket');
  const [socialTelegram, setSocialTelegram] = useState('https://t.me/filemarket_official');
  const [socialTwitter, setSocialTwitter] = useState('https://x.com/filemarket');
  const [socialInstagram, setSocialInstagram] = useState('https://instagram.com/filemarket');
  const [socialDiscord, setSocialDiscord] = useState('https://discord.gg/filemarket');

  // Policy Switchers
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(true);
  const [showTermsOfService, setShowTermsOfService] = useState(true);
  const [showRefundPolicy, setShowRefundPolicy] = useState(true);
  const [showAboutContact, setShowAboutContact] = useState(true);

  // Sync with Firestore config
  useEffect(() => {
    const unsub = subscribeGlobalConfig((newConfig) => {
      setConfig(newConfig);
      if (newConfig.branding) {
        setSiteTitle(newConfig.branding.siteName || 'FileMarket Digital');
        setMainLogoUrl(newConfig.branding.logoUrl || 'https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10');
        setDarkLogoUrl(newConfig.branding.darkLogoUrl || newConfig.branding.logoUrl || 'https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10');
        setSiteFavicon(newConfig.branding.faviconUrl || 'https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10');
        setHeaderTagline(newConfig.branding.tagline || 'World-Class Source Codes & Digital Assets');
        setAnnouncementText(newConfig.branding.announcement || '');
      }
      if (newConfig.footerAndBadges) {
        setFooterAbout(newConfig.footerAndBadges.aboutText || '');
        setCopyrightNotice(newConfig.footerAndBadges.copyright || `© ${new Date().getFullYear()} FileMarket Digital Marketplace.`);
        setSupportEmail(newConfig.footerAndBadges.supportEmail || 'support@filemarket.site');
        setSupportPhone(newConfig.footerAndBadges.supportPhone || '+8801673833783');
        setOfficeAddress(newConfig.footerAndBadges.address || 'Dhaka, Bangladesh');
        setWhatsappNumber(newConfig.footerAndBadges.whatsapp || '01673833783');
      }
      if ((newConfig as any).navLinks && Array.isArray((newConfig as any).navLinks)) {
        setNavLinks((newConfig as any).navLinks);
      }
      if ((newConfig as any).socials) {
        const s = (newConfig as any).socials;
        setSocialFacebook(s.facebook || '');
        setSocialYoutube(s.youtube || '');
        setSocialTiktok(s.tiktok || '');
        setSocialTelegram(s.telegram || '');
        setSocialTwitter(s.twitter || '');
        setSocialInstagram(s.instagram || '');
        setSocialDiscord(s.discord || '');
      }
      if ((newConfig as any).policyVisibility) {
        const p = (newConfig as any).policyVisibility;
        setShowPrivacyPolicy(p.privacy !== undefined ? p.privacy : true);
        setShowTermsOfService(p.terms !== undefined ? p.terms : true);
        setShowRefundPolicy(p.refund !== undefined ? p.refund : true);
        setShowAboutContact(p.about !== undefined ? p.about : true);
      }
    });
    return () => unsub();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);

    const updatedConfig: GlobalConfig = {
      ...config,
      branding: {
        ...config.branding,
        siteName: siteTitle,
        logoUrl: mainLogoUrl,
        darkLogoUrl: darkLogoUrl,
        faviconUrl: siteFavicon,
        tagline: headerTagline,
        announcement: announcementText
      },
      footerAndBadges: {
        ...config.footerAndBadges,
        aboutText: footerAbout,
        copyright: copyrightNotice,
        supportEmail,
        supportPhone,
        address: officeAddress,
        whatsapp: whatsappNumber
      },
      ...({
        navLinks,
        socials: {
          facebook: socialFacebook,
          youtube: socialYoutube,
          tiktok: socialTiktok,
          telegram: socialTelegram,
          twitter: socialTwitter,
          instagram: socialInstagram,
          discord: socialDiscord
        },
        policyVisibility: {
          privacy: showPrivacyPolicy,
          terms: showTermsOfService,
          refund: showRefundPolicy,
          about: showAboutContact
        }
      } as any)
    };

    try {
      await saveGlobalConfig(updatedConfig);
      await updateBrand(mainLogoUrl, siteTitle);
      localStorage.setItem('fm_custom_nav_links', JSON.stringify(navLinks));
      showToast('Header & Footer customizations synchronized to Firestore! ✅');
    } catch (err) {
      console.error(err);
      showToast('Failed to save customizations.');
    } finally {
      setSaving(false);
    }
  };

  // Nav Links Handlers
  const handleOpenAddNav = () => {
    setEditingNavIndex(null);
    setNavForm({
      id: `nav-${Date.now()}`,
      label: '',
      url: '/',
      openInNewTab: false,
      badge: ''
    });
    setIsNavModalOpen(true);
  };

  const handleOpenEditNav = (index: number) => {
    setEditingNavIndex(index);
    setNavForm({ ...navLinks[index] });
    setIsNavModalOpen(true);
  };

  const handleSaveNavModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!navForm.label.trim() || !navForm.url.trim()) return;

    let updated = [...navLinks];
    if (editingNavIndex !== null) {
      updated[editingNavIndex] = navForm;
    } else {
      updated.push(navForm);
    }
    setNavLinks(updated);
    setIsNavModalOpen(false);
  };

  const handleDeleteNav = (index: number) => {
    setNavLinks(navLinks.filter((_, i) => i !== index));
  };

  const handleMoveNav = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === navLinks.length - 1)
    ) return;

    const updated = [...navLinks];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setNavLinks(updated);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="cursor-pointer font-extrabold">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-500" />
            Global Header & Footer Customizer
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Customize logos, navigation menu links, contact info, social accounts, and policy switchers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSaveAll()}
          disabled={saving}
          className="px-5 py-2.5 text-xs font-black rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-60 self-start sm:self-center"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
        </button>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700/60 overflow-x-auto">
        {[
          { id: 'header', label: 'Header & Logos' },
          { id: 'navigation', label: 'Navigation Menu Builder' },
          { id: 'footer', label: 'Footer & Contact' },
          { id: 'social', label: 'Social Media Links' },
          { id: 'policies', label: 'Policy Pages Switcher' },
          { id: 'custom-pages', label: 'Custom Pages & CMS Editor' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: HEADER & LOGOS */}
      {activeSubTab === 'header' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            <h3 className="text-sm font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Brand Identity & Site Title
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Site Title / Brand Name *</label>
                <input
                  type="text"
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                  placeholder="FileMarket Digital"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Header Tagline</label>
                <input
                  type="text"
                  value={headerTagline}
                  onChange={(e) => setHeaderTagline(e.target.value)}
                  placeholder="World-Class Source Codes & Software"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Top Header Announcement Bar</label>
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="⚡ Flash Deal: 50% Off Lifetime VIP Access across all digital products today!"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <h3 className="text-sm font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Brand Logos & Favicon Uploader
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ImageUploadField
                label="Main Brand Logo (Light Mode)"
                value={mainLogoUrl}
                onChange={setMainLogoUrl}
                placeholder="https://..."
                folder="brand"
                aspectRatio="square"
                helpText="Visible on light backgrounds in store header and invoices."
              />

              <ImageUploadField
                label="Dark Mode Brand Logo"
                value={darkLogoUrl}
                onChange={setDarkLogoUrl}
                placeholder="https://..."
                folder="brand"
                aspectRatio="square"
                helpText="Displayed when customer activates dark theme."
              />

              <ImageUploadField
                label="Site Favicon (32x32 / SVG)"
                value={siteFavicon}
                onChange={setSiteFavicon}
                placeholder="https://..."
                folder="brand"
                aspectRatio="square"
                helpText="Browser tab icon displayed in bookmarks and search results."
              />
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: NAVIGATION MENU BUILDER */}
      {activeSubTab === 'navigation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Storefront Header Menu Links</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Add, edit, reorder or remove navigation items</p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddNav}
              className="px-3.5 py-2 text-xs font-black rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Link</span>
            </button>
          </div>

          <div className="space-y-2">
            {navLinks.map((item, index) => (
              <div
                key={item.id || index}
                className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs hover:border-emerald-500/30 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">{item.url}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveNav(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveNav(index, 'down')}
                    disabled={index === navLinks.length - 1}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEditNav(index)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteNav(index)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: FOOTER & CONTACT INFO */}
      {activeSubTab === 'footer' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Footer Description & Copyright
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">About Marketplace (Footer Bio)</label>
              <textarea
                rows={3}
                value={footerAbout}
                onChange={(e) => setFooterAbout(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Copyright Notice</label>
              <input
                type="text"
                value={copyrightNotice}
                onChange={(e) => setCopyrightNotice(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Official Contact & Support Channels
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Support Email</span>
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Helpline Phone Number</span>
                </label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>WhatsApp Business Number</span>
                </label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  <span>HQ Office Address</span>
                </label>
                <input
                  type="text"
                  value={officeAddress}
                  onChange={(e) => setOfficeAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SOCIAL MEDIA LINKS */}
      {activeSubTab === 'social' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Social Media Communities & Profiles
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Facebook Page / Group URL</label>
              <input
                type="url"
                value={socialFacebook}
                onChange={(e) => setSocialFacebook(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">YouTube Channel URL</label>
              <input
                type="url"
                value={socialYoutube}
                onChange={(e) => setSocialYoutube(e.target.value)}
                placeholder="https://youtube.com/@..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">TikTok Profile URL</label>
              <input
                type="url"
                value={socialTiktok}
                onChange={(e) => setSocialTiktok(e.target.value)}
                placeholder="https://tiktok.com/@..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Telegram Channel / Support Bot</label>
              <input
                type="url"
                value={socialTelegram}
                onChange={(e) => setSocialTelegram(e.target.value)}
                placeholder="https://t.me/..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Twitter / X Profile</label>
              <input
                type="url"
                value={socialTwitter}
                onChange={(e) => setSocialTwitter(e.target.value)}
                placeholder="https://x.com/..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Instagram URL</label>
              <input
                type="url"
                value={socialInstagram}
                onChange={(e) => setSocialInstagram(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: POLICY PAGES SWITCHER */}
      {activeSubTab === 'policies' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Legal & Policy Pages Visibility
          </h3>

          <div className="space-y-3">
            {[
              {
                title: 'Privacy Policy Page (/privacy-policy)',
                desc: 'Displays GDPR & data protection notices in footer links',
                val: showPrivacyPolicy,
                set: setShowPrivacyPolicy
              },
              {
                title: 'Terms of Service Page (/terms)',
                desc: 'Displays license usage terms and store legal disclaimer',
                val: showTermsOfService,
                set: setShowTermsOfService
              },
              {
                title: 'Refund & License Policy (/refund)',
                desc: 'Explains digital download terms and refund warranty details',
                val: showRefundPolicy,
                set: setShowRefundPolicy
              },
              {
                title: 'About Us & Contact Page (/about)',
                desc: 'Provides full company info, support forms, and founder bio',
                val: showAboutContact,
                set: setShowAboutContact
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => item.set(!item.val)}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                    item.val ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    item.val ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 6: CUSTOM PAGES & CMS EDITOR */}
      {activeSubTab === 'custom-pages' && (
        <AdminCustomPagesEditor />
      )}

      {/* Nav Link Modal */}
      {isNavModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {editingNavIndex !== null ? 'Edit Menu Link' : 'Add Navigation Link'}
              </h3>
              <button
                type="button"
                onClick={() => setIsNavModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNavModal} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Link Title / Label *</label>
                <input
                  type="text"
                  required
                  value={navForm.label}
                  onChange={(e) => setNavForm({ ...navForm, label: e.target.value })}
                  placeholder="e.g. PHP Scripts"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Target Route or URL *</label>
                <input
                  type="text"
                  required
                  value={navForm.url}
                  onChange={(e) => setNavForm({ ...navForm, url: e.target.value })}
                  placeholder="e.g. /category/scripts or https://..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Badge / Pill (Optional)</label>
                <input
                  type="text"
                  value={navForm.badge}
                  onChange={(e) => setNavForm({ ...navForm, badge: e.target.value })}
                  placeholder="e.g. 🔥 Hot or ⚡ New"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNavModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-black rounded-xl bg-emerald-500 text-slate-950 cursor-pointer"
                >
                  Save Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCMSView;
