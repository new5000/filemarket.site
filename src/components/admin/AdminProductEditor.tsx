import React, { useState, useEffect, useRef } from 'react';
import { Product, PreviewBlock } from '../../types';
import { 
  X, Save, Package, Sparkles, Zap, Video, Code, ArrowUp, ArrowDown, Trash2, Check, Link as LinkIcon, Images, Plus, Upload, Loader2
} from 'lucide-react';
import { ImageUploadField } from './ImageUploadField';
import { formatDirectImageUrl } from '../../utils/formatImageUrl';
import { generateSeoKeywordCluster } from '../../utils/seoKeywordGenerator';

/**
 * Pure client-side canvas compression for local gallery image uploads (no AI/API dependency)
 */
async function compressImageFile(file: File, maxDimension = 1280, quality = 0.80): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(e.target?.result as string || '');
        }
      };
      img.onerror = () => resolve(e.target?.result as string || '');
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

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
        previewBlocks: initialProduct.previewBlocks && initialProduct.previewBlocks.length > 0 
          ? initialProduct.previewBlocks 
          : [{ id: 'b1', type: 'player', url: initialProduct.previewVideoUrl || '', aspectRatio: '9:16', enabled: true }],
        description: initialProduct.description || '',
        features: initialProduct.bundleFeatures || initialProduct.features || ['Instant Direct Google Drive Delivery', 'Commercial Usage License Included', '24/7 Lifetime Support'],
        bundleFeatures: initialProduct.bundleFeatures || initialProduct.features || ['Instant Direct Google Drive Delivery', 'Commercial Usage License Included', '24/7 Lifetime Support'],
        tags: initialProduct.tags || []
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
      previewBlocks: [{ id: 'b1', type: 'player', url: '', aspectRatio: '9:16', enabled: true }],
      description: '',
      features: ['Instant Google Drive Direct Download', 'Commercial & Personal Usage License Included', 'Lifetime Access & Free Updates'],
      bundleFeatures: ['Instant Google Drive Direct Download', 'Commercial & Personal Usage License Included', 'Lifetime Access & Free Updates'],
      tags: []
    };
  });
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [newGalleryUrlInput, setNewGalleryUrlInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [isProcessingGalleryFiles, setIsProcessingGalleryFiles] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialProduct) {
      setFormData(initialProduct);
    }
  }, [initialProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  const handleAddPreviewBlock = (type: 'player' | 'ad') => {
    const current = formData.previewBlocks || [];
    const newId = `b_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newBlock: PreviewBlock = type === 'player'
      ? { id: newId, type: 'player', url: '', aspectRatio: '9:16', enabled: true }
      : { id: newId, type: 'ad', code: '', enabled: true };
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
        toProcess.map(f => compressImageFile(f, 1280, 0.80))
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
            className="p-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition shadow-sm"
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
                className={`p-4 rounded-2xl border-2 font-bold flex flex-col items-center gap-2 transition text-center ${
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
                className={`p-4 rounded-2xl border-2 font-bold flex flex-col items-center gap-2 transition text-center ${
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
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
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

          {/* Card 2: Media, Cover & Cloud Download Link */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              2. Media & Delivery
            </h3>
            
            <ImageUploadField
              label="Product Cover Artwork (Upload or URL) *"
              value={formData.thumbnail || ''}
              onChange={(url) => setFormData({ ...formData, thumbnail: formatDirectImageUrl(url) })}
              placeholder="https://..."
              folder="products"
              aspectRatio="square"
              helpText="Upload a high-res cover image (PNG, JPG, WEBP)."
            />

            {/* Watch Preview Gallery Images Manager (Up to 20 images) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5">
                      <Images className="w-4 h-4 text-cyan-500" /> Watch Preview Gallery Images ({formData.previewImages?.length || 0}/20)
                    </label>
                    {formData.previewImages && formData.previewImages.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllGalleryImages}
                        className="text-[10px] font-bold text-rose-500 hover:text-rose-600 underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    These slides appear inside the customer "Watch Preview" modal &amp; carousel (up to 20 slides).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={galleryFileInputRef}
                    onChange={(e) => handleGalleryFilesSelected(e.target.files)}
                    multiple
                    accept="image/*"
                    className="hidden"
                    disabled={isProcessingGalleryFiles || (formData.previewImages?.length || 0) >= 20}
                  />
                  <button
                    type="button"
                    onClick={() => galleryFileInputRef.current?.click()}
                    disabled={isProcessingGalleryFiles || (formData.previewImages?.length || 0) >= 20}
                    className="px-3 py-1.5 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessingGalleryFiles ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Upload Images ({formData.previewImages?.length || 0}/20)</span>
                  </button>
                </div>
              </div>

              {/* Gallery Image Grid */}
              {formData.previewImages && formData.previewImages.length > 0 && (
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                    {formData.previewImages.map((imgUrl, idx) => (
                      <div key={idx} className="group relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <img 
                          src={imgUrl} 
                          alt={`Preview ${idx + 1}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const fallbackImages = [
                              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
                              'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
                            ];
                            (e.target as HTMLImageElement).src = fallbackImages[idx % fallbackImages.length];
                          }}
                        />
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 backdrop-blur-xs text-[9px] font-bold text-white rounded">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg opacity-90 group-hover:opacity-100 transition shadow-sm cursor-pointer"
                          title="Remove image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

          {/* Card 3: Dual Pricing + What's Inside point builder */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              3. Pricing & Features
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
                      className="text-slate-400 hover:text-rose-500 p-1"
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
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl"
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

          {/* Card 4: Interactive Video Previews & HTML Ads */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">
                4. Video Previews & Ad Blocks
              </h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => handleAddPreviewBlock('player')} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1">
                  <Video className="w-3.5 h-3.5" /> + Video
                </button>
                <button type="button" onClick={() => handleAddPreviewBlock('ad')} className="px-3 py-1.5 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-lg text-xs font-bold flex items-center gap-1">
                  <Code className="w-3.5 h-3.5" /> + Ad Block
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {(formData.previewBlocks || []).map((block, index) => (
                <div key={block.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
                  <div className="flex flex-col gap-1 mt-1">
                    <button type="button" onClick={() => handleMovePreviewBlock(index, 'up')} disabled={index === 0} className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                    <button type="button" onClick={() => handleMovePreviewBlock(index, 'down')} disabled={index === (formData.previewBlocks || []).length - 1} className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        {block.type === 'player' ? <Video className="w-4 h-4 text-emerald-500" /> : <Code className="w-4 h-4 text-amber-500" />}
                        {block.type === 'player' ? `Video Player #${index + 1}` : `Ad Block #${index + 1}`}
                      </span>
                      <button type="button" onClick={() => handleRemovePreviewBlock(index)} className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 p-1.5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                    </div>

                    {block.type === 'player' ? (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <ImageUploadField
                            label="Video URL / Upload MP4"
                            value={block.url || ''}
                            onChange={(url) => handleUpdatePreviewBlock(index, { url })}
                            acceptVideo={true}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Aspect Ratio</label>
                          <select value={block.aspectRatio || '9:16'} onChange={(e) => handleUpdatePreviewBlock(index, { aspectRatio: e.target.value as '16:9' | '9:16' })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 text-sm">
                            <option value="9:16">Portrait (9:16)</option>
                            <option value="16:9">Landscape (16:9)</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <textarea
                        rows={3}
                        value={block.code || ''}
                        onChange={(e) => handleUpdatePreviewBlock(index, { code: e.target.value })}
                        placeholder="<!-- Raw HTML / JS Ad Code -->"
                        className="w-full p-3 font-mono text-xs border rounded-lg bg-white dark:bg-slate-900"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 5: Built-in 1-Click AI SEO Tag Generator */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">
                5. SEO & Discoverability
              </h3>
              <button
                type="button"
                onClick={() => {
                  const cluster = generateSeoKeywordCluster(
                    formData.title || '', 
                    formData.category || 'Video Bundles', 
                    formData.description
                  );
                  setFormData({ 
                    ...formData, 
                    tags: cluster.keywordsList,
                    keywords: cluster.keywordsList,
                    seoKeywords: cluster.keywordsString
                  });
                }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:opacity-90 shadow-md"
              >
                <Sparkles className="w-4 h-4" /> AI Tag Generator
              </button>
            </div>
            
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">Search Tags / Keywords</label>
              <textarea
                rows={3}
                value={(formData.tags || []).join(', ')}
                onChange={(e) => {
                  const t = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  setFormData({ ...formData, tags: t, keywords: t, seoKeywords: e.target.value });
                }}
                placeholder="Comma separated tags..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="sticky bottom-0 pt-4 pb-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 z-10">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              <Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
