import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Users, 
  Package, 
  CheckCircle2, 
  XCircle, 
  MessageCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  ArrowUpRight, 
  RefreshCw, 
  CreditCard, 
  Plus, 
  ExternalLink,
  Search,
  Check,
  Send,
  Sliders,
  BarChart3,
  Calendar,
  Layers,
  Percent,
  Radio,
  Activity,
  ShoppingBag,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { Product } from '../../types';
import { AdminOrder, updateOrderStatus, fetchAllProducts } from '../../lib/adminServices';
import { deleteStorageFile } from '../../lib/storageService';

interface AdminDashboardOverviewProps {
  products?: Product[];
  orders?: AdminOrder[];
  users?: any[];
  onNavigateTab?: (tab: 'products' | 'orders' | 'users' | 'settings') => void;
  onOpenAddProduct?: () => void;
  onRefresh?: () => void;
}

export default function AdminDashboardOverview({
  products: initialProducts = [],
  orders: initialOrders = [],
  users: initialUsers = [],
  onNavigateTab,
  onOpenAddProduct,
  onRefresh
}: AdminDashboardOverviewProps) {
  // Real-time Firestore state
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [usersCount, setUsersCount] = useState<number>(initialUsers.length || 0);
  const [lastResetAt, setLastResetAt] = useState<string | null>(null);
  const [activeVisitorsCount, setActiveVisitorsCount] = useState<number>(1);
  const [rawVisitors, setRawVisitors] = useState<{ id: string; lastActive: number; path?: string }[]>([]);
  const [globalConfig, setGlobalConfig] = useState<{ maintenance?: boolean; maintenanceMode?: boolean; notice?: string; [key: string]: any }>({
    maintenance: false,
    maintenanceMode: false,
    notice: ''
  });

  const [noticeInput, setNoticeInput] = useState<string>('');
  const [noticeSaving, setNoticeSaving] = useState<boolean>(false);
  const [noticeSuccess, setNoticeSuccess] = useState<boolean>(false);
  const [maintenanceToggling, setMaintenanceToggling] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Reset Analytics Modal & State
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [confirmInput, setConfirmInput] = useState<string>('');
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string>('');
  const [resetOptions, setResetOptions] = useState({
    clearOrders: true,
    resetGateways: true,
    clearVisitors: true
  });

  // Lightbox Zoom Modal State
  const [lightboxData, setLightboxData] = useState<{
    url: string;
    order: AdminOrder;
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  const openLightbox = (order: AdminOrder) => {
    if (!order.screenshotUrl) return;
    setZoomLevel(1);
    setRotation(0);
    setLightboxData({ url: order.screenshotUrl, order });
  };

  const closeLightbox = () => {
    setLightboxData(null);
    setZoomLevel(1);
    setRotation(0);
  };

  const handleResetOverviewOnly = async () => {
    if (confirmInput.trim() !== 'RESET STATS') {
      setResetError('Please type "RESET STATS" to confirm.');
      return;
    }

    setIsResetting(true);
    setResetError('');

    try {
      const statsDocRef = doc(db, 'system_stats', 'overview');

      // 1. Reset ONLY visual metrics and store the reset checkpoint
      await setDoc(statsDocRef, {
        totalRevenueBDT: 0,
        totalRevenueUSD: 0,
        completedOrdersDisplayCount: 0,
        todayRevenueBDT: 0,
        todaySalesCount: 0,
        gatewayBreakdown: {
          bKash: { count: 0, totalBDT: 0 },
          Nagad: { count: 0, totalBDT: 0 },
          Binance: { count: 0, totalBDT: 0 },
          Card: { count: 0, totalBDT: 0 }
        },
        lastResetAt: new Date().toISOString() // All previous user purchases remain valid & lifetime active
      }, { merge: true });

      setShowResetModal(false);
      setConfirmInput('');
      setFeedbackMessage({
        type: 'success',
        text: 'Admin overview metrics reset to ৳0. All customer files & licenses remain safe!'
      });
      setTimeout(() => setFeedbackMessage(null), 5000);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Failed to reset overview stats:', err);
      setResetError('Failed to reset. Check Firestore permissions.');
    } finally {
      setIsResetting(false);
    }
  };
  
  // Pending queue search & filter
  const [pendingSearch, setPendingSearch] = useState<string>('');
  const [chartViewMode, setChartViewMode] = useState<'bar' | 'line'>('bar');
  const [loading, setLoading] = useState<boolean>(initialOrders.length === 0);

  // 1. Real-time Firestore Listeners
  useEffect(() => {
    // 1. Orders onSnapshot with robust status/amount normalization
    const ordersRef = collection(db, 'orders');
    const ordersUnsub = onSnapshot(ordersRef, (snapshot) => {
      const liveOrders: AdminOrder[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const rawAmount = String(data.amount || data.amountBDT || data.priceBDT || data.price || 0).replace(/[^0-9.]/g, '');
        const parsedAmount = parseFloat(rawAmount) || 0;
        const parsedUSD = Number(data.amountUSD || Math.round(parsedAmount / 120) || 0);

        const rawStatus = (data.status || data.orderStatus || data.statusDisplay || 'pending').toLowerCase();
        const normalizedStatus = (rawStatus === 'approved' || rawStatus === 'completed' || rawStatus === 'success')
          ? 'approved'
          : (rawStatus === 'rejected' || rawStatus === 'declined' || rawStatus === 'cancelled')
            ? 'rejected'
            : 'pending';

        return {
          id: docSnap.id,
          userId: data.userId || '',
          userEmail: data.userEmail || data.email || 'customer@filemarket.site',
          userPhone: data.userPhone || data.senderNumber || '',
          senderNumber: data.senderNumber || data.userPhone || '',
          productId: data.productId || '',
          productTitle: data.productTitle || 'Digital Asset',
          productThumbnail: data.productThumbnail || '',
          category: data.category || 'Digital Assets',
          amount: parsedAmount,
          amountBDT: parsedAmount,
          amountUSD: parsedUSD,
          paymentMethod: data.paymentMethod || data.gateway || 'bKash',
          trxId: data.trxId || '',
          screenshotUrl: data.screenshotUrl || null,
          status: normalizedStatus,
          statusDisplay: data.statusDisplay || (normalizedStatus === 'approved' ? 'Approved' : normalizedStatus === 'rejected' ? 'Rejected' : 'Pending'),
          createdAt: data.createdAt || new Date().toISOString(),
          approvedAt: data.approvedAt || null,
          rejectedAt: data.rejectedAt || null,
          notes: data.notes || ''
        } as AdminOrder;
      });

      // Sort newest first
      liveOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setOrders(liveOrders);
      setLoading(false);
    }, (err) => {
      console.warn("Real-time orders sync note:", err);
      setLoading(false);
    });

    // 2. Users onSnapshot
    const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsersCount(snapshot.size);
    }, (err) => {
      console.warn("Real-time users count sync note:", err);
    });

    // 3. Products onSnapshot
    const productsUnsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      if (!snapshot.empty) {
        const liveProducts = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
        setProducts(liveProducts);
      }
    }, (err) => {
      console.warn("Real-time products sync note:", err);
    });

    // 4. Global Settings & Broadcast Notice onSnapshot
    const configUnsub = onSnapshot(doc(db, 'settings', 'global_config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const maintenanceFlag = Boolean(
          data.maintenance || 
          data.maintenanceMode || 
          data.footerAndBadges?.maintenanceMode || 
          false
        );
        setGlobalConfig({
          ...data,
          maintenance: maintenanceFlag,
          maintenanceMode: maintenanceFlag,
          notice: data.notice || data.branding?.announcement || ''
        });
        setNoticeInput(data.notice || data.branding?.announcement || '');
      }
    }, (err) => {
      console.warn("Real-time global_config sync note:", err);
    });

    // 5. Active Presence onSnapshot (Real-time Live Presence Engine)
    const presenceUnsub = onSnapshot(collection(db, 'active_presence'), (snapshot) => {
      const now = Date.now();
      const list: { id: string; lastActive: number; path?: string }[] = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const lastSeen = Number(data.lastSeen || data.lastActive) || 0;
        // Count documents updated within the last 35 seconds (sliding window)
        if (now - lastSeen <= 35000) {
          list.push({
            id: docSnap.id,
            lastActive: lastSeen,
            path: data.url || data.path || '/'
          });
        }
      });
      setRawVisitors(list);
      // Display exact active visitor count (minimum 1 for active admin session)
      setActiveVisitorsCount(Math.max(1, list.length));
    }, (err) => {
      console.warn("Real-time active presence sync note:", err);
    });

    // N. Stats Listener
    const overviewRef = doc(db, 'system_stats', 'overview');
    const overviewUnsub = onSnapshot(overviewRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.lastResetAt) {
          setLastResetAt(data.lastResetAt);
        }
      }
    });

    return () => {
      ordersUnsub();
      usersUnsub();
      productsUnsub();
      configUnsub();
      presenceUnsub();
      overviewUnsub();
    };
  }, []);

  // Periodic active visitors decay check (ensures stale visitors drop off in real-time within 35s window)
  useEffect(() => {
    const filterStale = () => {
      const now = Date.now();
      const fresh = rawVisitors.filter(v => now - v.lastActive <= 35000);
      setActiveVisitorsCount(Math.max(1, fresh.length));
    };

    const interval = setInterval(filterStale, 2500);
    return () => clearInterval(interval);
  }, [rawVisitors]);

  // Sync initial products if fetched from parent
  useEffect(() => {
    if (initialProducts.length > 0 && products.length === 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  // Derived KPI Calculations
  const {
    totalRevenueBDT,
    totalRevenueUSD,
    todaySalesBDT,
    todayApprovedCount,
    last7DaysSalesBDT,
    pendingOrders,
    approvedOrders,
    rejectedOrders,
    chartData,
    paymentBreakdown,
    topGateway,
    completedOrdersDisplayCount
  } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    // 7 days date strings
    const past7Days: { dateStr: string; label: string; dayName: string; totalBDT: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      past7Days.push({ dateStr, label, dayName, totalBDT: 0, count: 0 });
    }

    const resetTime = lastResetAt ? new Date(lastResetAt).getTime() : 0;
    let completedOrdersDisplayCount = 0;

    let revBDT = 0;
    let revUSD = 0;
    let todayBDT = 0;
    let todayApproved = 0;
    let sevenDaysBDT = 0;

    const pending: AdminOrder[] = [];
    const approved: AdminOrder[] = [];
    const rejected: AdminOrder[] = [];
    
    const gatewayMap: Record<string, { count: number; totalBDT: number; color: string; badgeClass: string }> = {
      bKash: { count: 0, totalBDT: 0, color: '#E2136E', badgeClass: 'bg-pink-500/10 text-pink-500 border-pink-500/20' },
      Nagad: { count: 0, totalBDT: 0, color: '#F7941D', badgeClass: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
      Binance: { count: 0, totalBDT: 0, color: '#F3BA2F', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      Card: { count: 0, totalBDT: 0, color: '#3B82F6', badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      Other: { count: 0, totalBDT: 0, color: '#10B981', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' }
    };

    orders.forEach((ord) => {
      const statusLower = (ord.status || 'pending').toLowerCase();
      const isApproved = statusLower === 'approved' || statusLower === 'completed' || statusLower === 'success';

      const amountBDT = Number(ord.amountBDT || ord.amount || 0) || 0;
      const amountUSD = Number(ord.amountUSD || Math.round(amountBDT / 120)) || 0;
      
      const createdDate = new Date(ord.createdAt || 0);
      const createdTime = createdDate.getTime();
      const isValidDate = !isNaN(createdTime);
      const isToday = isValidDate && createdDate.toDateString() === todayStr;
      const dateIsoStr = isValidDate ? createdDate.toISOString().split('T')[0] : '';

      if (isApproved) {
        approved.push(ord);

        if (createdTime >= resetTime) {
          revBDT += amountBDT;
          revUSD += amountUSD;
          completedOrdersDisplayCount += 1;

          // Calculate Today's Approved Metrics
          if (isToday) {
            todayBDT += amountBDT;
            todayApproved += 1;
          }

          // Categorize payment gateway strictly from APPROVED orders
          const rawMethod = (ord.paymentMethod || 'bKash').trim();
          let methodKey = 'Other';
          if (/bkash/i.test(rawMethod)) methodKey = 'bKash';
          else if (/nagad/i.test(rawMethod)) methodKey = 'Nagad';
          else if (/binance|crypto|usdt/i.test(rawMethod)) methodKey = 'Binance';
          else if (/card|visa|master/i.test(rawMethod)) methodKey = 'Card';

          if (gatewayMap[methodKey]) {
            gatewayMap[methodKey].count += 1;
            gatewayMap[methodKey].totalBDT += amountBDT;
          }

          // 7-Day Trend Matching
          const dayItem = past7Days.find(d => d.dateStr === dateIsoStr);
          if (dayItem) {
            dayItem.totalBDT += amountBDT;
            dayItem.count += 1;
            sevenDaysBDT += amountBDT;
          }
        }
      } else if (statusLower === 'pending') {
        pending.push(ord);
      } else if (statusLower === 'rejected' || statusLower === 'declined' || statusLower === 'cancelled') {
        rejected.push(ord);
      }
    });

    const breakdownList = Object.entries(gatewayMap).map(([method, data]) => ({
      method,
      ...data,
      percentage: revBDT > 0 ? Math.round((data.totalBDT / revBDT) * 100) : (approved.length > 0 ? Math.round((data.count / approved.length) * 100) : 0)
    }));

    // Find top gateway dynamically
    let topGw = { method: 'bKash', totalBDT: 0, count: 0 };
    breakdownList.forEach(g => {
      if (g.totalBDT > topGw.totalBDT || (g.totalBDT === topGw.totalBDT && g.count > topGw.count)) {
        topGw = { method: g.method, totalBDT: g.totalBDT, count: g.count };
      }
    });

    return {
      totalRevenueBDT: revBDT,
      totalRevenueUSD: revUSD,
      todaySalesBDT: todayBDT,
      todayApprovedCount: todayApproved,
      last7DaysSalesBDT: sevenDaysBDT,
      pendingOrders: pending,
      approvedOrders: approved,
      rejectedOrders: rejected,
      chartData: past7Days,
      paymentBreakdown: breakdownList,
      topGateway: topGw,
      completedOrdersDisplayCount
    };
  }, [orders, lastResetAt]);

  // One-Click Order Approval (Updates Firestore & Unlocks Customer Locker)
  const handleApproveOrder = async (order: AdminOrder) => {
    setActionLoadingId(order.id);
    try {
      // 1. Direct Firestore status update
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'approved',
        statusDisplay: 'Approved',
        approvedAt: new Date().toISOString(),
        rejectedAt: null
      });

      // 2. Grant product access to user in Firestore subcollection via service
      await updateOrderStatus(order.id, 'Approved', products);

      // 3. Auto-Cleanup Storage receipt image
      if (order.screenshotUrl) {
        try {
          await deleteStorageFile(order.screenshotUrl);
        } catch (e) {
          console.warn("Storage receipt cleanup note:", e);
        }
      }

      if (lightboxData?.order.id === order.id) {
        closeLightbox();
      }

      setFeedbackMessage({
        type: 'success',
        text: `✓ Order approved! Access permanently unlocked for ${order.userEmail}`
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      console.error("Order approval error:", err);
      // Fallback
      try {
        await updateOrderStatus(order.id, 'Approved', products);
        if (order.screenshotUrl) {
          await deleteStorageFile(order.screenshotUrl);
        }
        if (lightboxData?.order.id === order.id) {
          closeLightbox();
        }
        setFeedbackMessage({
          type: 'success',
          text: `✓ Order approved for ${order.userEmail}`
        });
      } catch (e2) {
        setFeedbackMessage({
          type: 'error',
          text: `Failed to approve order: ${err.message || 'Please try again'}`
        });
      }
      setTimeout(() => setFeedbackMessage(null), 5000);
    } finally {
      setActionLoadingId(null);
    }
  };

  // One-Click Order Rejection
  const handleRejectOrder = async (orderId: string, customerEmail: string) => {
    setActionLoadingId(orderId);
    try {
      const targetOrder = orders.find(o => o.id === orderId);
      await updateDoc(doc(db, 'orders', orderId), {
        status: 'rejected',
        statusDisplay: 'Rejected',
        rejectedAt: new Date().toISOString(),
        approvedAt: null
      });

      await updateOrderStatus(orderId, 'Rejected', products);

      if (targetOrder?.screenshotUrl) {
        try {
          await deleteStorageFile(targetOrder.screenshotUrl);
        } catch (e) {
          console.warn("Storage receipt cleanup note:", e);
        }
      }

      if (lightboxData?.order.id === orderId) {
        closeLightbox();
      }

      setFeedbackMessage({
        type: 'success',
        text: `Order #${orderId.slice(0, 6)} marked as rejected.`
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      console.error("Order reject error:", err);
      setFeedbackMessage({
        type: 'error',
        text: `Failed to reject order: ${err.message || 'Error occurred'}`
      });
      setTimeout(() => setFeedbackMessage(null), 5000);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle Global Store Maintenance Mode
  const toggleMaintenanceMode = async () => {
    const currentStatus = Boolean(
      globalConfig.maintenance || 
      globalConfig.maintenanceMode || 
      globalConfig.footerAndBadges?.maintenanceMode
    );
    const nextState = !currentStatus;

    // Optimistic UI state update
    setGlobalConfig(prev => ({
      ...prev,
      maintenance: nextState,
      maintenanceMode: nextState,
      footerAndBadges: {
        ...(prev.footerAndBadges || {}),
        maintenanceMode: nextState
      }
    }));

    setMaintenanceToggling(true);
    try {
      const configPayload = {
        maintenance: nextState,
        maintenanceMode: nextState,
        'footerAndBadges.maintenanceMode': nextState,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'settings', 'global_config'), configPayload, { merge: true });
      await setDoc(doc(db, 'settings', 'global'), configPayload, { merge: true });

      // Update local storage and dispatch storage event
      try {
        const local = localStorage.getItem('fm_global_config');
        if (local) {
          const parsed = JSON.parse(local);
          parsed.maintenance = nextState;
          parsed.maintenanceMode = nextState;
          if (parsed.footerAndBadges) parsed.footerAndBadges.maintenanceMode = nextState;
          localStorage.setItem('fm_global_config', JSON.stringify(parsed));
        }
        window.dispatchEvent(new Event('storage'));
      } catch {}

      setFeedbackMessage({
        type: 'success',
        text: nextState ? '🔒 Maintenance mode enabled — Public storefront locked.' : '🌐 Storefront reopened for all customers.'
      });
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      console.error("Maintenance toggle error:", err);
      setFeedbackMessage({
        type: 'error',
        text: `Failed to toggle maintenance mode: ${err.message}`
      });
      setTimeout(() => setFeedbackMessage(null), 5000);
    } finally {
      setMaintenanceToggling(false);
    }
  };

  // Save Flash Announcement Notice
  const handleSaveNotice = async () => {
    setNoticeSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global_config'), {
        notice: noticeInput.trim(),
        'branding.announcement': noticeInput.trim(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setNoticeSuccess(true);
      setFeedbackMessage({
        type: 'success',
        text: noticeInput.trim() ? '📢 Live announcement broadcasted to all shoppers!' : 'Notice removed from navbar.'
      });
      setTimeout(() => setNoticeSuccess(false), 2500);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      console.error("Notice save error:", err);
      setFeedbackMessage({
        type: 'error',
        text: `Failed to broadcast notice: ${err.message}`
      });
      setTimeout(() => setFeedbackMessage(null), 5000);
    } finally {
      setNoticeSaving(false);
    }
  };

  // Filtered pending orders for search
  const filteredPending = useMemo(() => {
    if (!pendingSearch.trim()) return pendingOrders;
    const q = pendingSearch.toLowerCase();
    return pendingOrders.filter(o => 
      (o.userEmail || '').toLowerCase().includes(q) ||
      (o.trxId || '').toLowerCase().includes(q) ||
      (o.productTitle || '').toLowerCase().includes(q) ||
      (o.senderNumber || '').toLowerCase().includes(q) ||
      (o.paymentMethod || '').toLowerCase().includes(q)
    );
  }, [pendingOrders, pendingSearch]);

  // Max value for SVG chart scaling
  const maxChartVal = useMemo(() => {
    const maxVal = Math.max(...chartData.map(d => d.totalBDT), 100);
    return Math.ceil(maxVal * 1.25);
  }, [chartData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Feedback Notification */}
      {feedbackMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-lg transition-all animate-in slide-in-from-top-2 duration-300 ${
          feedbackMessage.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 dark:text-emerald-300'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-400 dark:text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button 
            onClick={() => setFeedbackMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 px-2 py-1 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Admin Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading tracking-tight">
            System Analytics & Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time store metrics, live visitor telemetry, and order verification.
          </p>
        </div>
        <button
          onClick={() => {
            setConfirmInput('');
            setResetError('');
            setShowResetModal(true);
          }}
          className="border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-2xl px-4 py-2 text-xs flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>🔄 Reset Sales & Revenue Only</span>
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-7 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white font-heading">
                  ⚠️ Reset Sales & Revenue Analytics?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This action is irreversible and will permanently wipe sales data.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <p className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[11px]">
                What will be reset:
              </p>
              <ul className="space-y-1.5 font-medium pb-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Total Revenue &rarr; ৳0
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Completed Orders count &rarr; 0
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Today's Sales &rarr; ৳0
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Gateway Breakdown metrics (bKash, Nagad, Binance, Card) &rarr; 0% / ৳0
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Historical transaction logs in <code className="px-1 py-0.5 bg-rose-500/10 rounded text-[10px]">orders</code> collection
                </li>
              </ul>
              
              <div className="mt-4 pt-3 border-t border-rose-500/10">
                <p className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[11px] mb-2">
                  What is 100% safe & untouched:
                </p>
                <ul className="space-y-1.5 font-medium">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    All Published Products & Digital Files
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Registered Users & Auth Accounts
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Website Branding, Logos & System Settings
                  </li>
                </ul>
              </div>
            </div>

            {/* Confirmation input */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Type <span className="text-rose-500 font-mono font-black">"RESET STATS"</span> below to confirm:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Type RESET STATS here"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
              {resetError && (
                <p className="text-xs text-rose-500 font-semibold">{resetError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetOverviewOnly}
                disabled={isResetting || confirmInput.trim() !== 'RESET STATS'}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-heading font-black text-white flex items-center gap-2 shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                {isResetting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Resetting Sales...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Confirm & Reset Sales</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Card 1: Total Revenue */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-heading">
              ৳{totalRevenueBDT.toLocaleString()}
            </h3>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 pt-1">
              <span>${totalRevenueUSD.toLocaleString()} USD</span>
              <span className="text-emerald-500 font-extrabold">Today: ৳{todaySalesBDT.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Completed Orders (Dedicated Stat Card) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 shadow-sm relative overflow-hidden group hover:border-emerald-500/60 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              Completed Orders
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading">
              {completedOrdersDisplayCount} <span className="text-xs font-semibold text-slate-400">Sales</span>
            </h3>
            <p className="text-[11px] font-bold text-emerald-500 pt-1">
              Today: {todayApprovedCount} sales
            </p>
          </div>
        </div>

        {/* Card 3: Action Needed (Pending Approvals) */}
        <div className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm relative overflow-hidden group transition ${
          pendingOrders.length > 0 
            ? 'border-amber-500/40 dark:border-amber-500/30' 
            : 'border-slate-200 dark:border-slate-800'
        }`}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              Action Needed
              {pendingOrders.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              )}
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-black text-amber-500 font-heading">
              {pendingOrders.length}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {pendingOrders.length > 0 ? 'Pending verifications' : 'All caught up!'}
            </p>
          </div>
        </div>

        {/* Card 4: Live Active Visitors (Real-Time Heartbeat) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/15 rounded-bl-full pointer-events-none group-hover:scale-110 transition"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              Live Visitors
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading">
              {activeVisitorsCount}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Real-time presence</span>
            </p>
          </div>
        </div>

        {/* Card 5: Active Customers */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500/40 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Customers</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading">
              {usersCount}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Registered users
            </p>
          </div>
        </div>

        {/* Card 6: Digital Assets */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-cyan-500/40 transition">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Digital Assets</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-heading">
              {products.length}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Ready for instant delivery
            </p>
          </div>
        </div>
      </div>

      {/* Main Hub: Urgent Verification Queue & Quick Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Real-Time Order Verification Queue (2 Columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
                  <span className="text-amber-500">⚡</span> Urgent Verification Queue ({pendingOrders.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Verify Transaction IDs and unlock Cloud Locker access for buyers in 1 click.
                </p>
              </div>

              {pendingOrders.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={pendingSearch}
                      onChange={(e) => setPendingSearch(e.target.value)}
                      placeholder="Search email, TrxID..."
                      className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-44"
                    />
                  </div>
                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab('orders')}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0"
                    >
                      All Orders <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* List of Pending Orders */}
            {pendingOrders.length === 0 ? (
              <div className="py-12 px-4 text-center border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl my-4 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto text-xl font-bold">
                  ✓
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  All Caught Up!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  There are no pending customer transactions requiring manual approval at this time.
                </p>
              </div>
            ) : filteredPending.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No pending orders matching "{pendingSearch}".
              </div>
            ) : (
              <div className="space-y-3 my-4 max-h-[460px] overflow-y-auto pr-1">
                {filteredPending.map((order) => {
                  const phoneClean = (order.senderNumber || order.userPhone || '').replace(/[^0-9]/g, '');
                  const waNumber = phoneClean.startsWith('88') ? phoneClean : phoneClean.length === 11 ? `88${phoneClean}` : phoneClean;
                  const waText = encodeURIComponent(`Hi! FileMarket Support here regarding your order for "${order.productTitle}" (TrxID: ${order.trxId}).`);

                  return (
                    <div 
                      key={order.id} 
                      className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      {/* Left: Product & Customer Info + Screenshot Thumbnail */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        {order.screenshotUrl ? (
                          <button
                            type="button"
                            onClick={() => openLightbox(order)}
                            className="relative group shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-500/40 bg-slate-100 dark:bg-slate-900 cursor-pointer shadow-sm hover:border-emerald-500 transition"
                            title="Click to view payment proof in Lightbox"
                          >
                            <img
                              src={order.screenshotUrl}
                              alt="Receipt"
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                            <span className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[8px] font-black text-center py-0.5 leading-none">
                              PROOF
                            </span>
                          </button>
                        ) : (
                          <div className="shrink-0 w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400">
                            <Clock className="w-5 h-5 opacity-60" />
                          </div>
                        )}

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-xs">
                              {order.productTitle || 'Digital Product'}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase ${
                              order.paymentMethod?.toLowerCase().includes('bkash') ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' :
                              order.paymentMethod?.toLowerCase().includes('nagad') ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                              'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            }`}>
                              {order.paymentMethod || 'bKash'}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                            <span>User: <strong className="text-slate-900 dark:text-slate-200">{order.userEmail}</strong></span>
                            {order.senderNumber && (
                              <>
                                <span>•</span>
                                <span>Sender: <strong className="text-slate-800 dark:text-slate-300">{order.senderNumber}</strong></span>
                              </>
                            )}
                          </div>

                          <div className="text-xs font-mono text-cyan-600 dark:text-cyan-400 flex items-center gap-2 flex-wrap">
                            <span className="bg-cyan-500/10 px-2 py-0.5 rounded">TrxID: {order.trxId || 'N/A'}</span>
                            <span className="font-bold text-slate-900 dark:text-white">৳{order.amountBDT || order.amount}</span>
                            <span className="text-[10px] text-slate-400 font-sans">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: One-Click Action Buttons */}
                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                        {/* WhatsApp Customer Link */}
                        {phoneClean && (
                          <a
                            href={`https://wa.me/${waNumber}?text=${waText}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer"
                            title="Chat with customer on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}

                        {/* Reject Button */}
                        <button
                          disabled={actionLoadingId === order.id}
                          onClick={() => handleRejectOrder(order.id, order.userEmail)}
                          className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>

                        {/* Approve Button */}
                        <button
                          disabled={actionLoadingId === order.id}
                          onClick={() => handleApproveOrder(order)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {actionLoadingId === order.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                          <span>Approve & Unlock</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Footer Summary */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Approved: <strong className="text-emerald-500">{completedOrdersDisplayCount}</strong></span>
            <span>Rejected: <strong className="text-rose-500">{rejectedOrders.length}</strong></span>
            <span>Total Logged: <strong>{orders.length}</strong></span>
          </div>
        </div>

        {/* Global Controls & Emergency Broadcasting Hub (1 Column) */}
        <div className="space-y-6">
          
          {/* Quick System Controls Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/5 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              Quick Controls
            </h3>

            {/* Maintenance Mode Switch */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-0.5">
                <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  Maintenance Mode
                  {(globalConfig.maintenance || globalConfig.maintenanceMode) && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  )}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {(globalConfig.maintenance || globalConfig.maintenanceMode) 
                    ? 'Storefront locked for updates' 
                    : 'Storefront fully open'}
                </p>
              </div>

              <button 
                disabled={maintenanceToggling}
                onClick={toggleMaintenanceMode}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 cursor-pointer disabled:opacity-50 ${
                  (globalConfig.maintenance || globalConfig.maintenanceMode) 
                    ? 'bg-rose-500 justify-end' 
                    : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}
                title="Toggle Maintenance Mode"
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
              </button>
            </div>

            {/* Broadcast Announcement Bar Input */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Site-Wide Notice Bar
                </label>
                {globalConfig.notice && (
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    Live
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <input 
                  type="text" 
                  value={noticeInput} 
                  onChange={(e) => setNoticeInput(e.target.value)}
                  placeholder="e.g. ⚡ 50% Eid Discount Live on all UI Kits!"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-inner"
                />

                <div className="flex gap-2">
                  <button 
                    disabled={noticeSaving}
                    onClick={handleSaveNotice}
                    className="flex-1 py-2 px-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {noticeSaving ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : noticeSuccess ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    <span>{noticeSuccess ? 'Saved Live!' : 'Publish Notice'}</span>
                  </button>

                  {noticeInput && (
                    <button
                      onClick={() => {
                        setNoticeInput('');
                        setDoc(doc(db, 'settings', 'global_config'), { notice: '' }, { merge: true });
                      }}
                      className="px-3 py-2 bg-slate-100 dark:bg-slate-950 hover:bg-rose-500/10 text-slate-600 dark:text-slate-400 hover:text-rose-500 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                      title="Clear Announcement"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Navigation Shortcuts */}
          {onNavigateTab && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/5 space-y-2.5">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Management Modules
              </h3>
              
              <button
                onClick={() => onNavigateTab('products')}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-emerald-500/10 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-500">
                  📦 Products Catalog ({products.length})
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
              </button>

              <button
                onClick={() => onNavigateTab('orders')}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-emerald-500/10 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-500">
                  💳 Order Transactions ({orders.length})
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
              </button>

              <button
                onClick={() => onNavigateTab('users')}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-emerald-500/10 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-500">
                  👥 User Directory & Admins ({usersCount})
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
              </button>

              <button
                onClick={() => onNavigateTab('settings')}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-emerald-500/10 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 text-left transition flex items-center justify-between group cursor-pointer"
              >
                <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-500">
                  ⚙️ bKash & Nagad Gateways
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Visual Analytics Section: 7-Day Revenue Trend & Payment Method Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 7-Day Revenue Trend Interactive Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                7-Day Revenue Trend
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Past 7 days approved sales: <strong className="text-emerald-500">৳{last7DaysSalesBDT.toLocaleString()}</strong>
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
              <button
                onClick={() => setChartViewMode('bar')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  chartViewMode === 'bar' 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Bar View
              </button>
              <button
                onClick={() => setChartViewMode('line')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  chartViewMode === 'line' 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Curve Line
              </button>
            </div>
          </div>

          {/* SVG Visual Chart */}
          <div className="pt-4 pb-2">
            {chartViewMode === 'bar' ? (
              /* Interactive Bar Chart */
              <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-52 pt-6">
                {chartData.map((d, idx) => {
                  const heightPercent = Math.max(8, Math.round((d.totalBDT / maxChartVal) * 100));
                  const isToday = idx === chartData.length - 1;

                  return (
                    <div key={d.dateStr} className="flex flex-col items-center gap-2 h-full justify-end group relative">
                      {/* Hover Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 dark:bg-slate-800 text-white px-2 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-lg z-20">
                        ৳{d.totalBDT.toLocaleString()} ({d.count} sales)
                      </div>

                      {/* Bar Value on Top */}
                      <span className="text-[10px] font-mono text-slate-400 font-semibold group-hover:text-emerald-500">
                        {d.totalBDT > 0 ? `৳${d.totalBDT}` : '—'}
                      </span>

                      {/* Bar Pill */}
                      <div className="w-full max-w-[42px] bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden p-1 flex items-end h-32 border border-slate-200/60 dark:border-slate-800">
                        <div 
                          className={`w-full rounded-xl transition-all duration-500 ${
                            isToday 
                              ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-md shadow-emerald-500/20' 
                              : d.totalBDT > 0
                              ? 'bg-gradient-to-t from-emerald-500/70 to-emerald-400/80 group-hover:from-emerald-500 group-hover:to-teal-400'
                              : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        ></div>
                      </div>

                      {/* Day Label */}
                      <div className="text-center">
                        <span className={`text-[11px] font-bold block ${isToday ? 'text-emerald-500' : 'text-slate-600 dark:text-slate-400'}`}>
                          {d.dayName}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {d.label.split(' ')[1]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Smooth SVG Curve Chart */
              <div className="relative h-52 w-full pt-4">
                <svg className="w-full h-40 overflow-visible" viewBox="0 0 700 160">
                  <defs>
                    <linearGradient id="revenueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="0" y1="40" x2="700" y2="40" stroke="#334155" strokeDasharray="3 3" opacity="0.3" />
                  <line x1="0" y1="90" x2="700" y2="90" stroke="#334155" strokeDasharray="3 3" opacity="0.3" />
                  <line x1="0" y1="140" x2="700" y2="140" stroke="#334155" strokeDasharray="3 3" opacity="0.3" />

                  {/* Area fill and Line */}
                  {(() => {
                    const points = chartData.map((d, i) => {
                      const x = 50 + i * 100;
                      const y = 140 - ((d.totalBDT / maxChartVal) * 110);
                      return { x, y, ...d };
                    });

                    const pathD = points.reduce((acc, p, i) => 
                      i === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`, ''
                    );
                    const areaD = `${pathD} L ${points[points.length - 1].x},150 L ${points[0].x},150 Z`;

                    return (
                      <>
                        <path d={areaD} fill="url(#revenueGrad)" />
                        <path d={pathD} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                        {points.map((p) => (
                          <g key={p.dateStr} className="group cursor-pointer">
                            <circle cx={p.x} cy={p.y} r="5" fill="#10B981" stroke="#0F172A" strokeWidth="2" />
                            <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                              {p.totalBDT > 0 ? `৳${p.totalBDT}` : ''}
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>

                {/* Day Labels below chart */}
                <div className="grid grid-cols-7 text-center pt-2">
                  {chartData.map((d, idx) => (
                    <span key={d.dateStr} className={`text-[11px] font-bold ${idx === chartData.length - 1 ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {d.dayName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Gateway Share Breakdown (1 Col) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/5 space-y-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Gateway Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time payment method revenue from approved transactions.
            </p>
          </div>

          <div className="space-y-3.5 pt-1">
            {paymentBreakdown.map((item) => (
              <div key={item.method} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></span>
                    <span className="font-bold text-slate-900 dark:text-white">{item.method}</span>
                    <span className="text-[10px] text-slate-400">({item.count} approved)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    ৳{item.totalBDT.toLocaleString()} <span className="text-slate-400 font-sans text-[11px]">({item.percentage}%)</span>
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden border border-slate-200/50 dark:border-slate-800">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${item.percentage}%`,
                      backgroundColor: item.color 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400">
              Top Gateway: <strong className="text-emerald-500 font-black">{topGateway.method}</strong> {topGateway.totalBDT > 0 ? `(৳${topGateway.totalBDT.toLocaleString()} total collected)` : `(${topGateway.count} approved sales)`}
            </p>
          </div>
        </div>

      </div>

      {/* Lightbox: Screenshot Viewer */}
      {lightboxData && (
        <div 
          onClick={() => {
            setLightboxData(null);
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
                  href={lightboxData.url}
                  download="payment_receipt.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  onClick={() => {
                    setLightboxData(null);
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
                src={lightboxData.url}
                alt="Payment receipt proof"
                className="max-h-[75vh] w-auto rounded-xl object-contain transition-transform duration-200 origin-center"
                style={{ 
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
                }}
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="w-full flex justify-between items-center pt-3 border-t border-slate-800/80 text-xs text-slate-500">
              <span>Customer Payment Proof: {lightboxData.order.trxId}</span>
              <a
                href={lightboxData.url}
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

    </div>
  );
}
