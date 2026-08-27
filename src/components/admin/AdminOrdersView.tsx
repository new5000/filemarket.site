import React, { useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Plus, 
  X, 
  Sparkles, 
  Phone, 
  Mail, 
  Package, 
  Filter,
  DollarSign,
  Trash2,
  Eye,
  Download,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  FileText,
  MessageCircle,
  Copy,
  Check,
  RotateCw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Product } from '../../types';
import { AdminOrder, updateOrderStatus, saveAdminOrder, deleteOrderAndRevokeLockerAccess } from '../../lib/adminServices';
import { deleteStorageFile } from '../../lib/storageService';

interface AdminOrdersViewProps {
  orders: AdminOrder[];
  products: Product[];
  onRefresh: () => void;
}

export const AdminOrdersView: React.FC<AdminOrdersViewProps> = ({
  orders,
  products,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<AdminOrder | null>(null);
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Manual Order Form State
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualProductId, setManualProductId] = useState(products[0]?.id || '');
  const [manualMethod, setManualMethod] = useState('bKash');
  const [manualTrxId, setManualTrxId] = useState('');

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied: ${text}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pendingCount = orders.filter(o => (o.status || 'pending').toLowerCase() === 'pending').length;
  const approvedCount = orders.filter(o => (o.status || '').toLowerCase() === 'approved').length;
  const rejectedCount = orders.filter(o => (o.status || '').toLowerCase() === 'rejected').length;

  const filteredOrders = orders.filter(o => {
    const matchesQuery = 
      (o.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.trxId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.productTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.userPhone && o.userPhone.includes(searchQuery)) ||
      (o.senderNumber && o.senderNumber.includes(searchQuery)) ||
      (o.id && o.id.toLowerCase().includes(searchQuery.toLowerCase()));

    const ordStatus = (o.status || 'pending').toLowerCase();
    const filterStatus = statusFilter.toLowerCase();
    const matchesStatus = filterStatus === 'all' || ordStatus === filterStatus;
    return matchesQuery && matchesStatus;
  });

  const handleApprove = async (order: AdminOrder) => {
    setActionLoadingId(order.id);
    try {
      await updateOrderStatus(order.id, 'Approved', products);
      
      // Storage optimization: Clean up screenshot after verification
      if (order.screenshotUrl) {
        await deleteStorageFile(order.screenshotUrl);
      }
      
      showToast(`Order ${order.id} approved & Cloud Locker access granted!`);
      if (selectedOrderDetails?.id === order.id) {
        setSelectedOrderDetails(null);
      }
    } catch (err: any) {
      showToast(`Failed to approve order: ${err?.message || 'Error'}`, 'error');
    } finally {
      setActionLoadingId(null);
      onRefresh();
    }
  };

  const handleReject = async (order: AdminOrder) => {
    setActionLoadingId(order.id);
    try {
      await updateOrderStatus(order.id, 'Rejected', products);
      
      // Clean up screenshot after rejection
      if (order.screenshotUrl) {
        await deleteStorageFile(order.screenshotUrl);
      }
      
      showToast(`Order ${order.id} marked as rejected.`, 'info');
      if (selectedOrderDetails?.id === order.id) {
        setSelectedOrderDetails(null);
      }
    } catch (err: any) {
      showToast(`Failed to reject order: ${err?.message || 'Error'}`, 'error');
    } finally {
      setActionLoadingId(null);
      onRefresh();
    }
  };

  const handleDelete = async (order: AdminOrder) => {
    if (!window.confirm(`Delete order ${order.id}? Access to "${order.productTitle}" will be revoked from the customer's Cloud Locker.`)) {
      return;
    }
    setActionLoadingId(order.id);
    try {
      if (order.screenshotUrl) {
        await deleteStorageFile(order.screenshotUrl);
      }
      await deleteOrderAndRevokeLockerAccess(order.id, {
        productId: order.productId,
        userId: order.userId,
        userEmail: order.userEmail
      });
      showToast(`Order ${order.id} deleted permanently.`);
      if (selectedOrderDetails?.id === order.id) {
        setSelectedOrderDetails(null);
      }
    } catch (err: any) {
      showToast(`Failed to delete order: ${err?.message || 'Error'}`, 'error');
    } finally {
      setActionLoadingId(null);
      onRefresh();
    }
  };

  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail || !manualProductId) return;

    const p = products.find(prod => prod.id === manualProductId) || products[0];
    const newOrder: AdminOrder = {
      id: `ORD-MANUAL-${Date.now().toString(36).toUpperCase()}`,
      userEmail: manualEmail.trim(),
      userPhone: manualPhone.trim() || 'Manual Admin Order',
      productId: p.id,
      productTitle: p.title,
      amountBDT: p.priceBDT,
      amountUSD: p.priceUSD,
      paymentMethod: manualMethod,
      trxId: manualTrxId.trim() || `ADMIN-GRANTED-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      status: 'Approved',
      createdAt: new Date().toISOString()
    };

    await saveAdminOrder(newOrder);
    await updateOrderStatus(newOrder.id, 'Approved', products);

    showToast(`Manual order issued and unlocked for ${manualEmail}`);
    setIsManualModalOpen(false);
    setManualEmail('');
    setManualPhone('');
    setManualTrxId('');
    onRefresh();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast alert */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-in slide-in-from-top duration-200 border ${
          toastMessage.type === 'success' ? 'bg-emerald-500 text-slate-950 border-emerald-400' :
          toastMessage.type === 'error' ? 'bg-rose-500 text-white border-rose-400' :
          'bg-slate-900 text-white border-slate-700'
        }`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-500" />
            Orders &amp; Payment Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Review customer bKash/Nagad/Shurjopay/SSLCommerz transaction IDs, inspect receipts, and grant Cloud Locker access
          </p>
        </div>

        <button
          onClick={() => setIsManualModalOpen(true)}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Issue Manual Order
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Email, TrxID, Phone, or Product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto shrink-0 text-xs font-bold">
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              statusFilter === 'All'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-extrabold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('Pending')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'Pending'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3" /> Pending ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('Approved')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'Approved'
                ? 'bg-emerald-500 text-slate-950 shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" /> Approved ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('Rejected')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
              statusFilter === 'Rejected'
                ? 'bg-rose-500 text-white shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <XCircle className="w-3 h-3" /> Rejected ({rejectedCount})
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Order &amp; Customer</th>
                <th className="py-3.5 px-4">Product Purchased</th>
                <th className="py-3.5 px-4">Payment &amp; TrxID</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No matching customer orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition">
                    {/* Order & Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate max-w-[180px]">{ord.userEmail}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{ord.id}</span>
                        {ord.userPhone && (
                          <span className="flex items-center gap-0.5 text-slate-500 dark:text-slate-400">
                            <Phone className="w-2.5 h-2.5" /> {ord.userPhone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 max-w-[220px]">
                        {ord.productTitle}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                        {ord.screenshotUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewScreenshotUrl(ord.screenshotUrl || null)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            <ImageIcon className="w-3 h-3" /> View Receipt
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Payment & TrxID */}
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-slate-900 dark:text-white px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
                        {ord.paymentMethod}
                      </span>
                      <div className="font-mono text-emerald-600 dark:text-emerald-400 font-black mt-1 flex items-center gap-1">
                        <span>Trx: {ord.trxId}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(ord.trxId || '', ord.id)}
                          className="text-slate-400 hover:text-emerald-500 transition"
                          title="Copy Transaction ID"
                        >
                          {copiedId === ord.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900 dark:text-white">৳{ord.amountBDT}</div>
                      <div className="text-[10px] text-slate-400">${ord.amountUSD} USD</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {(() => {
                        const s = (ord.status || 'pending').toLowerCase();
                        if (s === 'approved') {
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                            </span>
                          );
                        }
                        if (s === 'rejected') {
                          return (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                              <XCircle className="w-3.5 h-3.5" /> Rejected
                            </span>
                          );
                        }
                        return (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5 animate-spin" /> Pending
                          </span>
                        );
                      })()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      {actionLoadingId === ord.id ? (
                        <div className="text-xs text-emerald-500 font-bold animate-pulse">Updating...</div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(ord)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition cursor-pointer"
                            title="View Full Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {(ord.status || '').toLowerCase() !== 'approved' && (
                            <button
                              onClick={() => handleApprove(ord)}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs transition cursor-pointer shadow-sm flex items-center gap-1"
                              title="Approve order & grant Cloud Locker access"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}

                          {(ord.status || '').toLowerCase() !== 'rejected' && (
                            <button
                              onClick={() => handleReject(ord)}
                              className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 font-bold rounded-lg text-xs transition cursor-pointer border border-rose-500/20"
                              title="Reject invalid order"
                            >
                              Reject
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(ord)}
                            className="p-1.5 bg-slate-100 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 dark:bg-slate-800 dark:hover:bg-rose-500/20 rounded-lg transition cursor-pointer"
                            title="Delete order & revoke locker access"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Order Details */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase tracking-wider">Order Details</span>
                <h2 className="text-base font-black text-slate-900 dark:text-white font-heading">
                  {selectedOrderDetails.id}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Product Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="font-extrabold text-sm text-slate-900 dark:text-white mb-1">
                  {selectedOrderDetails.productTitle}
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-3">
                  <span>Product ID: {selectedOrderDetails.productId}</span>
                  <span>•</span>
                  <span className="font-bold text-emerald-500">৳{selectedOrderDetails.amountBDT} (${selectedOrderDetails.amountUSD} USD)</span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                  <div className="text-[10px] font-bold text-slate-400 mb-0.5">Customer Email</div>
                  <div className="font-bold text-slate-900 dark:text-white truncate">{selectedOrderDetails.userEmail}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                  <div className="text-[10px] font-bold text-slate-400 mb-0.5">Phone Number</div>
                  <div className="font-bold text-slate-900 dark:text-white">{selectedOrderDetails.userPhone || 'Not provided'}</div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Gateway:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{selectedOrderDetails.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Transaction ID / Ref:</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{selectedOrderDetails.trxId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Order Timestamp:</span>
                  <span className="text-slate-700 dark:text-slate-300">{new Date(selectedOrderDetails.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Current Status:</span>
                  <span className="font-bold capitalize">{selectedOrderDetails.status}</span>
                </div>
              </div>

              {/* Payment Receipt Image if exists */}
              {selectedOrderDetails.screenshotUrl && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Payment Receipt Screenshot</label>
                  <div 
                    onClick={() => setPreviewScreenshotUrl(selectedOrderDetails.screenshotUrl || null)}
                    className="relative rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer group bg-black/10 max-h-48 flex items-center justify-center"
                  >
                    <img 
                      src={selectedOrderDetails.screenshotUrl} 
                      alt="Receipt" 
                      className="w-full h-auto object-cover max-h-48 group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs transition">
                      Click to View Full Size
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons inside details modal */}
            <div className="flex justify-between items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleDelete(selectedOrderDetails)}
                className="px-3 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 font-bold transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>

              <div className="flex items-center gap-2">
                {(selectedOrderDetails.status || '').toLowerCase() !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedOrderDetails)}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve &amp; Unlock
                  </button>
                )}
                {(selectedOrderDetails.status || '').toLowerCase() !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => handleReject(selectedOrderDetails)}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold border border-rose-500/20 transition"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox: Screenshot Viewer */}
      {previewScreenshotUrl && (
        <div 
          onClick={() => {
            setPreviewScreenshotUrl(null);
            setRotation(0);
            setZoomLevel(1);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-5xl max-h-[95vh] w-full bg-slate-900/90 rounded-3xl p-4 border border-slate-800 shadow-2xl flex flex-col items-center cursor-default"
          >
            {/* Top Controls Bar */}
            <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.min(z + 0.25, 3))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.max(z - 0.25, 0.5))}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation(r => r + 90)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-500 font-mono ml-2">
                  {Math.round(zoomLevel * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewScreenshotUrl}
                  download="payment_receipt.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  onClick={() => {
                    setPreviewScreenshotUrl(null);
                    setRotation(0);
                    setZoomLevel(1);
                  }}
                  className="p-1.5 rounded-full bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 transition"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Container */}
            <div className="flex-1 w-full overflow-auto flex items-center justify-center p-4 min-h-[50vh]">
              <img
                src={previewScreenshotUrl}
                alt="Payment receipt proof"
                className="max-h-[75vh] w-auto rounded-xl object-contain transition-transform duration-200 origin-center"
                style={{ 
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
                }}
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="w-full flex justify-between items-center pt-3 border-t border-slate-800/80 text-xs text-slate-500">
              <span>High-resolution customer payment proof</span>
              <a
                href={previewScreenshotUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition font-bold"
              >
                Open Original <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Manual Order */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Issue Manual Customer Order
              </h2>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Customer Email *</label>
                <input
                  type="email"
                  required
                  placeholder="customer@gmail.com"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number (Optional)</label>
                <input
                  type="text"
                  placeholder="+8801700000000"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Digital Product *</label>
                <select
                  value={manualProductId}
                  onChange={(e) => setManualProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.title} (৳{p.priceBDT})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={manualMethod}
                    onChange={(e) => setManualMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Rocket">Rocket</option>
                    <option value="Shurjopay">Shurjopay</option>
                    <option value="SSLCommerz">SSLCommerz</option>
                    <option value="AamarPay">AamarPay</option>
                    <option value="Binance">Binance</option>
                    <option value="Manual Grant">Manual Grant</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Transaction ID</label>
                  <input
                    type="text"
                    placeholder="e.g. BLX89210"
                    value={manualTrxId}
                    onChange={(e) => setManualTrxId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black shadow-md transition cursor-pointer"
                >
                  Grant Locker Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
