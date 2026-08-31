import React, { useState, useEffect, useRef } from 'react';
import { Product, PreviewBlock, AdSizePreset } from '../../types';
import { 
  X, Save, Package, Sparkles, Zap, Video, Code, ArrowUp, ArrowDown, Trash2, Check, 
  Link as LinkIcon, Images, Plus, Upload, Loader2, Globe, Eye, EyeOff, Layout, ToggleLeft, ToggleRight
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
  categories: string[];
}

export const AdminProductEditor: React.FC<AdminProductEditorProps> = ({
  initialProduct, onSave, onCancel, categories
}) => {
  const [formData, setFormData] = useState<Partial<Product>>(() => {
    if (initialProduct) {
      return {
        ...initialProduct,
        id: String(initialProduct.id),
        title: initialProduct.title || '',
        category: initialProduct.category || 'Video Bundles',
        priceBDT: initialProduct.priceBDT !== undefined ? initialProduct.priceBDT : 499,
        priceUSD: initialProduct.priceUSD !== undefined ? initialProduct.priceUSD : 4.99,
        originalPriceBDT: initialProduct.originalPriceBDT !== undefined ? initialProduct.originalPriceBDT : (initialProduct.priceBDT ? initialProduct.priceBDT * 2 : 1000),
        thumbnail: initialProduct.thumbnail || '',
        previewImages: initialProduct.previewImages || initialProduct.gallery || [],
        gallery: initialProduct.previewImages || initialProduct.gallery || [],
        badge: initialProduct.badge || '',
        rating: initialProduct.rating || 4.9,
        reviewsCount: initialProduct.reviewsCount || 1,
        likesCount: initialProduct.likesCount || '8.3k',
        cardSubtitle: initialProduct.cardSubtitle || initialProduct.licenseTerms || initialProduct.license || 'Commercial & Personal Lifetime License',
        productKind: initialProduct.productKind || 'digital',
        stockQuantity: initialProduct.stockQuantity !== undefined ? initialProduct.stockQuantity : 50,
        sku: initialProduct.sku || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
        fileSize: initialProduct.fileSize || '420 MB',
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
      cardSubtitle: 'Commercial & Personal Lifetime License',
      productKind: 'digital',
      stockQuantity: 50,
      fileSize: '420 MB',
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

  useEffect(() => {
    if (initialProduct) {
      const safeTags = normalizeTagsArray(initialProduct.tags);
      setFormData(prev => ({
        ...prev,
        ...initialProduct,
        tags: safeTags,
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

    const payload: Partial<Product> = {
      ...formData,
      thumbnail: rawThumbnail,
      previewImages: galleryList,
      gallery: galleryList,
      bundleFeatures: activeFeatures,
      features: activeFeatures,
      tags: activeTags,
      previewVideoUrl: firstPlayerUrl,
      demoUrl: firstPlayerUrl,
      previewWebsiteUrl: effectiveDemoUrl,
      liveDemoUrl: effectiveDemoUrl,
      liveDemoEnabled: Boolean(formData.liveDemoEnabled),
      liveDemoButtonText: formData.liveDemoButtonText?.trim() || 'Open Full Interactive Live Demo Website ↗',
      enableGallery: formData.enableGallery !== false,
      enableVideo: formData.enableVideo !== false,
      previewBlocks: formData.previewBlocks || []
    };

    await onSave(payload);
    setSaving(false);
  };

  const handleAddPreviewBlock = (type: 'player' | 'ad') => {
    const current = formData.previewBlocks || [];
    const newId = `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newBlock: PreviewBlock = type === 'player'
      ? { id: newId, type: 'player', url: '', aspectRatio: '9:16', enabled: true }
      : { id: newId, type: 'ad', code: '', adSizePreset: 'responsive', title: 'Sponsored Advertisement', enabled: true };
    setFormData({
      ...formData,
      previewBlocks: [...current, newBlock]
    });
  };

  const handleRemovePreviewBlock = (index: number) => {
    const current = formData.previewBlocks || [];
    const updated = current.filter((_, idx) => idx !== index);
    setFormData({
      ...formData,
      previewBlocks: updated
    });
  };

  const handleMovePreviewBlock = (index: number, direction: 'up' | 'down') => {
    const current = [...(formData.previewBlocks || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= current.length) return;
    const temp = current[index];
    current[index] = current[targetIndex];
    current[targetIndex] = temp;
    setFormData({ ...formData, previewBlocks: current });
  };

  const handleUpdatePreviewBlock = (index: number, updates: Partial<PreviewBlock>) => {
    const current = [...(formData.previewBlocks || [])];
    current[index] = { ...current[index], ...updates };
    setFormData({ ...formData, previewBlocks: current });
  };

  const handleAddGalleryImage = (url: string) => {
    const clean = formatDirectImageUrl(url.trim());
    if (!clean) return;
    const current = formData.previewImages || formData.gallery || [];
    if (current.length >= 20) {
      alert('Maximum 20 preview images allowed.');
      return;
    }
    const updated = [...current, clean];
    setFormData({
      ...formData,
      previewImages: updated,
      gallery: updated
    });
    setNewGalleryUrlInput('');
  };

  const handleGalleryFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const current = formData.previewImages || formData.gallery || [];
    const remainingSlots = Math.max(0, 20 - current.length);
    if (remainingSlots <= 0) {
      alert('Maximum 20 preview slides allowed. Please remove some before adding more.');
      return;
    }

    const imageFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        imageFiles.push(files[i]);
      }
    }

    if (imageFiles.length === 0) return;

    const toProcess = imageFiles.slice(0, remainingSlots);
    setIsProcessingGalleryFiles(true);
    try {
      const processedUrls = await Promise.all(
        toProcess.map(f => compressImageFile(f, 850, 0.72))
      );
      const validUrls = processedUrls.filter(Boolean);
      const updated = [...current, ...validUrls];
      setFormData(prev => ({
        ...prev,
        previewImages: updated,
        gallery: updated
      }));
    } catch (err) {
      console.error('Error uploading gallery screenshots:', err);
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 overflow-y-auto animate-in fade-in duration-200">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
              <Package className="w-6 h-6 text-emerald-500" />
              {initialProduct?.id ? 'Edit Product' : 'Add New Digital Asset'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
              {initialProduct?.id ? `Target ID: ${initialProduct.id}` : `New Unique ID: ${formData.id || 'auto-generated'}`}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition shadow-sm cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          {/* Card 1: Asset Type Switcher & Basic Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              1. Asset Type & Basic Info
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, productKind: 'digital' })}
                className={`p-4 rounded-2xl border-2 font-bold flex flex-col items-center gap-2 transition text-center cursor-pointer ${
                  !isPhysical
                    ? 'bg-emerald-500/5 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span className="text-2xl">⚡</span>
                <span className="text-sm">Digital File / Bundle</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, productKind: 'physical' })}
                className={`p-4 rounded-2xl border-2 font-bold flex flex-col items-center gap-2 transition text-center cursor-pointer ${
                  isPhysical
                    ? 'bg-cyan-500/5 border-cyan-500 text-cyan-700 dark:text-cyan-400'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                <span className="text-2xl">📦</span>
                <span className="text-sm">Physical Product</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder={isPhysical ? 'e.g. Creator Tech Heavyweight Hoodie' : 'e.g. CapCut Pro Viral Transition Template Bundle'}
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Category *</label>
                  <select
                    value={formData.category || 'Video Bundles'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. 🔥 Best Seller"
                    value={formData.badge || ''}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Card Subtitle / License Badge</label>
                <input
                  type="text"
                  placeholder="e.g. Commercial & Personal Lifetime License"
                  value={formData.cardSubtitle || ''}
                  onChange={(e) => setFormData({ ...formData, cardSubtitle: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Cover Thumbnail, Watch Preview Gallery & Tab Visibility Toggles */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">
                2. Visual Artwork & Preview Controls
              </h3>
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
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Show or hide video walkthrough tab</span>
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
            </div>

            {/* Thumbnail Upload with Local File Upload and Direct URL support */}
            <ImageUploadField
              label="Thumbnail / Cover Artwork Image *"
              value={formData.thumbnail || ''}
              onChange={(url) => setFormData({ ...formData, thumbnail: url })}
              placeholder="https://images.unsplash.com/..."
              folder="products"
              helpText="Upload a high quality square or landscape product cover artwork (Max 2MB)."
            />

            {/* Watch Preview Gallery Slides Manager */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                    <Images className="w-4 h-4 text-cyan-500" />
                    <span>Watch Preview Gallery Slides ({formData.previewImages?.length || 0}/20)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Upload screenshots or paste direct URLs for the interactive carousel.
                  </p>
                </div>
                {(formData.previewImages?.length || 0) > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllGalleryImages}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Multi-File Image Uploader */}
              <div>
                <input
                  ref={galleryFileInputRef}
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={(e) => handleGalleryFilesSelected(e.target.files)}
                  className="hidden"
                  id="gallery-multi-upload-input"
                />
                <button
                  type="button"
                  onClick={() => galleryFileInputRef.current?.click()}
                  disabled={isProcessingGalleryFiles || (formData.previewImages?.length || 0) >= 20}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-cyan-500/40 hover:border-cyan-500 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isProcessingGalleryFiles ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                      <span>Compressing &amp; Adding Gallery Slides...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-cyan-500" />
                      <span>Upload Gallery Screenshots (Select Multiple Images)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Gallery Grid Preview */}
              {(formData.previewImages && formData.previewImages.length > 0) && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {formData.previewImages.map((imgUrl, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-xs">
                        <img
                          src={imgUrl}
                          alt={`Gallery slide ${idx + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/75 rounded text-[9px] font-bold text-white leading-none">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg opacity-90 sm:opacity-0 group-hover:opacity-100 transition cursor-pointer shadow-sm"
                          title="Remove slide"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Gallery Image URL */}
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Or paste direct image URL (https://...)"
                  value={newGalleryUrlInput}
                  onChange={(e) => setNewGalleryUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddGalleryImage(newGalleryUrlInput);
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddGalleryImage(newGalleryUrlInput)}
                  disabled={!newGalleryUrlInput.trim() || (formData.previewImages?.length || 0) >= 20}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl disabled:opacity-40 transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add URL
                </button>
              </div>
            </div>

            {/* Cloud Download Link */}
            {!isPhysical ? (
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-emerald-500" /> Cloud Download Link (Google Drive, Dropbox) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={formData.instantDownloadLink || ''}
                  onChange={(e) => setFormData({ ...formData, instantDownloadLink: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            ) : (
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center gap-3 text-cyan-800 dark:text-cyan-200">
                <Package className="w-5 h-5 text-cyan-500 shrink-0" />
                <span className="font-semibold text-sm">Physical item selected: Download link is disabled. Shipment logic applies.</span>
              </div>
            )}
            
            {!isPhysical && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">File Format</label>
                  <input
                    type="text"
                    placeholder="e.g. APK / ZIP / MP4"
                    value={formData.fileFormat || formData.softwareFormat || ''}
                    onChange={(e) => setFormData({ ...formData, fileFormat: e.target.value, softwareFormat: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">File Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 15 GB"
                    value={formData.fileSize || ''}
                    onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
            {isPhysical && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Available Stock</label>
                  <input
                    type="number"
                    value={formData.stockQuantity !== undefined ? formData.stockQuantity : 50}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">SKU / Barcode</label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Dedicated Live Demo Website Link Control Block */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-500" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  3. Interactive Live Demo Website Button
                </h3>
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

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Live Demo Website URL
                </label>
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
                      // Automatically enable toggle if user enters a valid URL and it was previously false
                      liveDemoEnabled: url.trim().length > 0 ? (formData.liveDemoEnabled ?? true) : formData.liveDemoEnabled
                    });
                  }}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:border-teal-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  When enabled, this custom URL opens in a new tab from the "Watch Preview" modal.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Custom Button Text (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Open Full Interactive Live Demo Website ↗"
                  value={formData.liveDemoButtonText || ''}
                  onChange={(e) => setFormData({ ...formData, liveDemoButtonText: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Card 4: Dual Pricing + What's Inside point builder */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              4. Pricing & Features
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Sale Price (BDT) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                  <input
                    type="number"
                    required
                    value={formData.priceBDT || ''}
                    onChange={(e) => setFormData({ ...formData, priceBDT: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-black text-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Original Price (BDT)</label>
                <input
                  type="number"
                  value={formData.originalPriceBDT || ''}
                  onChange={(e) => setFormData({ ...formData, originalPriceBDT: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 line-through text-slate-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Auto-Synced USD ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.priceUSD || ''}
                    onChange={(e) => setFormData({ ...formData, priceUSD: Number(e.target.value) })}
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold text-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> What's Inside This Bundle
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
                      className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (formData.bundleFeatures || formData.features || []).filter((_, i) => i !== index);
                        setFormData({ ...formData, bundleFeatures: updated, features: updated });
                      }}
                      className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type new bullet point..."
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
                  className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:border-emerald-500"
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
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Product Description *</label>
              <textarea
                rows={5}
                required
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Card 5: Interactive Video Previews & Advanced Ad Blocks */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <AdminVideoAdManager
              previewBlocks={formData.previewBlocks || []}
              onChange={(updatedBlocks) => setFormData({ ...formData, previewBlocks: updatedBlocks })}
              enableVideo={formData.enableVideo !== false}
              onToggleEnableVideo={(enabled) => setFormData({ ...formData, enableVideo: enabled })}
            />
          </div>

          {/* Card 6: Built-in 1-Click AI SEO Tag Generator */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">
                6. SEO &amp; Discoverability
              </h3>
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
                className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> 1-Click Auto SEO Tags
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Search Tags (Comma separated)
              </label>
              <input
                type="text"
                placeholder="capcut, video editing, transitions, presets, viral"
                value={tagsInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setTagsInput(val);
                  const tagsArr = val.split(',').map(t => t.trim()).filter(Boolean);
                  setFormData(prev => ({ ...prev, tags: tagsArr }));
                }}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 sticky bottom-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl shadow-xl z-20">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Asset...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
