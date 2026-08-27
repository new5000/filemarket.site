import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query, orderBy, addDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Edit3, Trash2, CheckCircle2, AlertTriangle, Eye, EyeOff, Sparkles, RefreshCcw, GripVertical } from 'lucide-react';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  categoryBadge: string;
  orderIndex: number;
  isActive: boolean;
  updatedAt: string;
}

const DEFAULT_FAQS = [
  {
    question: "How does instant delivery work?",
    answer: "Once your payment (bKash/Nagad) is verified, our system instantly grants you view & download access via a secure Google Drive link attached directly to your FileMarket account.",
    categoryBadge: "⚡ Delivery & Access",
    orderIndex: 0,
    isActive: true
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept local mobile banking options including **bKash**, **Nagad**, and **Rocket**. For international or crypto payments, we accept **Binance Pay (USDT)**.",
    categoryBadge: "💳 Payment & Crypto",
    orderIndex: 1,
    isActive: true
  },
  {
    question: "Do I get a commercial license for digital assets?",
    answer: "Yes, all source codes, templates, and graphics come with a standard commercial license allowing you to use them in personal and client projects. Reselling the raw files directly is strictly prohibited.",
    categoryBadge: "🔒 Security & License",
    orderIndex: 2,
    isActive: true
  },
  {
    question: "How do I claim a refund?",
    answer: "If you face critical bugs or the file does not match its description, you can claim a refund within 3 days. Send your Transaction ID and proof of issue to our support WhatsApp.",
    categoryBadge: "💸 Refunds",
    orderIndex: 3,
    isActive: true
  }
];

export const AdminFAQManager: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [categoryBadge, setCategoryBadge] = useState('⚡ Delivery & Access');
  const [orderIndex, setOrderIndex] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'faqs'), orderBy('orderIndex', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched: FAQItem[] = [];
      snapshot.forEach(doc => {
        fetched.push({ id: doc.id, ...doc.data() } as FAQItem);
      });
      setFaqs(fetched);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openAddModal = () => {
    setEditingId(null);
    setQuestion('');
    setAnswer('');
    setCategoryBadge('⚡ Delivery & Access');
    setOrderIndex(faqs.length);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (faq: FAQItem) => {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategoryBadge(faq.categoryBadge);
    setOrderIndex(faq.orderIndex);
    setIsActive(faq.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        question: question.trim(),
        answer: answer.trim(),
        categoryBadge: categoryBadge.trim(),
        orderIndex: Number(orderIndex),
        isActive,
        updatedAt: new Date().toISOString()
      };

      if (editingId) {
        await setDoc(doc(db, 'faqs', editingId), payload, { merge: true });
        showToast('success', 'FAQ updated successfully');
      } else {
        await addDoc(collection(db, 'faqs'), payload);
        showToast('success', 'New FAQ added successfully');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save FAQ", err);
      showToast('error', 'Failed to save FAQ. Check permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      await deleteDoc(doc(db, 'faqs', id));
      showToast('success', 'FAQ deleted successfully');
    } catch (err) {
      console.error("Failed to delete FAQ", err);
      showToast('error', 'Failed to delete FAQ');
    }
  };

  const handleToggleActive = async (faq: FAQItem) => {
    try {
      await setDoc(doc(db, 'faqs', faq.id), { isActive: !faq.isActive, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err) {
      console.error("Failed to toggle FAQ active state", err);
      showToast('error', 'Failed to update visibility');
    }
  };

  const loadDefaultFAQs = async () => {
    if (faqs.length > 0) {
      if (!window.confirm("You already have FAQs. Loading defaults will add them alongside existing ones. Continue?")) return;
    }
    setSaving(true);
    try {
      let currentIndex = faqs.length;
      for (const faq of DEFAULT_FAQS) {
        await addDoc(collection(db, 'faqs'), {
          ...faq,
          orderIndex: currentIndex++,
          updatedAt: new Date().toISOString()
        });
      }
      showToast('success', 'Default FAQs loaded successfully');
    } catch (err) {
      console.error("Failed to load default FAQs", err);
      showToast('error', 'Failed to load defaults');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in duration-300 relative">
      {/* Toast */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 ${
          toastMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {toastMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-500" />
            FAQ & Knowledge Base
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your store's frequently asked questions dynamically
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadDefaultFAQs}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 transition"
          >
            <RefreshCcw className="w-4 h-4" /> Load Defaults
          </button>
          <button
            onClick={openAddModal}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" /> Add FAQ
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-10 text-center text-sm font-semibold text-slate-500">Loading FAQs...</div>
        ) : faqs.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-4">No FAQs found. Add your first question or load defaults.</p>
            <button onClick={loadDefaultFAQs} className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm">
              Load Default FAQs
            </button>
          </div>
        ) : (
          faqs.map((faq) => (
            <div key={faq.id} className={`p-4 rounded-xl border transition-colors ${faq.isActive ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800/50 opacity-75'}`}>
              <div className="flex items-start gap-4">
                <div className="mt-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {faq.categoryBadge}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">Order: {faq.orderIndex}</span>
                    {!faq.isActive && <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">Hidden</span>}
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-1 leading-snug">{faq.question}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{faq.answer}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleToggleActive(faq)} title={faq.isActive ? 'Hide on site' : 'Show on site'} className={`p-2 rounded-lg transition-colors ${faq.isActive ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300' : 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500'}`}>
                    {faq.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => openEditModal(faq)} className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(faq.id)} className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              {editingId ? 'Edit FAQ' : 'Add New FAQ'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Question</label>
                  <input
                    type="text"
                    required
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="e.g. How do I download my file?"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Answer (Supports basic markdown logic if desired)</label>
                  <textarea
                    required
                    rows={4}
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="Provide a clear, detailed answer..."
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category Badge</label>
                  <input
                    type="text"
                    required
                    value={categoryBadge}
                    onChange={e => setCategoryBadge(e.target.value)}
                    placeholder="e.g. ⚡ Delivery & Access"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Sort Order (0 = First)</label>
                  <input
                    type="number"
                    required
                    value={orderIndex}
                    onChange={e => setOrderIndex(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="col-span-2 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                      className="w-5 h-5 accent-emerald-500"
                    />
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">Active (Visible)</div>
                      <div className="text-xs text-slate-500">Show this FAQ on the public website</div>
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-emerald-500 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20">
                  {saving ? 'Saving...' : 'Save FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
