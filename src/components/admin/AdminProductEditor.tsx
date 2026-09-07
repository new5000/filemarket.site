import React, { useState, useEffect, useRef } from 'react';
import { Product, PreviewBlock, AdSizePreset } from '../../types';
import { 
  X, Save, Package, Sparkles, Zap, Video, Code, ArrowUp, ArrowDown, Trash2, Check, 
  Link as LinkIcon, Images, Plus, Upload, Loader2, Globe, Eye, EyeOff, Layout, ToggleLeft, ToggleRight,
  Star, Heart, MessageSquare, ShoppingCart, Play, HardDrive, MessageCircle, Clock, Send,
  CheckCircle2, ChevronRight, ChevronLeft, AlertCircle, Percent, Sliders, Layers
} from 'lucide-react';
import { ImageUploadField } from './ImageUploadField';
import { AdminVideoAdManager } from './AdminVideoAdManager';
import { formatDirectImageUrl } from '../../utils/formatImageUrl';
import { generateSeoKeywordCluster } from '../../utils/seoKeywordGenerator';
import { compressImageFile, compressImageDataUrl } from '../../lib/storageService';

const normalizeTagsArray = (rawTags: any): string[] => {
  if (!rawTags) return [];
  if (Array.isArray(rawTags)) {
    return rawTags.filter(t => typeof t === 'string' && t.trim().length > 0);
  }
  if (typeof rawTags === 'string') {
    return rawTags.split(',').map(t => t.trim()).filter(Boolean);
  }
  if (typeof rawTags === 'object' && rawTags.keywordsList && Array.isArray(rawTags.keywordsList)) {
    return rawTags.keywordsList;
  }
  return [];
};

export interface AdminProductEditorProps {
  initialProduct: Partial<Product> | null;
  onSave: (product: Partial<Product>) => Promise<void>;
  onCancel: () => void;
}

export const AdminProductEditor: React.FC<AdminProductEditorProps> = ({
  initialProduct,
  onSave,
  onCancel
}) => {
  const categories = [
    'Video Bundles',
    'Graphics & UI',
    'Audio & Music',
    'Code & Scripts',
    'eBooks & Docs',
    'Courses',
    'Presets & LUTs',
    '3D Models',
    'Digital Services',
    'Other'
  ];

  const [formData, setFormData] = useState<Partial<Product>>(() => {
    if (initialProduct) {
      return {
        ...initialProduct,
        title: initialProduct.title || '',
        category: initialProduct.category || 'Video Bundles',
        priceBDT: initialProduct.priceBDT !== undefined ? Number(initialProduct.priceBDT) : 499,
        priceUSD: initialProduct.priceUSD !== undefined ? Number(initialProduct.priceUSD) : 4.99,
        originalPriceBDT: initialProduct.originalPriceBDT !== undefined ? Number(initialProduct.originalPriceBDT) : 1500,
        thumbnail: initialProduct.thumbnail || '',
        previewImages: initialProduct.previewImages || initialProduct.gallery || [],
        gallery: initialProduct.previewImages || initialProduct.gallery || [],
        badge: initialProduct.badge || '',
        rating: initialProduct.rating !== undefined ? Number(initialProduct.rating) : 4.9,
        reviewsCount: initialProduct.reviewsCount !== undefined ? Number(initialProduct.reviewsCount) : 1,
        likesCount: initialProduct.likesCount || '8.3k',
        showFileSize: (initialProduct as any).showFileSize !== false && (initialProduct.fileSize || '').toLowerCase() !== 'off',
        showRating: (initialProduct as any).showRating !== false,
        watchPreviewButtonText: initialProduct.watchPreviewButtonText || 'Watch Preview',
        enableWatchPreview: initialProduct.enableWatchPreview !== false,
        buyButtonText: initialProduct.buyButtonText || '',
        cardSubtitle: initialProduct.cardSubtitle || initialProduct.licenseTerms || initialProduct.license || 'Commercial & Personal Lifetime License',
        productKind: initialProduct.productKind || 'digital',
        deliveryTime: initialProduct.deliveryTime || '24-48 Hours',
        whatsappNumber: initialProduct.whatsappNumber || '',
        whatsappMessage: initialProduct.whatsappMessage || '',
        whatsappOrderEnabled: initialProduct.whatsappOrderEnabled !== false && (initialProduct.productKind === 'service' || Boolean(initialProduct.whatsappNumber || initialProduct.whatsappMessage)),
        whatsappButtonText: initialProduct.whatsappButtonText || 'Order on WhatsApp',
        stockQuantity: initialProduct.stockQuantity !== undefined ? initialProduct.stockQuantity : 50,
        sku: initialProduct.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
        fileSize: initialProduct.fileSize !== undefined ? initialProduct.fileSize : '',
        softwareFormat: initialProduct.softwareFormat || initialProduct.fileFormat || 'APK / DNG Presets',
        fileFormat: initialProduct.fileFormat || initialProduct.softwareFormat || 'APK / DNG Presets',
        instantDownloadLink: initialProduct.instantDownloadLink || '',
        liveDemoEnabled: initialProduct.liveDemoEnabled !== false,
        liveDemoUrl: initialProduct.liveDemoUrl || initialProduct.previewWebsiteUrl || '',
        liveDemoButtonText: initialProduct.liveDemoButtonText || 'Open Full Interactive Live Demo Website ↗',
        enableGallery: initialProduct.enableGallery !== false,
        enableVideo: initialProduct.enableVideo !== false,
        previewBlocks: initialProduct.previewBlocks && initialProduct.previewBlocks.length > 0 
          ? initialProduct.previewBlocks 
          : [{ id: 'b1', type: 'player', url: initialProduct.previewVideoUrl || initialProduct.demoUrl || '', aspectRatio: '9:16', enabled: true }],
        description: initialProduct.description || '',
        features: initialProduct.bundleFeatures || initialProduct.features || ['Instant Direct Google Drive Delivery', 'Commercial Usage License Included', '24/7 Lifetime Support'],
        bundleFeatures: initialProduct.bundleFeatures || initialProduct.features || ['Instant Direct Google Drive Delivery', 'Commercial Usage License Included', '24/7 Lifetime Support'],
        tags: normalizeTagsArray(initialProduct.tags)
      };
    }
    return {
      title: '',
      category: 'Video Bundles',
      priceBDT: 499,
      priceUSD: 4.99,
      originalPriceBDT: 1500,
      thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
      previewImages: [],
      gallery: [],
      badge: '',
      rating: 4.9,
      reviewsCount: 1,
      likesCount: '8.3k',
      showFileSize: true,
      showRating: true,
      watchPreviewButtonText: 'Watch Preview',
      enableWatchPreview: true,
      buyButtonText: '',
      cardSubtitle: 'Commercial & Personal Lifetime License',
      productKind: 'digital',
      deliveryTime: '24-48 Hours',
      whatsappNumber: '',
      whatsappMessage: '',
      whatsappOrderEnabled: false,
      whatsappButtonText: 'Order on WhatsApp',
      stockQuantity: 50,
      fileSize: '',
      fileFormat: 'APK / DNG Presets',
      softwareFormat: 'APK / DNG Presets',
      instantDownloadLink: '',
      liveDemoEnabled: false,
      liveDemoUrl: '',
      liveDemoButtonText: 'Open Full Interactive Live Demo Website ↗',
      enableGallery: true,
      enableVideo: true,
      previewBlocks: [{ id: 'b1', type: 'player', url: '', aspectRatio: '9:16', enabled: true }],
      description: '',
      features: ['Instant Google Drive Direct Download', 'Commercial & Personal Usage License Included', 'Lifetime Access & Free Updates'],
      bundleFeatures: ['Instant Google Drive Direct Download', 'Commercial & Personal Usage License Included', 'Lifetime Access & Free Updates'],
      tags: []
    };
  });

  const [tagsInput, setTagsInput] = useState<string>(() => normalizeTagsArray(initialProduct?.tags).join(', '));
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [newGalleryUrlInput, setNewGalleryUrlInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [isProcessingGalleryFiles, setIsProcessingGalleryFiles] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'general' | 'delivery' | 'media' | 'badges' | 'seo' | 'all'>('general');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialProduct) {
      const safeTags = normalizeTagsArray(initialProduct.tags);
      setFormData(prev => ({
        ...prev,
        ...initialProduct,
        tags: safeTags,
        rating: initialProduct.rating !== undefined ? Number(initialProduct.rating) : (prev.rating ?? 4.9),
        reviewsCount: initialProduct.reviewsCount !== undefined ? Number(initialProduct.reviewsCount) : (prev.reviewsCount ?? 1),
        likesCount: initialProduct.likesCount || prev.likesCount || '8.3k',
        watchPreviewButtonText: initialProduct.watchPreviewButtonText || prev.watchPreviewButtonText || 'Watch Preview',
        enableWatchPreview: initialProduct.enableWatchPreview !== false,
        buyButtonText: initialProduct.buyButtonText || prev.buyButtonText || '',
        liveDemoEnabled: initialProduct.liveDemoEnabled !== false,
        liveDemoUrl: initialProduct.liveDemoUrl || initialProduct.previewWebsiteUrl || prev.liveDemoUrl || '',
        liveDemoButtonText: initialProduct.liveDemoButtonText || prev.liveDemoButtonText || 'Open Full Interactive Live Demo Website ↗',
        enableGallery: initialProduct.enableGallery !== false,
        enableVideo: initialProduct.enableVideo !== false,
      }));
      setTagsInput(safeTags.join(', '));
    }
  }, [initialProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isPhysical = formData.productKind === 'physical';
    const isService = formData.productKind === 'service';

    const errors: Record<string, string> = {};
    if (!formData.title?.trim()) {
      errors.title = 'প্রোডাক্টের নাম (Product Title) পূরণ করুন';
    }
    if (!formData.priceBDT || Number(formData.priceBDT) <= 0) {
      errors.priceBDT = 'বিক্রয় মূল্য (Sale Price BDT) নির্ধারণ করুন';
    }
    if (!formData.thumbnail?.trim()) {
      errors.thumbnail = 'কভার ইমেজ বা থাম্বনেইল আপলোড করুন';
    }
    if (!isPhysical && !isService && !formData.instantDownloadLink?.trim()) {
      errors.instantDownloadLink = 'ক্লাউড ডাউনলোড লিংক (Google Drive) প্রদান করুন';
    }
    if (!formData.description?.trim()) {
      errors.description = 'প্রোডাক্টের বিবরণ (Description) লিখুন';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      if (errors.title || errors.priceBDT) {
        setActiveTab('general');
      } else if (errors.instantDownloadLink) {
        setActiveTab('delivery');
      } else if (errors.thumbnail) {
        setActiveTab('media');
      } else if (errors.description) {
        setActiveTab('seo');
      }
      return;
    }

    setFormErrors({});
    setSaving(true);
    
    let rawThumbnail = formData.thumbnail || '';
    if (rawThumbnail.startsWith('data:image/') && rawThumbnail.length > 50000) {
      rawThumbnail = await compressImageDataUrl(rawThumbnail, 850, 0.72);
    }

    const rawGallery = (formData.previewImages && formData.previewImages.length > 0)
      ? formData.previewImages
      : (formData.gallery && formData.gallery.length > 0 ? formData.gallery : []);

    const galleryList = await Promise.all(
      rawGallery.map(async (url) => {
        if (url.startsWith('data:image/') && url.length > 50000) {
          return await compressImageDataUrl(url, 850, 0.72);
        }
        return url;
      })
    );

    const activeFeatures = (formData.bundleFeatures && formData.bundleFeatures.length > 0)
      ? formData.bundleFeatures
      : (formData.features && formData.features.length > 0 ? formData.features : ['Instant Google Drive Direct Download']);

    const playerBlocks = (formData.previewBlocks || []).filter(b => b.type === 'player');
    const firstPlayerUrl = playerBlocks.find(b => b.url && b.url.trim().length > 0)?.url || formData.previewVideoUrl || formData.demoUrl || '';

    const effectiveDemoUrl = (formData.liveDemoUrl || '').trim();
    const activeTags = tagsInput.trim().length > 0
      ? tagsInput.split(',').map(t => t.trim()).filter(Boolean)
      : normalizeTagsArray(formData.tags);

    const productPayload: Partial<Product> = {
      ...formData,
      title: (formData.title || '').trim(),
      category: formData.category || 'Video Bundles',
      priceBDT: Number(formData.priceBDT) || 0,
      priceUSD: Number(formData.priceUSD) || 0,
      originalPriceBDT: Number(formData.originalPriceBDT) || 0,
      thumbnail: rawThumbnail,
      previewImages: galleryList,
      gallery: galleryList,
      previewVideoUrl: firstPlayerUrl,
      demoUrl: firstPlayerUrl,
      previewBlocks: formData.previewBlocks || [],
      enableGallery: formData.enableGallery !== false,
      enableVideo: formData.enableVideo !== false,
      watchPreviewButtonText: formData.watchPreviewButtonText || 'Watch Preview',
      enableWatchPreview: formData.enableWatchPreview !== false,
      buyButtonText: (formData.buyButtonText || '').trim(),
      liveDemoUrl: effectiveDemoUrl,
      previewWebsiteUrl: effectiveDemoUrl,
      liveDemoEnabled: Boolean(formData.liveDemoEnabled && effectiveDemoUrl),
      liveDemoButtonText: (formData.liveDemoButtonText || 'Open Full Interactive Live Demo Website ↗').trim(),
      features: activeFeatures,
      bundleFeatures: activeFeatures,
      cardSubtitle: (formData.cardSubtitle || 'Commercial & Personal Lifetime License').trim(),
      rating: formData.rating !== undefined && (formData.rating as any) !== '' ? Number(formData.rating) : 4.9,
      reviewsCount: formData.reviewsCount !== undefined ? Number(formData.reviewsCount) : 1,
      likesCount: (formData.likesCount || '8.3k').trim(),
      showFileSize: formData.showFileSize !== false,
      showRating: formData.showRating !== false,
      productKind: formData.productKind || 'digital',
      deliveryTime: (formData.deliveryTime || '24-48 Hours').trim(),
      whatsappNumber: (formData.whatsappNumber || '').trim(),
      whatsappMessage: (formData.whatsappMessage || '').trim(),
      whatsappOrderEnabled: formData.whatsappOrderEnabled !== false && (formData.productKind === 'service' || Boolean(formData.whatsappNumber || formData.whatsappMessage)),
      whatsappButtonText: (formData.whatsappButtonText || 'Order on WhatsApp').trim(),
      fileFormat: (formData.fileFormat || formData.softwareFormat || 'APK / DNG Presets').trim(),
      softwareFormat: (formData.softwareFormat || formData.fileFormat || 'APK / DNG Presets').trim(),
      instantDownloadLink: (formData.instantDownloadLink || '').trim(),
      description: (formData.description || '').trim(),
      tags: activeTags
    };

    try {
      await onSave(productPayload);
    } catch (err) {
      console.error('Failed to save product in AdminProductEditor:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleMultiImageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingGalleryFiles(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;
        try {
          const compressed = await compressImageFile(file, 850, 0.72);
          newUrls.push(compressed);
        } catch (compErr) {
          console.warn('Image compression fallback:', compErr);
          const reader = new FileReader();
          const fallbackDataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          newUrls.push(fallbackDataUrl);
        }
      }

      if (newUrls.length > 0) {
        setFormData(prev => {
          const current = prev.previewImages || prev.gallery || [];
          const merged = [...current, ...newUrls];
          return {
            ...prev,
            previewImages: merged,
            gallery: merged
          };
        });
      }
    } catch (err) {
      console.error('Multi image upload error:', err);
    } finally {
      setIsProcessingGalleryFiles(false);
      if (galleryFileInputRef.current) {
        galleryFileInputRef.current.value = '';
      }
    }
  };

  const handleClearAllGalleryImages = () => {
    setFormData(prev => ({
      ...prev,
      previewImages: [],
      gallery: []
    }));
  };

  const handleRemoveGalleryImage = (index: number) => {
    const current = formData.previewImages || formData.gallery || [];
    const updated = current.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      previewImages: updated,
      gallery: updated
    });
  };

  const isPhysical = formData.productKind === 'physical';
  const isService = formData.productKind === 'service';

  // Discount percentage calculation for pricing
  const discountPercent = (formData.originalPriceBDT && formData.priceBDT && formData.originalPriceBDT > formData.priceBDT)
    ? Math.round(((formData.originalPriceBDT - formData.priceBDT) / formData.originalPriceBDT) * 100)
    : 0;

  // Completion indicators for tabs
  const tabStatus = {
    general: Boolean(formData.title?.trim() && formData.priceBDT && Number(formData.priceBDT) > 0),
    delivery: Boolean(isPhysical ? true : (isService ? Boolean(formData.whatsappNumber?.trim() || true) : formData.instantDownloadLink?.trim())),
    media: Boolean(formData.thumbnail?.trim()),
    badges: true,
    seo: Boolean(formData.description?.trim()),
  };

  const tabs = [
    { id: 'general', label: '1. General & Pricing', bnLabel: 'মৌলিক ও মূল্য', icon: Zap, valid: tabStatus.general },
    { id: 'delivery', label: '2. Delivery & WhatsApp', bnLabel: 'ডেলিভারি', icon: Send, valid: tabStatus.delivery },
    { id: 'media', label: '3. Visuals & Media', bnLabel: 'ছবি ও ভিডিও', icon: Images, valid: tabStatus.media },
    { id: 'badges', label: '4. Badges & Live Demo', bnLabel: 'ব্যাজ ও ডেমো', icon: Star, valid: tabStatus.badges },
    { id: 'seo', label: '5. Features & SEO', bnLabel: 'ফিচার ও এসইও', icon: Sparkles, valid: tabStatus.seo },
  ] as const;

  const currentTabIndex = tabs.findIndex(t => t.id === activeTab);

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-y-auto animate-in fade-in duration-200">
      {/* Sticky Top Navigation & Action Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                {isService ? <MessageCircle className="w-5 h-5" /> : isPhysical ? <Package className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-heading truncate">
                    {initialProduct?.id ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    isService 
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : isPhysical 
                        ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30'
                        : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {isService ? '🛠️ Digital Service' : isPhysical ? '📦 Physical Parcel' : '⚡ Digital Asset'}
                  </span>
                  {formData.priceBDT ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono">
                      ৳{Number(formData.priceBDT).toLocaleString('en-BD')}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
                  {formData.title || 'Untitled Asset'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab(prev => prev === 'all' ? 'general' : 'all')}
                className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
                title="Toggle between Step-by-Step view and Single Scroll Page"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{activeTab === 'all' ? 'Step Tabs View' : 'All Sections View'}</span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Product</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white transition cursor-pointer sm:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation Stepper Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 mt-2 scrollbar-none border-t border-slate-100 dark:border-slate-800/80">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const hasError = (
                (tab.id === 'general' && (formErrors.title || formErrors.priceBDT)) ||
                (tab.id === 'delivery' && formErrors.instantDownloadLink) ||
                (tab.id === 'media' && formErrors.thumbnail) ||
                (tab.id === 'seo' && formErrors.description)
              );

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-sm font-black'
                      : hasError
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : hasError ? 'text-rose-500' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.valid && !isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  )}
                  {hasError && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ml-auto ${
                activeTab === 'all'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-black'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Sections</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
        {/* Error Alert Banner */}
        {Object.keys(formErrors).length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 flex items-start gap-3 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <p className="font-bold text-sm">দয়া করে নিচের তথ্যগুলো পূরণ করুন:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5 font-medium">
                {Object.values(formErrors).map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          {/* TAB 1: General Info & Pricing */}
          <div className={activeTab === 'all' || activeTab === 'general' ? 'space-y-6' : 'hidden'}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">1</span>
                  <span>Asset Type &amp; Basic Information</span>
                  <span className="text-xs font-normal text-slate-400">(মৌলিক তথ্য)</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  Step 1 of 5
                </span>
              </div>
              
              {/* Asset Type Switcher */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 text-xs uppercase tracking-wider">
                  Select Asset Kind / ধরন নির্বাচন করুন *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, productKind: 'digital' })}
                    className={`p-4 rounded-2xl border-2 font-bold flex flex-col items-center gap-1.5 transition text-center cursor-pointer ${
                      !isPhysical && !isService
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl">⚡</span>
                    <span className="text-xs sm:text-sm font-black">Digital File / Bundle</span>
                    <span className="text-[10px] text-slate-400 font-normal">Cloud Drive Download Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ 
                      ...formData, 
                      productKind: 'service',
                      whatsappOrderEnabled: true,
                      buyButtonText: formData.buyButtonText || 'Order on WhatsApp'
                    })}
                    className={`p-4 rounded-2xl border-2 font-bold flex flex-col items-center gap-1.5 transition text-center cursor-pointer ${
                      isService
                        ? 'bg-emerald-600/15 border-emerald-500 text-emerald-600 dark:text-emerald-300 ring-2 ring-emerald-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-400'
                    }`}
                  >
                    <span className="text-2xl">🛠️</span>
                    <span className="text-xs sm:text-sm font-black">Digital Services</span>
                    <span className="text-[10px] text-emerald-500 font-bold">WhatsApp Direct Order</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, productKind: 'physical' })}
                    className={`p-4 rounded-2xl border-2 font-bold flex flex-col items-center gap-1.5 transition text-center cursor-pointer ${
                      isPhysical
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-700 dark:text-cyan-400 ring-2 ring-cyan-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-2xl">📦</span>
                    <span className="text-xs sm:text-sm font-black">Physical Product</span>
                    <span className="text-[10px] text-slate-400 font-normal">Parcel Shipment</span>
                  </button>
                </div>
              </div>

              {/* Title, Category & Badge */}
              <div className="space-y-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1">
                      <span>Product Title / নাম *</span>
                      <span className="text-rose-500 font-black">*</span>
                    </label>
                    {formErrors.title && (
                      <span className="text-rose-500 text-[11px] font-bold">{formErrors.title}</span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder={isService ? 'e.g. Professional YouTube Thumbnail Design & Branding Service' : isPhysical ? 'e.g. Creator Tech Heavyweight Hoodie' : 'e.g. CapCut Pro Viral Transition Template Bundle'}
                    value={formData.title || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value });
                      if (formErrors.title) setFormErrors(prev => ({ ...prev, title: '' }));
                    }}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white focus:outline-none font-semibold text-sm transition ${
                      formErrors.title ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                    }`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">Category / ক্যাটাগরি *</label>
                    <select
                      value={formData.category || (isService ? 'Digital Services' : 'Video Bundles')}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
                    >
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">Badge Tag / ব্যাজ ট্যাগ (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 🔥 Best Seller, ⚡ 50% OFF, 🎁 Hot Deal"
                      value={formData.badge || ''}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Sub-card */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-500" />
                    <span>Pricing &amp; Currency / মূল্য নির্ধারণ</span>
                  </label>
                  {discountPercent > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      <span>{discountPercent}% Discount Calculated</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">Sale Price (BDT) ৳ *</label>
                      {formErrors.priceBDT && (
                        <span className="text-rose-500 text-[11px] font-bold">{formErrors.priceBDT}</span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                      <input
                        type="number"
                        placeholder="499"
                        value={formData.priceBDT || ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormData({ 
                            ...formData, 
                            priceBDT: val,
                            // Auto-sync USD approximately if USD is empty or roughly 1:100
                            priceUSD: formData.priceUSD ? formData.priceUSD : Number((val / 115).toFixed(2))
                          });
                          if (formErrors.priceBDT) setFormErrors(prev => ({ ...prev, priceBDT: '' }));
                        }}
                        className={`w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white font-black text-lg focus:outline-none transition ${
                          formErrors.priceBDT ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">কাস্টমারকে এই মূল্যে কিনতে হবে</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">Original Price (BDT) ৳</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                      <input
                        type="number"
                        placeholder="1500"
                        value={formData.originalPriceBDT || ''}
                        onChange={(e) => setFormData({ ...formData, originalPriceBDT: Number(e.target.value) })}
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 line-through text-slate-500 font-bold text-base"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">কেটে দেখানো হবে (Strike-through)</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">Auto-Synced USD ($)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="4.99"
                        value={formData.priceUSD || ''}
                        onChange={(e) => setFormData({ ...formData, priceUSD: Number(e.target.value) })}
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">আন্তর্জাতিক কার্ড/পেপ্যালের জন্য</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 2: Delivery & WhatsApp Configuration */}
          <div className={activeTab === 'all' || activeTab === 'delivery' ? 'space-y-6' : 'hidden'}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">2</span>
                  <span>Delivery, Cloud Link &amp; WhatsApp Support</span>
                  <span className="text-xs font-normal text-slate-400">(ডেলিভারি ও হোয়াটসঅ্যাপ)</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  Step 2 of 5
                </span>
              </div>

              {/* If Digital Service: Dedicated WhatsApp Order Panel */}
              {isService && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xs">
                        <MessageCircle className="w-5 h-5 fill-current" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-sm">
                          WhatsApp Order &amp; Direct Delivery Configuration
                        </h4>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                          ক্লায়েন্ট সরাসরি হোয়াটসঅ্যাপে চ্যাট করে সার্ভিস অর্ডার ও পেমেন্ট সম্পন্ন করবে
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      ACTIVE SERVICE
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">
                        WhatsApp Business Number (with country code) *
                      </label>
                      <input
                        type="text"
                        placeholder="8801673833783 (বা কান্ট্রি কোড সহ নম্বর)"
                        value={formData.whatsappNumber || ''}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">যেমন: 8801673833783 (খালি রাখলে ডিফল্ট 8801673833783 ব্যবহৃত হবে)</span>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Estimated Turnaround / Delivery Time *</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 24-48 Hours / 3 Days"
                        value={formData.deliveryTime || ''}
                        onChange={(e) => setFormData({ ...formData, deliveryTime: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">যেমন: ২৪-৪৮ ঘন্টা অথবা ৩ দিন</span>
                    </div>
                  </div>

                  {/* Pre-filled WhatsApp Message Template */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-emerald-500" /> Pre-filled Customer WhatsApp Message
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const defaultMsg = `🚀 *New Digital Service Order / Inquiry - FileMarket*\n━━━━━━━━━━━━━━━━━━━━\n📌 *Service:* ${formData.title || 'Digital Service'}\n💰 *Price:* ৳${formData.priceBDT || 499} BDT\n⚡ *Estimated Delivery:* ${formData.deliveryTime || '24-48 Hours'}\n\nHello Joy / FileMarket, I want to order this digital service. Here are my details and requirements:`;
                          setFormData({ ...formData, whatsappMessage: defaultMsg });
                        }}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> Generate Default Message
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Hello, I want to order this service on FileMarket..."
                      value={formData.whatsappMessage || ''}
                      onChange={(e) => setFormData({ ...formData, whatsappMessage: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  {/* Button Text & Test WhatsApp Link */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">
                        WhatsApp Button Custom Text
                      </label>
                      <input
                        type="text"
                        placeholder="Order on WhatsApp (সরাসরি হোয়াটসঅ্যাপে অর্ডার)"
                        value={formData.whatsappButtonText || ''}
                        onChange={(e) => setFormData({ ...formData, whatsappButtonText: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const targetPhone = (formData.whatsappNumber || '8801673833783').replace(/[^0-9]/g, '');
                          const msg = encodeURIComponent(formData.whatsappMessage || `Hello, I want to order ${formData.title || 'this service'}`);
                          window.open(`https://wa.me/${targetPhone}?text=${msg}`, '_blank', 'noopener,noreferrer');
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                        <span>Test WhatsApp Link (wa.me) ↗</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-emerald-500/20">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">Service Category / Scope</label>
                      <input
                        type="text"
                        placeholder="e.g. Graphic Design / Video Editing / App Customization"
                        value={formData.fileFormat || formData.softwareFormat || ''}
                        onChange={(e) => setFormData({ ...formData, fileFormat: e.target.value, softwareFormat: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">Support &amp; Revision Scope</label>
                      <input
                        type="text"
                        placeholder="e.g. Unlimited Revisions / 1-on-1 VIP WhatsApp Support"
                        value={formData.fileSize || ''}
                        onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* If Digital File / Bundle: Instant Download Link */}
              {!isPhysical && !isService && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
                    <Zap className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <span className="font-bold text-sm block">Instant Cloud Delivery (Google Drive / Mega / Dropbox)</span>
                      <span className="text-xs opacity-80">পেমেন্ট সম্পন্ন হওয়ার সাথে সাথেই কাস্টমার এই লিংক থেকে সরাসরি ফাইল ডাউনলোড করতে পারবে।</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                        <LinkIcon className="w-4 h-4 text-emerald-500" />
                        <span>Cloud Download Link (Google Drive / Direct URL) *</span>
                      </label>
                      {formErrors.instantDownloadLink && (
                        <span className="text-rose-500 text-[11px] font-bold">{formErrors.instantDownloadLink}</span>
                      )}
                    </div>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/drive/folders/... or https://mega.nz/..."
                      value={formData.instantDownloadLink || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, instantDownloadLink: e.target.value });
                        if (formErrors.instantDownloadLink) setFormErrors(prev => ({ ...prev, instantDownloadLink: '' }));
                      }}
                      className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none transition ${
                        formErrors.instantDownloadLink ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                      💡 <strong>টিপস:</strong> গুগল ড্রাইভের লিংক ব্যবহারের সময় নিশ্চিত করুন অ্যাক্সেস দেওয়া আছে: <em>"Anyone with the link can view"</em>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">File Format / সফটওয়্যার ফরম্যাট</label>
                      <input
                        type="text"
                        placeholder="e.g. APK / ZIP / MP4 / DNG Presets"
                        value={formData.fileFormat || formData.softwareFormat || ''}
                        onChange={(e) => setFormData({ ...formData, fileFormat: e.target.value, softwareFormat: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">Total Bundle File Size</label>
                      <input
                        type="text"
                        placeholder="e.g. 15.4 GB"
                        value={formData.fileSize || ''}
                        onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* If Physical Product */}
              {isPhysical && (
                <div className="space-y-4">
                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center gap-3 text-cyan-800 dark:text-cyan-200">
                    <Package className="w-5 h-5 text-cyan-500 shrink-0" />
                    <span className="font-semibold text-sm">Physical item selected: Download link is disabled. Shipment &amp; Parcel tracking applies.</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">Available Stock / মজুত সংখ্যা</label>
                      <input
                        type="number"
                        value={formData.stockQuantity !== undefined ? formData.stockQuantity : 50}
                        onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">SKU / Barcode Identifier</label>
                      <input
                        type="text"
                        value={formData.sku || ''}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TAB 3: Visual Artwork & Media Previews */}
          <div className={activeTab === 'all' || activeTab === 'media' ? 'space-y-6' : 'hidden'}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">3</span>
                  <span>Visual Artwork, Gallery &amp; Video Media</span>
                  <span className="text-xs font-normal text-slate-400">(ছবি ও ভিডিও ডেমো)</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  Step 3 of 5
                </span>
              </div>

              {/* Cover Thumbnail */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Images className="w-4 h-4 text-emerald-500" />
                    <span>Product Main Cover Artwork / থাম্বনেইল *</span>
                  </label>
                  {formErrors.thumbnail && (
                    <span className="text-rose-500 text-[11px] font-bold">{formErrors.thumbnail}</span>
                  )}
                </div>
                <ImageUploadField
                  value={formData.thumbnail || ''}
                  onChange={(val) => {
                    setFormData({ ...formData, thumbnail: val });
                    if (formErrors.thumbnail) setFormErrors(prev => ({ ...prev, thumbnail: '' }));
                  }}
                  placeholder="Paste direct image URL or upload file..."
                  label=""
                />
              </div>

              {/* Preview Tabs Visibility Controls */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Layout className="w-4 h-4 text-emerald-500" />
                  <span>"Watch Preview" Modal Tab Visibility Controls</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Visual Image Gallery Toggle */}
                  <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-emerald-500 transition">
                    <div className="flex items-center gap-2.5">
                      <Images className="w-4 h-4 text-emerald-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">Visual Image Gallery</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Show or hide image carousel tab</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.enableGallery !== false}
                      onChange={(e) => setFormData({ ...formData, enableGallery: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>

                  {/* Video Walkthrough Toggle */}
                  <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-emerald-500 transition">
                    <div className="flex items-center gap-2.5">
                      <Video className="w-4 h-4 text-rose-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">Video Walkthrough</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Show or hide video players &amp; ads tab</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.enableVideo !== false}
                      onChange={(e) => setFormData({ ...formData, enableVideo: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Banner Overlay Button Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <label className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-emerald-500 transition">
                    <div className="flex items-center gap-2.5">
                      <Play className="w-4 h-4 text-emerald-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">"Watch Preview" Button on Banner</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">কার্ড ও ব্যানারে ওয়াচ প্রিভিউ বাটন দেখান বা লুকান</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.enableWatchPreview !== false}
                      onChange={(e) => setFormData({ ...formData, enableWatchPreview: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-xs">
                      Custom "Watch Preview" Button Text
                    </label>
                    <input
                      type="text"
                      placeholder="Watch Preview (বা ভিডিও প্রিভিউ)"
                      value={formData.watchPreviewButtonText || ''}
                      onChange={(e) => setFormData({ ...formData, watchPreviewButtonText: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Watch Preview Gallery Carousel */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                      <Images className="w-4 h-4 text-emerald-500" />
                      <span>Watch Preview Gallery Carousel Slides ({((formData.previewImages || formData.gallery) || []).length} images)</span>
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                      কাস্টমার প্রিভিউ মডালে স্লাইড করে স্ক্রিনশট ও ডেমো ইমেজ দেখতে পারবে
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={galleryFileInputRef}
                      onChange={handleMultiImageFiles}
                      multiple
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => galleryFileInputRef.current?.click()}
                      disabled={isProcessingGalleryFiles}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      {isProcessingGalleryFiles ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Compressing...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Multi Images</span>
                        </>
                      )}
                    </button>

                    {((formData.previewImages || formData.gallery) || []).length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllGalleryImages}
                        className="px-2.5 py-1.5 text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Add image by URL */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Or paste direct image URL and click Add..."
                    value={newGalleryUrlInput}
                    onChange={(e) => setNewGalleryUrlInput(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newGalleryUrlInput.trim()) {
                        const current = formData.previewImages || formData.gallery || [];
                        const updated = [...current, newGalleryUrlInput.trim()];
                        setFormData({ ...formData, previewImages: updated, gallery: updated });
                        setNewGalleryUrlInput('');
                      }
                    }}
                    className="px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>

                {/* Slides grid preview */}
                {((formData.previewImages || formData.gallery) || []).length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-2">
                    {((formData.previewImages || formData.gallery) || []).map((imgUrl, idx) => (
                      <div key={idx} className="relative group aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                        <img
                          src={formatDirectImageUrl(imgUrl)}
                          alt={`Gallery slide ${idx + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-sm cursor-pointer"
                          title="Remove this image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] font-mono rounded">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Previews & Advanced Ad Blocks Manager */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <AdminVideoAdManager
                  previewBlocks={formData.previewBlocks || []}
                  onChange={(updatedBlocks) => setFormData({ ...formData, previewBlocks: updatedBlocks })}
                  enableVideo={formData.enableVideo !== false}
                  onToggleEnableVideo={(enabled) => setFormData({ ...formData, enableVideo: enabled })}
                />
              </div>
            </div>
          </div>

          {/* TAB 4: Badges, Meta & Live Demo */}
          <div className={activeTab === 'all' || activeTab === 'badges' ? 'space-y-6' : 'hidden'}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">4</span>
                  <span>Card Badges, Social Proof &amp; Live Demo</span>
                  <span className="text-xs font-normal text-slate-400">(ব্যাজ ও লাইভ ডেমো)</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  Step 4 of 5
                </span>
              </div>

              {/* Subtitle / License */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">
                  Card Subtitle / Commercial License Text
                </label>
                <input
                  type="text"
                  placeholder="e.g. Commercial & Personal Lifetime License"
                  value={formData.cardSubtitle || ''}
                  onChange={(e) => setFormData({ ...formData, cardSubtitle: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-xs font-medium"
                />
              </div>

              {/* Social Proof, Rating & File Size Controls */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
                <div className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>Card Meta: Rating, File Size, Social Proof &amp; Direct Buy Button</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[10px] shadow-xs">
                    {formData.showRating !== false ? (
                      <span className="text-amber-500 font-black">★ {formData.rating !== undefined && (formData.rating as any) !== '' ? formData.rating : 9.8}</span>
                    ) : (
                      <span className="text-rose-500 font-bold line-through">★ OFF</span>
                    )}
                    {formData.showRating !== false && formData.showFileSize !== false && formData.fileSize && (
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                    )}
                    {formData.showFileSize !== false && formData.fileSize ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formData.fileSize}</span>
                    ) : (
                      <span className="text-rose-500 font-bold">Size: OFF</span>
                    )}
                  </div>
                </div>

                {/* Direct On/Off Switchers for Card Meta Elements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Toggle File Size */}
                  <label className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-emerald-500 transition">
                    <div className="flex items-center gap-2.5">
                      <HardDrive className="w-4 h-4 text-emerald-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          File Size Display
                          {formData.showFileSize !== false ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">ON (প্রদর্শিত)</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/10 text-rose-500">OFF (লুকানো)</span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">কার্ড থেকে ফাইল সাইজ ও ডিভাইডার | মুছে ফেলতে এটি OFF করুন</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showFileSize !== false}
                      onChange={(e) => setFormData({ ...formData, showFileSize: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>

                  {/* Toggle Star Rating */}
                  <label className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:border-amber-500 transition">
                    <div className="flex items-center gap-2.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          Star Rating Display
                          {formData.showRating !== false ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400">ON (প্রদর্শিত)</span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-500/10 text-rose-500">OFF (লুকানো)</span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">কার্ড থেকে ★ স্টার রেটিং (1.0 - 10.0) মুছে ফেলতে এটি OFF করুন</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showRating !== false}
                      onChange={(e) => setFormData({ ...formData, showRating: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Rating (1.0 - 10.0)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="10.0"
                      placeholder="e.g. 9.8"
                      value={formData.rating !== undefined && formData.rating !== null ? formData.rating : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, rating: val === '' ? ('' as any) : parseFloat(val) });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-500" /> File Size / Asset Size
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 16.4 GB (বা খালি রাখুন)"
                      value={formData.fileSize || ''}
                      onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> Reviews Count
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.reviewsCount !== undefined ? formData.reviewsCount : 1}
                      onChange={(e) => setFormData({ ...formData, reviewsCount: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500" /> Likes / Wishlist
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 8.3k, 12k"
                      value={formData.likesCount || ''}
                      onChange={(e) => setFormData({ ...formData, likesCount: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-emerald-500" /> "Buy" Button Label
                    </label>
                    <input
                      type="text"
                      placeholder="Default (Buy / কিনুন)"
                      value={formData.buyButtonText || ''}
                      onChange={(e) => setFormData({ ...formData, buyButtonText: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dedicated Interactive Live Demo Website Button */}
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/25 space-y-4">
                <div className="flex items-center justify-between border-b border-teal-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        Interactive Live Demo Website Button
                      </h4>
                      <span className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                        কাস্টমার ক্লিক করলে একটি নতুন ট্যাবে লাইভ ওয়েবসাইট প্রিভিউ ওপেন হবে
                      </span>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {formData.liveDemoEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.liveDemoEnabled)}
                      onChange={(e) => setFormData({ ...formData, liveDemoEnabled: e.target.checked })}
                      className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">
                      Live Demo Website URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://your-demo-website.com"
                        value={formData.liveDemoUrl || ''}
                        onChange={(e) => {
                          const url = e.target.value;
                          setFormData({
                            ...formData,
                            liveDemoUrl: url,
                            previewWebsiteUrl: url,
                            liveDemoEnabled: url.trim().length > 0 ? (formData.liveDemoEnabled ?? true) : formData.liveDemoEnabled
                          });
                        }}
                        className="flex-1 px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                      />
                      {formData.liveDemoUrl && (
                        <button
                          type="button"
                          onClick={() => window.open(formData.liveDemoUrl, '_blank', 'noopener,noreferrer')}
                          className="px-3 py-2 bg-teal-500 text-white rounded-xl text-xs font-bold hover:bg-teal-600 transition flex items-center cursor-pointer"
                          title="Test open link in new tab"
                        >
                          Test ↗
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 text-xs">
                      Custom Button Text (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Open Full Interactive Live Demo Website ↗"
                      value={formData.liveDemoButtonText || ''}
                      onChange={(e) => setFormData({ ...formData, liveDemoButtonText: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 5: Features & AI SEO Tag Generator */}
          <div className={activeTab === 'all' || activeTab === 'seo' ? 'space-y-6' : 'hidden'}>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">5</span>
                  <span>Features &amp; AI SEO Discoverability</span>
                  <span className="text-xs font-normal text-slate-400">(ফিচার ও এসইও)</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                  Step 5 of 5
                </span>
              </div>

              {/* What's inside point builder */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> 
                  <span>What's Inside This Bundle / Service Features ({((formData.bundleFeatures || formData.features) || []).length} items)</span>
                </label>
                
                <div className="space-y-2 mb-3">
                  {(formData.bundleFeatures || formData.features || []).map((feat, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <input
                        type="text"
                        value={feat}
                        onChange={(e) => {
                          const updated = [...(formData.bundleFeatures || formData.features || [])];
                          updated[index] = e.target.value;
                          setFormData({ ...formData, bundleFeatures: updated, features: updated });
                        }}
                        className="flex-1 bg-transparent border-none outline-none text-xs text-slate-900 dark:text-white font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (formData.bundleFeatures || formData.features || []).filter((_, i) => i !== index);
                          setFormData({ ...formData, bundleFeatures: updated, features: updated });
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type new bullet point and press Enter or click Add..."
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newFeatureInput.trim()) {
                          const current = formData.bundleFeatures || formData.features || [];
                          const updated = [...current, newFeatureInput.trim()];
                          setFormData({ ...formData, bundleFeatures: updated, features: updated });
                          setNewFeatureInput('');
                        }
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newFeatureInput.trim()) {
                        const current = formData.bundleFeatures || formData.features || [];
                        const updated = [...current, newFeatureInput.trim()];
                        setFormData({ ...formData, bundleFeatures: updated, features: updated });
                        setNewFeatureInput('');
                      }
                    }}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs cursor-pointer transition"
                  >
                    Add Point
                  </button>
                </div>
              </div>

              {/* Product Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                    <span>Product Full Description / বিস্তারিত বিবরণ *</span>
                  </label>
                  {formErrors.description && (
                    <span className="text-rose-500 text-[11px] font-bold">{formErrors.description}</span>
                  )}
                </div>
                <textarea
                  rows={5}
                  placeholder="Describe what is included, who it is for, and why customers should choose this product..."
                  value={formData.description || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (formErrors.description) setFormErrors(prev => ({ ...prev, description: '' }));
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white text-xs leading-relaxed focus:outline-none transition ${
                    formErrors.description ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                  }`}
                />
              </div>

              {/* 1-Click AI SEO Tag Generator */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <span>Search Tags &amp; SEO Keyword Cluster</span>
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      গুগল ও সার্চে সহজে খুঁজে পাওয়ার জন্য কি-ওয়ার্ড যোগ করুন
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (formData.title) {
                        const cluster = generateSeoKeywordCluster(formData.title, formData.category || 'Digital Assets');
                        const generatedTags = cluster.keywordsList || [];
                        setFormData({ ...formData, tags: generatedTags });
                        setTagsInput(generatedTags.join(', '));
                      }
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> 1-Click Auto SEO Tags
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="capcut, video editing, transitions, presets, viral..."
                  value={tagsInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTagsInput(val);
                    const tagsArr = val.split(',').map(t => t.trim()).filter(Boolean);
                    setFormData(prev => ({ ...prev, tags: tagsArr }));
                  }}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium text-xs"
                />

                {/* Live Pill Chips Preview */}
                {tagsInput.trim().length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tagsInput.split(',').map(t => t.trim()).filter(Boolean).map((tag, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stepper Navigation Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 sticky bottom-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-3xl shadow-xl z-20">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {activeTab !== 'all' && currentTabIndex > 0 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab(tabs[currentTabIndex - 1].id)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous: {tabs[currentTabIndex - 1].bnLabel}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs cursor-pointer text-center"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {activeTab !== 'all' && currentTabIndex < tabs.length - 1 && (
                <button
                  type="button"
                  onClick={() => setActiveTab(tabs[currentTabIndex + 1].id)}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-xs hover:opacity-90 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span>Next: {tabs[currentTabIndex + 1].bnLabel}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="flex-1 sm:flex-initial px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Product...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
