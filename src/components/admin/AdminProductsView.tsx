import { formatDirectImageUrl } from '../../utils/formatImageUrl';
import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Star, 
  Flame, 
  X, 
  Check, 
  Download, 
  Key, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  DollarSign, 
  Sparkles,
  Tag,
  Copy,
  CheckCheck,
  Zap,
  ArrowUp,
  ArrowDown,
  Video,
  Code,
  PlusCircle,
  Layers,
  Filter
} from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, cleanFirestoreData } from '../../lib/firebase';
import { Product, PreviewBlock } from '../../types';
import { CATEGORIES } from '../../data/products';
import { saveAdminProduct, deleteAdminProduct } from '../../lib/adminServices';
import { generateSeoKeywordCluster } from '../../utils/seoKeywordGenerator';
import { useGlobalSettings } from '../../context/GlobalSettingsContext';
import { useProducts } from '../../context/ProductContext';
import { AdminProductEditor } from './AdminProductEditor';

interface AdminProductsViewProps {
  products: Product[];
  onRefresh: () => void;
  isAddModalOpen?: boolean;
  setIsAddModalOpen?: (open: boolean) => void;
}

export const AdminProductsView: React.FC<AdminProductsViewProps> = ({
  products,
  onRefresh,
  isAddModalOpen: externalIsAddModalOpen,
  setIsAddModalOpen: externalSetIsAddModalOpen
}) => {
  const { globalConfig } = useGlobalSettings();
  const { deleteProduct: contextDeleteProduct, saveProduct: contextSaveProduct } = useProducts();
  const cmsCategories = globalConfig?.categories || [];
  let dynamicCategories = cmsCategories.length > 0 
    ? cmsCategories.map(c => typeof c === 'string' ? c : c.name) 
    : [...CATEGORIES];
  
  dynamicCategories = dynamicCategories.filter(c => c !== 'All Products');
  if (!dynamicCategories.includes('Digital Services')) {
    dynamicCategories.unshift('Digital Services');
  }

  const [localProductsList, setLocalProductsList] = useState<Product[]>(products);

  useEffect(() => {
    setLocalProductsList(products);
  }, [products]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [kindFilter, setKindFilter] = useState<'all' | 'digital' | 'physical'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleDuplicateProduct = async (sourceProduct: Product) => {
    const newId = generateUniqueProductId(localProductsList);
    const clonedProduct: Product = {
      ...sourceProduct,
      id: newId,
      title: `${sourceProduct.title} (Copy)`,
      downloadsCount: 0
    };
    setLocalProductsList(prev => [clonedProduct, ...prev]);
    await saveAdminProduct(clonedProduct);
    showToast(`Product cloned successfully as "${clonedProduct.title}" (ID: ${newId})`);
    onRefresh();
  };

  // Helper to generate guaranteed unique product ID that never collides with existing items
  const generateUniqueProductId = (list: Product[]) => {
    const existingIds = new Set(list.map(p => String(p.id).toLowerCase()));
    let counter = Math.max(list.length + 1, 1);
    let candidate = `fm-${counter.toString().padStart(3, '0')}`;
    while (existingIds.has(candidate.toLowerCase())) {
      counter++;
      candidate = `fm-${counter.toString().padStart(3, '0')}`;
    }
    return candidate;
  };

  // Form State
  const [formData, setFormData] = useState<Partial<Product>>({
    title: '',
    category: 'Video Bundles',
    productKind: 'digital',
    priceBDT: 499,
    priceUSD: 4.99,
    originalPriceBDT: 1500,
    thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    badge: '🔥 Best Seller',
    rating: 4.9,
    reviewsCount: 10,
    likesCount: '8.3k',
    fileSize: '15 GB (Google Drive)',
    fileFormat: 'ZIP / MP4 / PSD',
    license: 'Commercial & Personal Lifetime License',
    instantDownloadLink: '',
    stockQuantity: 50,
    sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000),
    shippingCostBDT: 60,
    shippingCostUSD: 2,
    estimatedDeliveryDays: '2-4 business days',
    variants: {
      colors: [],
      sizes: []
    },
    previewVideoUrl: '',
    previewWebsiteUrl: '',
    previewPlayers: [
      { id: 1, enabled: true, url: '', aspectRatio: '9:16' },
      { id: 2, enabled: false, url: '', aspectRatio: '16:9' },
      { id: 3, enabled: false, url: '', aspectRatio: '16:9' }
    ],
    previewBlocks: [
      { id: 'b1', type: 'player', url: '', aspectRatio: '9:16', enabled: true }
    ],
    description: '',
    features: ['Instant Direct Google Drive Delivery', 'Commercial Usage License Included', '24/7 Lifetime Support'],
    downloadsCount: 0
  });

  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [newFeatureInput, setNewFeatureInput] = useState('');

  // Dynamic Repeater Helpers for Preview Blocks
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
    setFormData({
      ...formData,
      previewBlocks: current
    });
  };

  const handleUpdatePreviewBlock = (index: number, updates: Partial<PreviewBlock>) => {
    const current = [...(formData.previewBlocks || [])];
    current[index] = { ...current[index], ...updates };
    setFormData({
      ...formData,
      previewBlocks: current
    });
  };

  const filteredProducts = localProductsList.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesKind = kindFilter === 'all' || 
                        (kindFilter === 'physical' && p.productKind === 'physical') ||
                        (kindFilter === 'digital' && p.productKind !== 'physical');
    return matchesSearch && matchesCat && matchesKind;
  });

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    if (externalSetIsAddModalOpen) {
      externalSetIsAddModalOpen(false);
    }
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  // Sync external add modal trigger (from dashboard)
  useEffect(() => {
    if (externalIsAddModalOpen) {
      handleOpenAdd();
      if (externalSetIsAddModalOpen) {
        externalSetIsAddModalOpen(false);
      }
    }
  }, [externalIsAddModalOpen, externalSetIsAddModalOpen]);

  const handleSaveProduct = async (formData: Partial<Product>) => {
    if (!formData.title || !formData.priceBDT) {
      showToast('Please fill in product title and price.', 'error');
      return;
    }

    const isEditing = Boolean(editingProduct && editingProduct.id);

    let targetId = isEditing 
      ? String(editingProduct!.id)
      : (formData.id || '').trim();

    // If this is a NEW product (not editing existing), ensure targetId is fresh and does NOT collide with existing products
    if (!isEditing) {
      const existingIds = new Set(localProductsList.map(p => String(p.id).toLowerCase()));
      if (!targetId || existingIds.has(targetId.toLowerCase())) {
        targetId = generateUniqueProductId(localProductsList);
      }
    }

    const activeBundleFeatures = (formData.bundleFeatures && formData.bundleFeatures.length > 0)
      ? formData.bundleFeatures
      : (Array.isArray(formData.features) && formData.features.length > 0 ? formData.features : ['Instant Google Drive Direct Download']);

    const savedBlocks = formData.previewBlocks || [];
    const playerBlocks = savedBlocks.filter(b => b.type === 'player');
    const firstPlayerUrl = playerBlocks.find(b => b.url && b.url.trim().length > 0)?.url || formData.previewVideoUrl || '';

    const isPhysical = formData.productKind === 'physical';
    const rawProductToSave: Product = {
      id: targetId,
      title: formData.title.trim(),
      category: (formData.category as any) || 'Video Bundles',
      productKind: formData.productKind || 'digital',
      priceBDT: Number(formData.priceBDT),
      priceUSD: Number(formData.priceUSD) || Number((Number(formData.priceBDT) / 100).toFixed(2)),
      originalPriceBDT: Number(formData.originalPriceBDT) || Number(formData.priceBDT) * 2,
      thumbnail: formData.thumbnail || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
      badge: formData.badge || '',
      rating: Number(formData.rating) || 4.9,
      reviewsCount: Number(formData.reviewsCount) || 12,
      likesCount: formData.likesCount || '8.3k',
      cardSubtitle: formData.cardSubtitle || formData.licenseTerms || (isPhysical ? 'Official Authentic Product' : 'Commercial & Personal Lifetime License'),
      bundleFeatures: activeBundleFeatures,
      fileSize: formData.fileSize || '420 MB',
      fileFormat: formData.softwareFormat || formData.fileFormat || 'APK / DNG Presets',
      softwareFormat: formData.softwareFormat || formData.fileFormat || 'APK / DNG Presets',
      license: formData.licenseTerms || formData.license || 'Lifetime VIP Access',
      licenseTerms: formData.licenseTerms || formData.license || 'Lifetime VIP Access',
      instantDownloadLink: isPhysical ? (formData.instantDownloadLink || 'physical-shipment') : (formData.instantDownloadLink || ''),
      previewVideoUrl: firstPlayerUrl,
      demoUrl: firstPlayerUrl,
      previewWebsiteUrl: formData.previewWebsiteUrl || '',
      previewPlayers: playerBlocks.map((pl, idx) => ({
        id: idx + 1,
        enabled: pl.enabled !== false,
        url: pl.url || '',
        aspectRatio: pl.aspectRatio || '16:9'
      })),
      previewBlocks: savedBlocks,
      description: formData.description ? formData.description.trim() : '',
      features: activeBundleFeatures,
      downloadsCount: Number(formData.downloadsCount) || 0,
      updatedDate: formData.releaseDate || formData.updatedDate || 'August 2026',
      releaseDate: formData.releaseDate || formData.updatedDate || 'August 2026',
      tags: formData.tags || [],
      ...(isPhysical ? {
        stockQuantity: Number(formData.stockQuantity) || 0,
        sku: formData.sku || 'SKU-' + targetId,
        shippingCostBDT: Number(formData.shippingCostBDT) || 0,
        shippingCostUSD: Number(formData.shippingCostUSD) || 0,
        estimatedDeliveryDays: formData.estimatedDeliveryDays || '2-4 business days',
        variants: formData.variants || { colors: [], sizes: [] }
      } : {})
    };

    const productToSave = cleanFirestoreData(rawProductToSave);

    await saveAdminProduct(productToSave);
    try {
      await contextSaveProduct(productToSave);
    } catch {}

    // Update local product list immediately
    setLocalProductsList(prev => {
      if (isEditing) {
        return prev.map(p => String(p.id) === String(productToSave.id) ? productToSave : p);
      } else {
        return [productToSave, ...prev.filter(p => String(p.id) !== String(productToSave.id))];
      }
    });

    handleCloseModal();
    showToast(isEditing ? `Product "${productToSave.title}" updated!` : `New product "${productToSave.title}" created successfully!`);
    onRefresh();
  };

  const handleDeleteProduct = (product: Product | string) => {
    const targetProduct = typeof product === 'object' 
      ? product 
      : localProductsList.find(p => p.id === product) || { id: product, title: product };
    
    setProductToDelete(targetProduct as Product);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);

    const targetId = String(productToDelete.id);
    const targetTitle = productToDelete.title || targetId;

    try {
      // 1. Optimistic UI update in admin view
      setLocalProductsList((prevList) => prevList.filter((item) => String(item.id) !== targetId));

      // 2. Clear from Global Storefront Context (instantly removes from Home, ProductGrid, Search, Modal)
      try {
        await contextDeleteProduct(targetId);
      } catch (ctxErr) {
        console.warn('Context delete error:', ctxErr);
      }

      // 3. Clear from Firestore and Local Admin Cache
      await deleteAdminProduct(targetId);

      const cachedProducts = JSON.parse(localStorage.getItem('fm_products') || '[]');
      const updatedCache = cachedProducts.filter((item: any) => String(item.id) !== targetId);
      localStorage.setItem('fm_products', JSON.stringify(updatedCache));

      showToast(`"${targetTitle}" deleted permanently.`);
      setProductToDelete(null);
      onRefresh();
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      // Fallback local cleanup even if offline/firestore error
      setLocalProductsList((prevList) => prevList.filter((item) => String(item.id) !== targetId));
      await deleteAdminProduct(targetId);
      showToast(`Product removed locally: ${error?.message || 'Done'}`, 'info');
      setProductToDelete(null);
      onRefresh();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleBadge = async (p: Product) => {
    const newBadge = p.badge ? '' : '🔥 Best Seller';
    setLocalProductsList(prev => prev.map(item => item.id === p.id ? { ...item, badge: newBadge } : item));
    await saveAdminProduct({ ...p, badge: newBadge });
    showToast(newBadge ? `Badge set to "${newBadge}" for ${p.title}` : `Badge removed for ${p.title}`);
    onRefresh();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-500" />
            Product Catalog Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Add, update, manage prices, and set Google Drive download links
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 hover:opacity-95 text-white font-black text-xs shadow-lg shadow-purple-600/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> ✨ AI Quick Import
          </button>
          <button
            onClick={handleOpenAdd}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search products by title or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 text-xs font-bold">
          <button
            type="button"
            onClick={() => setKindFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              kindFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Items
          </button>
          <button
            type="button"
            onClick={() => setKindFilter('digital')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              kindFilter === 'digital'
                ? 'bg-emerald-500 text-slate-950 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ⚡ Digital
          </button>
          <button
            type="button"
            onClick={() => setKindFilter('physical')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              kindFilter === 'physical'
                ? 'bg-cyan-500 text-slate-950 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            📦 Physical
          </button>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition cursor-pointer"
        >
          <option value="All">All Categories ({products.length})</option>
          {dynamicCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Product Info</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price (BDT / USD)</th>
                <th className="py-3.5 px-4">Badge / Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                  {/* Thumbnail & Title */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'}
                        alt={p.title}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100"
                      />
                      <div className="min-w-0">
                        <div className="font-extrabold text-slate-900 dark:text-white line-clamp-1">{p.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                          <span>ID: {p.id}</span>
                          <span>•</span>
                          {p.productKind === 'physical' ? (
                            <span className="text-cyan-600 dark:text-cyan-400 font-bold">📦 Physical (Stock: {p.stockQuantity ?? 0})</span>
                          ) : (
                            <span>⚡ Digital ({p.fileSize || 'Direct'})</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 font-semibold text-slate-600 dark:text-slate-300">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                      {p.category}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4">
                    <div className="font-black text-slate-900 dark:text-white">৳{p.priceBDT}</div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">${p.priceUSD} USD</div>
                  </td>

                  {/* Badge */}
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleBadge(p)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition cursor-pointer flex items-center gap-1 ${
                        p.badge 
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                      title="Click to toggle Best Seller badge"
                    >
                      <Flame className="w-3 h-3" />
                      {p.badge || 'No Badge'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={p.instantDownloadLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition"
                        title="Open Drive Link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDuplicateProduct(p)}
                        className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white transition cursor-pointer"
                        title="Duplicate / Clone Product"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p)}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Product */}
      {isModalOpen && (
        <AdminProductEditor
          initialProduct={editingProduct}
          onSave={handleSaveProduct}
          onCancel={handleCloseModal}
          categories={dynamicCategories}
        />
      )}

      {/* In-App Delete Confirmation Modal (Iframe-Safe & Non-blocking) */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5 text-rose-500">
                <div className="p-2 rounded-xl bg-rose-500/10">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white font-heading">
                  Delete Digital Asset
                </h3>
              </div>
              <button
                onClick={() => setProductToDelete(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <img
                src={productToDelete.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'}
                alt={productToDelete.title}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                  {productToDelete.title}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  ID: {productToDelete.id} • ৳{productToDelete.priceBDT}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete this product? This action will remove it from the catalog and Firestore database immediately.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating In-App Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl border border-slate-700/50 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
};
