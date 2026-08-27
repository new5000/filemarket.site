import { formatDirectImageUrl } from '../utils/formatImageUrl';
import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { 
  ShieldCheck, 
  Clock, 
  Package, 
  Sparkles, 
  ExternalLink, 
  Download, 
  Key, 
  Check, 
  MessageSquare, 
  Search, 
  RefreshCw, 
  ArrowLeft,
  X,
  Lock,
  Layers,
  AlertCircle
} from 'lucide-react';
import { auth, db, getUserProfileFromFirestore } from '../lib/firebase';
import { navigateTo } from '../router';

export interface MyDownloadsProps {
  onClose?: () => void;
  onExploreMore?: () => void;
}

export default function MyDownloads({ onClose, onExploreMore }: MyDownloadsProps) {
  const [currentUser, setCurrentUser] = useState<any>(() => auth.currentUser);
  const [orders, setOrders] = useState<any[]>([]);
  const [profileAssets, setProfileAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync current user from Firebase auth & local session
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        let localUser: any = null;
        try {
          const str = localStorage.getItem('filemarket_user');
          if (str) localUser = JSON.parse(str);
        } catch {}
        if (localUser && (localUser.uid || localUser.userId || localUser.sub)) {
          setCurrentUser({
            uid: localUser.uid || localUser.userId || localUser.sub,
            displayName: localUser.name || localUser.displayName || 'Valued User',
            email: localUser.email || ''
          });
        } else {
          setCurrentUser(null);
        }
      }
    });

    return () => unsub();
  }, []);

  const effectiveUid = currentUser?.uid || '';

  // 1. Real-time query strictly bound to currentUser.uid and user document
  useEffect(() => {
    if (!effectiveUid) {
      setOrders([]);
      setProfileAssets([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribers: (() => void)[] = [];

    // Realtime listener for User Profile purchasedProducts
    try {
      const userRef = doc(db, 'users', effectiveUid);
      const unsubUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const uData = docSnap.data() || {};
          setProfileAssets(Array.isArray(uData.purchasedProducts) ? uData.purchasedProducts : []);
        } else {
          setProfileAssets([]);
        }
      }, (err) => {
        console.warn("User profile realtime sync warning in MyDownloads:", err);
      });
      unsubscribers.push(unsubUser);
    } catch (e) {
      console.warn("User doc listener error in MyDownloads:", e);
    }

    // Realtime listener for Orders
    try {
      const q = query(
        collection(db, 'orders'),
        where('userId', '==', effectiveUid)
      );

      const unsubOrders = onSnapshot(q, (snapshot) => {
        const fetchedOrders = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setOrders(fetchedOrders);
        setLoading(false);
      }, (error) => {
        console.error('Error fetching purchased assets in MyDownloads:', error);
        setLoading(false);
      });
      unsubscribers.push(unsubOrders);
    } catch (e) {
      console.warn("Orders listener error in MyDownloads:", e);
      setLoading(false);
    }

    // Listen for custom locker events
    const handleLockerEvent = () => {
      getUserProfileFromFirestore(effectiveUid).then(profile => {
        if (profile && Array.isArray(profile.purchasedProducts)) {
          setProfileAssets(profile.purchasedProducts);
        } else {
          setProfileAssets([]);
        }
      }).catch(() => {});
    };
    window.addEventListener('filemarket:locker-change', handleLockerEvent);
    window.addEventListener('storage', handleLockerEvent);

    return () => {
      unsubscribers.forEach(unsub => unsub());
      window.removeEventListener('filemarket:locker-change', handleLockerEvent);
      window.removeEventListener('storage', handleLockerEvent);
    };
  }, [effectiveUid]);

  const handleManualRefresh = async () => {
    if (!effectiveUid) return;
    setIsRefreshing(true);
    try {
      const profile = await getUserProfileFromFirestore(effectiveUid);
      if (profile && Array.isArray(profile.purchasedProducts)) {
        setProfileAssets(profile.purchasedProducts);
      }
    } catch (e) {
      console.warn("Manual refresh failed:", e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Split orders into pending and approved
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => (o.status || '').toLowerCase() === 'pending');
  }, [orders]);

  const approvedOrders = useMemo(() => {
    const fromOrders = orders
      .filter((o) => (o.status || '').toLowerCase() === 'approved')
      .map(o => ({
        id: o.productId || o.id,
        orderId: o.id,
        productTitle: o.productTitle || o.title || 'Digital Asset',
        category: o.category || 'Digital Asset',
        productThumbnail: o.productThumbnail || o.thumbnailUrl || o.thumbnail || o.image || '',
        downloadUrl: o.downloadUrl || o.driveLink || o.instantDownloadLink || 'https://drive.google.com',
        licenseKey: o.licenseKey || `FM-LIFETIME-${(o.productId || o.id || 'PRO').toString().toUpperCase().slice(0, 8)}-2026`,
        approvedAt: o.approvedAt || o.updatedAt || o.createdAt,
        priceBDT: o.amount || o.amountBDT || o.priceBDT
      }));

    // Merge profile assets to prevent duplicates
    const map = new Map<string, any>();
    fromOrders.forEach(item => map.set(item.id, item));

    profileAssets.forEach(p => {
      if (!map.has(p.id)) {
        map.set(p.id, {
          id: p.id,
          orderId: p.id,
          productTitle: p.title || 'Digital Asset',
          category: p.category || 'Digital Asset',
          productThumbnail: p.image || '',
          downloadUrl: p.downloadUrl || 'https://drive.google.com',
          licenseKey: p.licenseKey || `FM-LIFETIME-${p.id.toUpperCase().slice(0, 8)}-2026`,
          approvedAt: p.purchaseDate || 'Lifetime Active',
          priceBDT: p.priceBdt || 0
        });
      }
    });

    return Array.from(map.values());
  }, [orders, profileAssets]);

  // Extract unique categories for filtering
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    approvedOrders.forEach(a => {
      if (a.category) set.add(a.category);
    });
    return ['All', ...Array.from(set)];
  }, [approvedOrders]);

  // Filtered approved assets by search and category
  const filteredAssets = useMemo(() => {
    return approvedOrders.filter((item) => {
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (item.productTitle || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.licenseKey || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [approvedOrders, filterCategory, searchQuery]);

  const handleCopyLicense = (licenseKey: string, id: string) => {
    if (!licenseKey) return;
    navigator.clipboard.writeText(licenseKey);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleExplore = () => {
    if (onExploreMore) {
      onExploreMore();
    } else if (onClose) {
      onClose();
    } else {
      navigateTo('/', { title: 'FileMarket — Digital Assets Marketplace' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full max-w-full overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-3">Loading your assets...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="w-full max-w-2xl mx-auto px-3 py-4 sm:p-6 space-y-4 box-border">
        
        {/* Top Header Card */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Firebase Cloud Locker • 100% Lifetime Access
            </div>
            
            <div className="pr-2">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                My Purchased Assets <span className="text-emerald-500">({approvedOrders.length})</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                Welcome <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser?.displayName || 'User'}</span>! All assets are securely synced.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                title="Refresh locker"
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs transition border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleExplore}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
              >
                <span>🛍️</span> Explore More Products
              </button>
            </div>
          </div>
        </div>

        {/* Guest Warning */}
        {!effectiveUid && (
          <div className="w-full p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-start gap-2.5 box-border">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <p className="text-xs leading-relaxed">
              You are currently browsing as guest. Log in to your registered account to access your permanent lifetime cloud downloads.
            </p>
          </div>
        )}

        {/* Section 1: Orders Awaiting Admin Approval */}
        {pendingOrders.length > 0 && (
          <div className="w-full space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span>⏳</span> Orders Awaiting Approval ({pendingOrders.length})
              </h2>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Verifying TrxID</span>
            </div>

            <div className="space-y-3 w-full">
              {pendingOrders.map((order) => {
                const waText = encodeURIComponent(
                  `Hi Admin, I submitted payment for "${order.productTitle || 'Digital Asset'}" (TrxID: ${order.trxId || 'N/A'}). Please verify and approve.`
                );

                return (
                  <div 
                    key={order.id} 
                    className="w-full bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/30 rounded-3xl p-3.5 sm:p-4 space-y-3 shadow-sm box-border overflow-hidden"
                  >
                    <div className="flex items-start gap-3 w-full overflow-hidden">
                      {/* Thumbnail */}
                      {order.productThumbnail || order.thumbnailUrl || order.thumbnail || order.image ? (
                        <img 
                          src={formatDirectImageUrl(order.productThumbnail || order.thumbnailUrl || order.thumbnail || order.image) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'} 
                          alt="" 
                          className="w-14 h-14 rounded-2xl object-cover border border-amber-500/20 shadow-sm shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl shrink-0">
                          📦
                        </div>
                      )}

                      {/* Content (Constrained & Truncated) */}
                      <div className="space-y-1 min-w-0 flex-1 overflow-hidden">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            ⏳ Pending Verification
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{order.paymentMethod || 'bKash'}</span>
                        </div>

                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 break-words">
                          {order.productTitle || 'Digital Asset'}
                        </h3>

                        <p className="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400 break-all leading-tight">
                          TrxID: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{order.trxId || 'N/A'}</span> • Amount: <span className="font-semibold text-slate-900 dark:text-white">৳{order.amount || order.amountBDT || 0}</span>
                        </p>
                      </div>
                    </div>

                    {/* WhatsApp Fast-Track Button */}
                    <a
                      href={`https://wa.me/8801673833783?text=${waText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm text-center cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>Fast-Track Approval via WhatsApp</span>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Unlocked Cloud Vault */}
        <div className="w-full space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>⚡</span> Unlocked Cloud Vault ({approvedOrders.length})
            </h2>
          </div>

          {/* Search bar inside vault if items exist */}
          {approvedOrders.length > 0 && (
            <div className="flex items-center gap-2 w-full flex-wrap sm:flex-nowrap">
              {categoriesList.length > 2 && (
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer shrink-0"
                >
                  {categoriesList.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              )}

              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text"
                  placeholder="Search assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-full box-border"
                />
              </div>
            </div>
          )}

          {approvedOrders.length === 0 ? (
            <div className="w-full p-6 sm:p-8 text-center bg-white dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-2.5 box-border">
              <span className="text-2xl block">📦</span>
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">No Unlocked Assets Yet</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                Once pending orders are verified by Admin, download links and keys appear here automatically.
              </p>
              <button
                type="button"
                onClick={handleExplore}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs transition cursor-pointer active:scale-95"
              >
                Browse Catalog
              </button>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="p-6 text-center bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-1.5">
              <p className="text-xs text-slate-500 dark:text-slate-400">No assets match &quot;{searchQuery}&quot;</p>
              <button
                onClick={() => { setSearchQuery(''); setFilterCategory('All'); }}
                className="text-xs font-bold text-emerald-500 hover:underline cursor-pointer"
              >
                Clear search filter
              </button>
            </div>
          ) : (
            <div className="space-y-3 w-full">
              {filteredAssets.map((asset) => (
                <div 
                  key={asset.id} 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3.5 sm:p-4 space-y-3 shadow-sm box-border overflow-hidden"
                >
                  <div className="flex items-start gap-3 w-full overflow-hidden">
                    {asset.productThumbnail ? (
                      <img 
                        src={formatDirectImageUrl(asset.productThumbnail) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'} 
                        alt="" 
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0">
                        🎁
                      </div>
                    )}

                    <div className="space-y-1 min-w-0 flex-1 overflow-hidden">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        ✓ Active Lifetime
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {asset.productTitle}
                      </h3>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 break-words">
                        Status: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Cloud Synced ✓</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyLicense(asset.licenseKey || 'FM-LIFETIME-PRO-KEY', asset.id)}
                      className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5 text-emerald-500" />
                      {copiedId === asset.id ? '✓ Copied!' : 'Copy License'}
                    </button>

                    <a
                      href={asset.downloadUrl || asset.driveLink || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm text-center cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Asset</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
