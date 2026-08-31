import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, 
  Key, 
  Check, 
  Package, 
  ExternalLink, 
  ShieldCheck, 
  Loader2, 
  Sparkles, 
  RefreshCw, 
  Mail, 
  AlertTriangle, 
  X, 
  Clock, 
  MessageSquare,
  Search,
  CheckCircle2,
  Lock,
  ArrowRight,
  Truck,
  MapPin,
  Phone
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Currency } from '../types';
import { 
  auth, 
  db,
  getUserProfileFromFirestore, 
  PurchasedProductItem, 
  triggerEmailVerification, 
  checkFreshEmailVerifiedStatus 
} from '../lib/firebase';

interface MyProductsPageProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  onExploreStore: () => void;
}

export const MyProductsPage: React.FC<MyProductsPageProps> = ({
  isOpen,
  onClose,
  currency,
  onExploreStore,
}) => {
  const [activeTab, setActiveTab] = useState<'downloads' | 'physical' | 'pending'>('downloads');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [purchasedItems, setPurchasedItems] = useState<PurchasedProductItem[]>([]);
  const [physicalOrders, setPhysicalOrders] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(true);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [isCheckingVerify, setIsCheckingVerify] = useState<boolean>(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const getEffectiveUserId = (): string => {
    let localUser: any = null;
    const localUserStr = localStorage.getItem('filemarket_user');
    if (localUserStr) {
      try {
        localUser = JSON.parse(localUserStr);
      } catch {
        localUser = null;
      }
    }
    return auth.currentUser?.uid || localUser?.sub || localUser?.userId || localUser?.uid || localStorage.getItem('fm_user_uid') || '';
  };

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);

    let localUser: any = null;
    const localUserStr = localStorage.getItem('filemarket_user');
    if (localUserStr) {
      try {
        localUser = JSON.parse(localUserStr);
      } catch {
        localUser = null;
      }
    }

    const currentFbUser = auth.currentUser;
    const savedUid = localUser?.sub || localUser?.userId || localUser?.uid || localStorage.getItem('fm_user_uid');
    const activeUid = currentFbUser?.uid || savedUid || '';
    const isSameUser = Boolean(activeUid && savedUid === activeUid);

    const name = (isSameUser ? localUser?.name || localStorage.getItem('fm_user_name') : '') || currentFbUser?.displayName || 'Valued Customer';
    const email = (isSameUser ? localUser?.email || localStorage.getItem('fm_user_email') : '') || currentFbUser?.email || '';
    
    const verified = localUser?.emailVerified !== undefined 
      ? localUser.emailVerified 
      : (localStorage.getItem('fm_email_verified') === 'true' || auth.currentUser?.emailVerified === true);

    setUserName(name);
    setUserEmail(email);
    setIsEmailVerified(verified);

    if (!activeUid) {
      setPurchasedItems([]);
      setPendingOrders([]);
      setIsLoading(false);
      return;
    }

    let profilePurchases: PurchasedProductItem[] = [];
    let orderPurchases: PurchasedProductItem[] = [];
    let subcollectionPurchases: PurchasedProductItem[] = [];
    let pendingList: any[] = [];
    let physicalList: any[] = [];

    // Helper to merge and update state
    const syncLockerState = () => {
      const map = new Map<string, PurchasedProductItem>();
      
      // Add approved orders
      orderPurchases.forEach(item => {
        if (item && item.id) map.set(item.id, item);
      });

      // Add subcollection items
      subcollectionPurchases.forEach(item => {
        if (item && item.id && !map.has(item.id)) {
          map.set(item.id, item);
        }
      });

      // Add profile items
      profilePurchases.forEach(item => {
        if (item && item.id && !map.has(item.id)) {
          map.set(item.id, item);
        }
      });

      const finalItems = Array.from(map.values());
      setPurchasedItems(finalItems);
      setPendingOrders(pendingList);
      setPhysicalOrders(physicalList);
      setIsLoading(false);
    };

    const unsubscribers: (() => void)[] = [];

    // 1. Realtime Firestore Listener on User Profile doc
    try {
      const userDocRef = doc(db, 'users', activeUid);
      const unsubUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const uData = docSnap.data() || {};
          profilePurchases = Array.isArray(uData.purchasedProducts) ? uData.purchasedProducts : [];
        } else {
          profilePurchases = [];
        }
        syncLockerState();
      }, (err) => {
        console.warn("User profile realtime sync warning:", err);
      });
      unsubscribers.push(unsubUser);
    } catch (e) {
      console.warn("User doc listener error:", e);
    }

    // 2. Realtime Firestore Listener on Orders collection
    try {
      const ordersRef = collection(db, 'orders');
      const unsubOrders = onSnapshot(ordersRef, (snapshot) => {
        const fetchedOrders: any[] = [];
        const cleanEmail = email.toLowerCase().trim();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const ordUid = (data.userId || data.uid || data.customerId || '').trim();
          const ordEmail = (data.customerEmail || data.userEmail || data.email || '').toLowerCase().trim();

          // Match by user ID or email
          if (ordUid === activeUid || (cleanEmail && ordEmail === cleanEmail)) {
            fetchedOrders.push({ id: docSnap.id, ...data });
          }
        });

        // Filter physical orders (both pending and in-transit / delivered)
        physicalList = fetchedOrders.filter(
          (o) => o.productKind === 'physical' || Boolean(o.shippingInfo)
        );

        // Filter pending orders
        pendingList = fetchedOrders.filter(
          (o) => (o.status || '').toLowerCase() === 'pending'
        );

        // Filter approved digital orders and transform to items
        orderPurchases = fetchedOrders
          .filter((o) => (o.status || '').toLowerCase() === 'approved' && o.productKind !== 'physical')
          .map((o) => ({
            id: o.productId || o.id,
            title: o.productTitle || o.title || 'Digital Product',
            image: o.productThumbnail || o.thumbnailUrl || o.thumbnail || o.image || '',
            priceBdt: o.amount || o.amountBDT || o.priceBDT || 0,
            purchaseDate: o.approvedAt ? (typeof o.approvedAt === 'string' ? o.approvedAt : new Date(o.approvedAt).toLocaleDateString()) : (o.createdAt || 'Lifetime Access'),
            downloadUrl: o.instantDownloadLink || o.cloudDriveUrl || o.driveUrl || o.cloudAccessLink || o.driveLink || o.downloadUrl || '',
            cloudDriveUrl: o.cloudDriveUrl || o.driveUrl || o.instantDownloadLink || o.cloudAccessLink || o.driveLink,
            driveUrl: o.driveUrl || o.cloudDriveUrl || o.instantDownloadLink,
            instantDownloadLink: o.instantDownloadLink || o.cloudDriveUrl || o.driveUrl,
            productData: o.productData || o,
            licenseKey: o.licenseKey || `FM-LIFETIME-${(o.productId || o.id || 'PRO').toString().toUpperCase().slice(0, 8)}-2026`,
            category: o.category || 'Digital Asset'
          }));

        syncLockerState();
      }, (err) => {
        console.warn("Orders realtime sync error:", err);
        syncLockerState();
      });
      unsubscribers.push(unsubOrders);
    } catch (e) {
      console.warn("Orders listener error:", e);
    }

    // 3. Realtime subcollection listener on users/{activeUid}/purchases
    try {
      const purchasesSubRef = collection(db, 'users', activeUid, 'purchases');
      const unsubPurchases = onSnapshot(purchasesSubRef, (snapshot) => {
        subcollectionPurchases = snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            title: data.productTitle || data.title || 'Digital Asset',
            image: data.image || data.productThumbnail || '',
            priceBdt: data.priceBdt || 0,
            purchaseDate: data.purchaseDate || data.unlockedAt || 'Lifetime Access',
            downloadUrl: data.downloadUrl || data.cloudDriveUrl || data.driveUrl || '',
            cloudDriveUrl: data.cloudDriveUrl || data.downloadUrl || '',
            driveUrl: data.driveUrl || data.downloadUrl || '',
            instantDownloadLink: data.downloadUrl || data.driveUrl || '',
            licenseKey: data.licenseKey || `FM-LIFETIME-${d.id.slice(0, 8).toUpperCase()}-2026`,
            category: data.category || 'Digital Asset',
            productData: data
          };
        });
        syncLockerState();
      }, (err) => {
        // Subcollection may not exist or not have permissions
      });
      unsubscribers.push(unsubPurchases);
    } catch {}

    // Listen to custom locker change events for instant local refresh
    const handleLockerEvent = () => {
      syncLockerState();
    };
    window.addEventListener('filemarket:locker-change', handleLockerEvent);
    window.addEventListener('storage', handleLockerEvent);

    return () => {
      unsubscribers.forEach(unsub => unsub());
      window.removeEventListener('filemarket:locker-change', handleLockerEvent);
      window.removeEventListener('storage', handleLockerEvent);
    };
  }, [isOpen]);

  const refreshLocker = () => {
    setIsLoading(true);
    window.dispatchEvent(new CustomEvent('filemarket:locker-change'));
    setTimeout(() => setIsLoading(false), 400);
  };

  const handleResend = async () => {
    setIsResending(true);
    setVerifyNotice(null);
    try {
      const ok = await triggerEmailVerification();
      if (ok) {
        setVerifyNotice('✅ Activation link sent! Check your inbox / spam folder.');
      } else {
        setVerifyNotice('Failed to send verification email. Please try again.');
      }
    } catch (err: any) {
      setVerifyNotice(err?.message || 'Error triggering verification.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerify = async () => {
    setIsCheckingVerify(true);
    setVerifyNotice(null);
    try {
      const isNowVerified = await checkFreshEmailVerifiedStatus();
      if (isNowVerified) {
        setIsEmailVerified(true);
        let localUser: any = {};
        try {
          const uStr = localStorage.getItem('filemarket_user');
          if (uStr) localUser = JSON.parse(uStr);
        } catch {}
        localUser.emailVerified = true;
        localStorage.setItem('filemarket_user', JSON.stringify(localUser));
        window.dispatchEvent(new Event('storage'));
        setVerifyNotice('🎉 Email Verified! Full Digital Locker access unlocked.');
      } else {
        setVerifyNotice('⚠️ Not verified yet. Please click the link in your email first.');
      }
    } catch (err: any) {
      setVerifyNotice('Verification check failed.');
    } finally {
      setIsCheckingVerify(false);
    }
  };

  const handleCopyKey = (id: string, keyText: string) => {
    navigator.clipboard.writeText(keyText);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2500);
  };

  const handleDownloadAsset = async (asset: any) => {
    // Check all possible schema keys for the cloud drive link
    let targetUrl = 
      asset.cloudDriveUrl || 
      asset.driveUrl || 
      asset.cloudAccessLink || 
      asset.instantDownloadLink ||
      asset.driveLink ||
      asset.downloadUrl ||
      asset.productData?.cloudDriveUrl || 
      asset.productData?.driveUrl ||
      asset.productData?.instantDownloadLink ||
      asset.productData?.cloudAccessLink ||
      asset.productData?.driveLink;

    // If targetUrl is generic or missing, fetch the freshest link from products collection
    if (!targetUrl || targetUrl === 'https://drive.google.com' || targetUrl.trim() === '') {
      try {
        if (asset.id) {
          const productDoc = await getDoc(doc(db, 'products', asset.id));
          if (productDoc.exists()) {
            const pData = productDoc.data();
            const liveUrl = pData.instantDownloadLink || pData.cloudDriveUrl || pData.driveUrl || pData.cloudAccessLink || pData.driveLink;
            if (liveUrl && liveUrl.trim()) {
              targetUrl = liveUrl;
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch latest product doc:", err);
      }
    }

    if (!targetUrl || targetUrl.trim() === '') {
      alert('Download link is being updated by admin. Please contact WhatsApp support for instant access.');
      return;
    }

    // Ensure full URL formatting
    const formattedUrl = targetUrl.startsWith('http://') || targetUrl.startsWith('https://')
      ? targetUrl
      : `https://${targetUrl}`;

    // Open Google Drive / Cloud Locker directly in a new tab
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
  };

  // Categories for filtering
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    purchasedItems.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [purchasedItems]);

  // Filtered assets by search query and category
  const filteredAssets = useMemo(() => {
    return purchasedItems.filter((item) => {
      const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (item.title || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q) ||
        (item.licenseKey || '').toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [purchasedItems, filterCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl text-slate-900 dark:text-slate-100 overflow-y-auto overflow-x-hidden transition-colors duration-200 animate-in fade-in zoom-in-95 w-screen max-w-full box-border">
      
      {/* Main Content Container */}
      <div className="min-h-screen w-full max-w-2xl mx-auto px-3 py-4 sm:p-6 flex flex-col justify-start gap-4 box-border overflow-x-hidden">
        
        {/* Email Verification Warning Banner if not verified */}
        {!isEmailVerified && (
          <div className="p-3.5 sm:p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 shadow-sm space-y-2 box-border">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-amber-800 dark:text-amber-300">ইমেইল ভেরিফিকেশন অপেক্ষমান (Email Verification Pending)</h4>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80 mt-0.5 leading-relaxed break-words">
                  আপনার একাউন্ট <strong>{userEmail}</strong> এখনও ভেরিফাইড হয়নি। ডিজিটাল ডাউনলোড এবং লাইসেন্স কি নিরাপদে সংরক্ষণ করতে ইমেইল ভেরিফাই করুন।
                </p>
                {verifyNotice && (
                  <p className="text-[10px] font-bold text-slate-900 dark:text-white mt-1.5 p-1.5 bg-amber-500/20 rounded-xl">
                    {verifyNotice}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={handleCheckVerify}
                disabled={isCheckingVerify}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {isCheckingVerify ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                <span>যাচাই করুন (Check Status)</span>
              </button>
              <button
                onClick={handleResend}
                disabled={isResending}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/40 text-amber-800 dark:text-amber-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
              >
                <Mail className="w-3 h-3" />
                <span>Resend Email</span>
              </button>
            </div>
          </div>
        )}

        {/* Top Header Card */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm box-border space-y-3.5">
          {/* Top Row: Customer Vault Badge & Close Button */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Customer Vault
            </div>
            
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title and Subtitle */}
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
              My Purchases & Orders
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
              Manage your digital downloads & active orders{userName ? ` • Welcome, ${userName}` : ''}.
            </p>
          </div>

          {/* Compact 3-Column Tab Bar (Zero Overflow / No Cutting Off) */}
          <div className="grid grid-cols-3 gap-1.5 w-full my-2 border-t border-slate-100 dark:border-slate-800 pt-3">
            {/* Tab 1: Downloads */}
            <button
              type="button"
              onClick={() => setActiveTab('downloads')}
              className={`flex items-center justify-center gap-1 py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                activeTab === 'downloads'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Downloads</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 shrink-0 ${
                activeTab === 'downloads'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {purchasedItems.length}
              </span>
            </button>

            {/* Tab 2: Physical */}
            <button
              type="button"
              onClick={() => setActiveTab('physical')}
              className={`flex items-center justify-center gap-1 py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                activeTab === 'physical'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Physical</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 shrink-0 ${
                activeTab === 'physical'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {physicalOrders.length}
              </span>
            </button>

            {/* Tab 3: Pending */}
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`flex items-center justify-center gap-1 py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                activeTab === 'pending'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Pending</span>
              {pendingOrders.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 shrink-0 ${
                  activeTab === 'pending'
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
                }`}>
                  {pendingOrders.length}
                </span>
              )}
            </button>
          </div>

          {/* Action Row: Refresh & Explore Store */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={refreshLocker}
              disabled={isLoading}
              title="Refresh from Cloud"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-500' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onExploreStore();
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>🛍️</span>
              <span>Browse Store</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Digital Downloads */}
        {activeTab === 'downloads' && (
          <div className="w-full space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span>⚡</span> Instant Cloud Downloads ({filteredAssets.length})
              </h2>
            </div>

            {/* Search and Category Filter */}
            {purchasedItems.length > 0 && (
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

                <div className="relative flex-1 min-w-0 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    placeholder="Search downloads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-full box-border shadow-xs"
                  />
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center justify-center py-8 gap-3 text-emerald-500 text-xs font-bold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Syncing your Cloud Downloads...</span>
              </div>
            )}

            {/* Purchased Items List */}
            {!isLoading && purchasedItems.length === 0 ? (
              <div className="w-full p-6 sm:p-8 text-center bg-white dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-2.5 box-border">
                <span className="text-2xl block">📁</span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">No Digital Downloads Yet</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Purchased digital assets and files will show instant Google Drive / direct download links here.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onExploreStore();
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl text-xs transition cursor-pointer active:scale-95 shadow-sm"
                >
                  Browse Digital Assets
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
                {filteredAssets.map((item) => {
                  const isCopied = copiedKeyId === item.id;
                  const licenseKey = item.licenseKey || `FM-LIFETIME-${item.id.toUpperCase().slice(0, 8)}-2026-X8K9`;

                  return (
                    <div 
                      key={item.id} 
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-3.5 sm:p-4 space-y-3 shadow-sm box-border overflow-hidden"
                    >
                      <div className="flex items-start gap-3 w-full overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'}
                            alt={item.title}
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
                            ✓ Lifetime Download Unlocked
                          </span>
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </h3>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 break-words">
                            Status: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Cloud Synced ✓</span>
                          </p>
                        </div>
                      </div>

                      {/* Actions Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleCopyKey(item.id, licenseKey)}
                          className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                        >
                          <Key className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{isCopied ? '✓ Copied!' : 'Copy License'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadAsset(item)}
                          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm text-center cursor-pointer active:scale-95"
                        >
                          <span>⚡</span>
                          <span>Download Asset</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Physical Orders & Real-time Courier Tracking */}
        {activeTab === 'physical' && (
          <div className="w-full space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" />
                <span>Physical Orders & Shipment Tracking ({physicalOrders.length})</span>
              </h2>
            </div>

            {physicalOrders.length === 0 ? (
              <div className="w-full p-6 sm:p-8 text-center bg-white dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-2.5 box-border">
                <span className="text-2xl block">🚚</span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">No Physical Orders Yet</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  When you purchase physical goods, you can track courier status, delivery address, and tracking numbers right here.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onExploreStore();
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs transition cursor-pointer active:scale-95 shadow-sm"
                >
                  Explore Physical Store
                </button>
              </div>
            ) : (
              <div className="space-y-3 w-full">
                {physicalOrders.map((ord: any) => {
                  const status = (ord.status || 'pending').toLowerCase();
                  const shipping = ord.shippingInfo || {};
                  const waText = encodeURIComponent(
                    `Hi Admin, I'm checking the shipment status for my physical order #${ord.id || ord.trxId} ("${ord.productTitle || 'Physical Item'}").`
                  );

                  return (
                    <div
                      key={ord.id || ord.trxId}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 space-y-3 shadow-sm box-border"
                    >
                      <div className="flex items-start justify-between gap-2 flex-wrap pb-2 border-b border-slate-100 dark:border-slate-800">
                        <div>
                          <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            Order ID: <span className="font-bold text-slate-800 dark:text-slate-200">{ord.id || 'N/A'}</span>
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Placed on {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : 'Recent'}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-1.5">
                          {status === 'approved' || status === 'completed' || status === 'delivered' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Delivered</span>
                            </span>
                          ) : status === 'shipped' || status === 'in_transit' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              <span>In Transit</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Processing & Packing</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Product Preview & Quantity */}
                      <div className="flex items-start gap-3 w-full overflow-hidden">
                        {ord.productThumbnail || ord.thumbnailUrl || ord.image ? (
                          <img
                            src={ord.productThumbnail || ord.thumbnailUrl || ord.image}
                            alt=""
                            className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0">
                            📦
                          </div>
                        )}

                        <div className="space-y-1 min-w-0 flex-1 overflow-hidden">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug truncate">
                            {ord.productTitle || 'Physical Product'}
                          </h3>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
                            <span>Qty: <strong className="text-slate-800 dark:text-slate-200">{ord.quantity || 1}</strong></span>
                            {ord.selectedColor && (
                              <span>Color: <strong className="text-slate-800 dark:text-slate-200">{ord.selectedColor}</strong></span>
                            )}
                            {ord.selectedSize && (
                              <span>Size: <strong className="text-slate-800 dark:text-slate-200">{ord.selectedSize}</strong></span>
                            )}
                            <span>Total: <strong className="text-emerald-600 dark:text-emerald-400">৳{ord.amount || ord.amountBDT || 0}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Shipping Destination Card */}
                      {shipping && (shipping.fullName || shipping.address) && (
                        <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                            <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>Destination: {shipping.fullName || 'Recipient'} ({shipping.phone || 'No phone'})</span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 pl-4 text-[10px]">
                            {shipping.address}, {shipping.city} {shipping.postalCode ? `- ${shipping.postalCode}` : ''}
                          </p>
                        </div>
                      )}

                      {/* Action WhatsApp */}
                      <a
                        href={`https://wa.me/8801673833783?text=${waText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer text-center"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Track Shipment via WhatsApp</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Pending Approvals */}
        {activeTab === 'pending' && (
          <div className="w-full space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <span>⏳</span> Orders Awaiting Admin Approval ({pendingOrders.length})
              </h2>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Verifying TrxID</span>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="w-full p-6 sm:p-8 text-center bg-white dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-2.5 box-border">
                <span className="text-2xl block">✅</span>
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">No Pending Orders</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                  All your past orders have been verified and processed.
                </p>
              </div>
            ) : (
              <div className="space-y-3 w-full">
                {pendingOrders.map((ord: any) => {
                  const waText = encodeURIComponent(
                    `Hi Admin, I submitted payment for "${ord.productTitle || 'Item'}" (TrxID: ${ord.trxId || 'N/A'}). Please verify and approve.`
                  );

                  return (
                    <div
                      key={ord.id || ord.trxId}
                      className="w-full bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/30 rounded-3xl p-3.5 sm:p-4 space-y-3 shadow-sm box-border overflow-hidden"
                    >
                      <div className="flex items-start gap-3 w-full overflow-hidden">
                        {ord.productThumbnail || ord.thumbnailUrl || ord.thumbnail || ord.image ? (
                          <img 
                            src={ord.productThumbnail || ord.thumbnailUrl || ord.thumbnail || ord.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'} 
                            alt="" 
                            className="w-14 h-14 rounded-2xl object-cover border border-amber-500/20 shadow-sm shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl shrink-0">
                            📦
                          </div>
                        )}

                        <div className="space-y-1 min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              ⏳ Pending Verification
                            </span>
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{ord.paymentMethod || 'bKash'}</span>
                          </div>

                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 break-words">
                            {ord.productTitle || 'Item'}
                          </h3>

                          <p className="text-[10px] sm:text-[11px] font-mono text-slate-500 dark:text-slate-400 break-all leading-tight">
                            TrxID: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{ord.trxId || 'N/A'}</span> • Amount: <span className="font-semibold text-slate-900 dark:text-white">৳{ord.amount || ord.amountBDT || 0}</span>
                          </p>
                        </div>
                      </div>

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
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default MyProductsPage;
