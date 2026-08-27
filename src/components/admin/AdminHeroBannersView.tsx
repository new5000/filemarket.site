import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink, 
  Sparkles, 
  Image as ImageIcon,
  Save,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { HeroBannerSlide, HeroBannersData } from '../../types';
import { DEFAULT_HERO_BANNERS } from '../../context/GlobalSettingsContext';
import { ImageUploadField } from './ImageUploadField';

interface AdminHeroBannersViewProps {
  onRefresh?: () => void;
}

export const AdminHeroBannersView: React.FC<AdminHeroBannersViewProps> = ({ onRefresh }) => {
  const [heroBanners, setHeroBanners] = useState<HeroBannersData>(DEFAULT_HERO_BANNERS);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formSlide, setFormSlide] = useState<HeroBannerSlide>({
    id: 1,
    badge: '⚡ Instant Access',
    headline: 'Premium Source Codes & Software',
    subtext: 'Direct Google Drive high-speed downloads with verified licenses.',
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop',
    actionLink: '/category/scripts',
    actionText: 'Explore Scripts'
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Real-time Firestore sync
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'hero_banners'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setHeroBanners({
          banners: data.banners || DEFAULT_HERO_BANNERS.banners,
          autoPlayInterval: data.autoPlayInterval || 5000,
          isEnabled: data.isEnabled !== undefined ? data.isEnabled : true
        });
      } else {
        setHeroBanners(DEFAULT_HERO_BANNERS);
      }
    }, (err) => {
      console.warn('Error fetching hero banners:', err);
    });
    return () => unsub();
  }, []);

  const saveBannersToFirestore = async (updatedData: HeroBannersData) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'system_settings', 'hero_banners'), {
        ...updatedData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      showToast('Hero Banners synchronized to Firestore successfully! ✅');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Error saving hero banners:', err);
      showToast('Failed to save hero banners.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleGlobalEnabled = async () => {
    const next = !heroBanners.isEnabled;
    const updated = { ...heroBanners, isEnabled: next };
    setHeroBanners(updated);
    await saveBannersToFirestore(updated);
  };

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setFormSlide({
      id: Date.now(),
      badge: '⚡ Special Deal',
      headline: '',
      subtext: '',
      imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop',
      actionLink: '/',
      actionText: 'Explore Now'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (index: number) => {
    setEditingIndex(index);
    setFormSlide({ ...heroBanners.banners[index] });
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSlide.headline.trim()) {
      alert('Please enter a headline for the banner.');
      return;
    }

    let newBanners = [...heroBanners.banners];
    if (editingIndex !== null) {
      newBanners[editingIndex] = formSlide;
    } else {
      newBanners.push(formSlide);
    }

    const updated = { ...heroBanners, banners: newBanners };
    setHeroBanners(updated);
    setIsModalOpen(false);
    await saveBannersToFirestore(updated);
  };

  const handleDeleteBanner = async (index: number) => {
    if (!window.confirm(`Delete banner "${heroBanners.banners[index].headline}"?`)) return;
    const newBanners = heroBanners.banners.filter((_, i) => i !== index);
    const updated = { ...heroBanners, banners: newBanners };
    setHeroBanners(updated);
    await saveBannersToFirestore(updated);
  };

  const handleMoveSlide = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === heroBanners.banners.length - 1)
    ) return;

    const newBanners = [...heroBanners.banners];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIdx];
    newBanners[targetIdx] = temp;

    const updated = { ...heroBanners, banners: newBanners };
    setHeroBanners(updated);
    await saveBannersToFirestore(updated);
  };

  const handleResetToDefault = async () => {
    if (!window.confirm('Reset all Hero Banners to official marketplace defaults?')) return;
    setHeroBanners(DEFAULT_HERO_BANNERS);
    await saveBannersToFirestore(DEFAULT_HERO_BANNERS);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-lg animate-fade-in ${
          toastMessage.type === 'success' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="cursor-pointer font-extrabold">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Tv className="w-5 h-5 text-emerald-500" />
            Hero Banner & Promo Manager
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure homepage hero slider graphics, call-to-action triggers, and promo badges with real-time Firestore sync.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1.5"
            title="Reset to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-black rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Banner</span>
          </button>
        </div>
      </div>

      {/* Global Slider Controls */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Enable Hero Slider on Storefront</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Toggle whether the hero section is visible to visitors</div>
          </div>
          <button
            type="button"
            onClick={handleToggleGlobalEnabled}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
              heroBanners.isEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
              heroBanners.isEnabled ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">Auto-Play Slide Speed</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">Interval before switching to next banner</div>
          </div>
          <select
            value={heroBanners.autoPlayInterval}
            onChange={(e) => {
              const val = Number(e.target.value);
              const updated = { ...heroBanners, autoPlayInterval: val };
              setHeroBanners(updated);
              saveBannersToFirestore(updated);
            }}
            className="text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value={3000}>3 Seconds (Fast)</option>
            <option value={5000}>5 Seconds (Standard)</option>
            <option value={8000}>8 Seconds (Relaxed)</option>
            <option value={12000}>12 Seconds (Slow)</option>
          </select>
        </div>
      </div>

      {/* Visual Banners List / Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Active Banners Queue ({heroBanners.banners.length})
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Use arrows to reorder banner priority index
          </span>
        </div>

        {heroBanners.banners.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
            <Tv className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Hero Banners Found</h4>
            <p className="text-xs text-slate-400 mt-1 mb-4">Add your first promotional hero slide or restore defaults.</p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 text-slate-950 cursor-pointer"
            >
              Add Slide Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {heroBanners.banners.map((banner, index) => (
              <div 
                key={banner.id || index}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between group"
              >
                {/* Artwork Thumbnail Header */}
                <div className="relative h-40 bg-slate-950 overflow-hidden">
                  <img 
                    src={banner.imageUrl} 
                    alt={banner.headline}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-between p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-md bg-emerald-500/90 text-slate-950 text-[10px] font-black tracking-wide">
                        {banner.badge || 'PROMO'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-mono font-bold">
                        Slide #{index + 1}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white leading-tight line-clamp-1">
                        {banner.headline}
                      </h4>
                      <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                        {banner.subtext}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Details & Actions Footer */}
                <div className="p-3.5 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      {banner.actionText} → <code className="text-[10px] text-slate-400 font-mono">{banner.actionLink}</code>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleMoveSlide(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-500 disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveSlide(index, 'down')}
                      disabled={index === heroBanners.banners.length - 1}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-500 disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(index)}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-500 cursor-pointer"
                      title="Edit Banner"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBanner(index)}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Banner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Tv className="w-4 h-4 text-emerald-500" />
                {editingIndex !== null ? 'Edit Hero Banner Slide' : 'Create New Hero Banner Slide'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-5 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Headline / Main Title *
                </label>
                <input
                  type="text"
                  required
                  value={formSlide.headline}
                  onChange={(e) => setFormSlide({ ...formSlide, headline: e.target.value })}
                  placeholder="e.g. Premium PHP Scripts & Web Software"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Subtitle / Description
                </label>
                <textarea
                  rows={2}
                  value={formSlide.subtext}
                  onChange={(e) => setFormSlide({ ...formSlide, subtext: e.target.value })}
                  placeholder="e.g. Instant Google Drive downloads with lifetime license and 24/7 support."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={formSlide.badge}
                    onChange={(e) => setFormSlide({ ...formSlide, badge: e.target.value })}
                    placeholder="e.g. ⚡ Flash Deal (50% Off)"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={formSlide.actionText}
                    onChange={(e) => setFormSlide({ ...formSlide, actionText: e.target.value })}
                    placeholder="e.g. Explore Scripts"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  CTA Target Link / Route URL
                </label>
                <input
                  type="text"
                  value={formSlide.actionLink}
                  onChange={(e) => setFormSlide({ ...formSlide, actionLink: e.target.value })}
                  placeholder="e.g. /category/scripts or https://..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* Background Artwork Uploader */}
              <ImageUploadField
                label="Slide Background Artwork (Upload or URL)"
                value={formSlide.imageUrl}
                onChange={(url) => setFormSlide({ ...formSlide, imageUrl: url })}
                placeholder="https://images.unsplash.com/..."
                folder="banners"
                aspectRatio="banner"
                helpText="Recommended dimensions: 1920x800 or 1200x500 for crisp visual presentation."
              />

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-black rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-md shadow-emerald-500/20 disabled:opacity-60 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Banner Slide'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHeroBannersView;
