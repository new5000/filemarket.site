import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Percent, 
  DollarSign, 
  Calendar, 
  ShieldCheck, 
  AlertCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { Coupon } from '../../types';
import { 
  subscribeCoupons, 
  saveCoupon, 
  deleteCoupon, 
  DEFAULT_COUPONS 
} from '../../lib/couponService';

interface AdminCouponsViewProps {
  onRefresh?: () => void;
}

export const AdminCouponsView: React.FC<AdminCouponsViewProps> = () => {
  const [coupons, setCoupons] = useState<Coupon[]>(DEFAULT_COUPONS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: '',
    discountType: 'percent',
    discountValue: 20,
    minOrderBDT: 200,
    minOrderUSD: 2,
    maxUses: 500,
    usedCount: 0,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    enabled: true,
    description: ''
  });

  useEffect(() => {
    const unsub = subscribeCoupons((list) => {
      setCoupons(list);
    });
    return () => unsub();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      discountType: 'percent',
      discountValue: 20,
      minOrderBDT: 200,
      minOrderUSD: 2,
      maxUses: 500,
      usedCount: 0,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      enabled: true,
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({ ...coupon });
    setIsModalOpen(true);
  };

  const handleDelete = async (couponId: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await deleteCoupon(couponId);
      showToast('Coupon removed successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete coupon.', 'error');
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const updated = { ...coupon, enabled: !coupon.enabled };
      await saveCoupon(updated);
      showToast(`Coupon ${updated.code} is now ${updated.enabled ? 'Active' : 'Disabled'}.`);
    } catch (err: any) {
      showToast('Failed to update status.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code?.trim()) {
      showToast('Please enter a coupon code.', 'error');
      return;
    }

    try {
      const codeUpper = formData.code.trim().toUpperCase();
      const newCoupon: Coupon = {
        id: editingCoupon ? editingCoupon.id : codeUpper,
        code: codeUpper,
        discountType: formData.discountType || 'percent',
        discountValue: Number(formData.discountValue) || 10,
        minOrderBDT: Number(formData.minOrderBDT) || 0,
        minOrderUSD: Number(formData.minOrderUSD) || 0,
        maxUses: Number(formData.maxUses) || 1000,
        usedCount: Number(formData.usedCount) || 0,
        expiryDate: formData.expiryDate || '2028-12-31',
        enabled: formData.enabled !== undefined ? formData.enabled : true,
        description: formData.description || ''
      };

      await saveCoupon(newCoupon);
      setIsModalOpen(false);
      showToast(`Coupon "${newCoupon.code}" saved successfully!`);
    } catch (err: any) {
      showToast(err.message || 'Failed to save coupon.', 'error');
    }
  };

  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);
  const activeCount = coupons.filter((c) => c.enabled).length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs sm:text-sm font-bold ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50' 
            : 'bg-rose-950/90 text-rose-300 border-rose-500/50'
        }`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-white flex items-center gap-2.5">
            <Tag className="w-6 h-6 text-emerald-500" />
            <span>Discount Coupons &amp; Deals Engine</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create storewide promotional coupons, flash deal discounts, and track redemption statistics.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Total Coupons</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{coupons.length}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center border border-teal-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Active Deals</span>
            <span className="text-xl font-black text-teal-600 dark:text-teal-400">{activeCount}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center border border-cyan-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium">Total Redemptions</span>
            <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">{totalRedemptions.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">Active &amp; Scheduled Coupons</h3>
          <span className="text-xs text-slate-400">{coupons.length} coupons configured</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Coupon Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                        {coupon.code}
                      </span>
                    </div>
                    {coupon.description && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 max-w-xs">{coupon.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-bold">
                    {coupon.discountType === 'percent' ? (
                      <span className="text-emerald-600 dark:text-emerald-400">{coupon.discountValue}% OFF</span>
                    ) : (
                      <span className="text-cyan-600 dark:text-cyan-400">৳{coupon.discountValue} Flat</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    ৳{coupon.minOrderBDT || 0} / ${coupon.minOrderUSD || 0}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="font-medium">{coupon.usedCount || 0}</span>
                    <span className="text-slate-400"> / {coupon.maxUses || '∞'}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                    {coupon.expiryDate || 'No Expiry'}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                        coupon.enabled 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {coupon.enabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      <span>{coupon.enabled ? 'Active' : 'Disabled'}</span>
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-1">
                    <button
                      onClick={() => handleOpenEdit(coupon)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Edit Coupon"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Delete Coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-heading font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-500" />
                <span>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Coupon Code (e.g. WELCOME50)
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="MEGA50"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white uppercase font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percent' | 'fixed' })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (BDT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Discount Value {formData.discountType === 'percent' ? '(%)' : '(৳)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === 'percent' ? 100 : 100000}
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Min Order (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderBDT}
                    onChange={(e) => setFormData({ ...formData, minOrderBDT: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Max Redemptions
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Terms (Optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Special 50% discount for all products"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="couponEnabled"
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="couponEnabled" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Enable coupon for checkout immediately
                </label>
              </div>

              <div className="pt-3 flex gap-2 justify-end border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
