import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth, addPurchasedProductToUser, PurchasedProductItem, cleanFirestoreData, prepareProductPayloadForFirestore } from './firebase';
import { Product, GlobalConfig, DEFAULT_GLOBAL_CONFIG } from '../types';

export interface AdminOrder {
  id: string;
  userId?: string;
  userEmail: string;
  userPhone?: string;
  senderNumber?: string;
  productId: string;
  productTitle: string;
  productThumbnail?: string;
  category?: string;
  amount?: number;
  amountBDT: number;
  amountUSD: number;
  paymentMethod: string;
  trxId: string;
  screenshotUrl?: string | null;
  paymentScreenshotUrl?: string | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'pending' | 'approved' | 'rejected';
  statusDisplay?: string;
  createdAt: string;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  notes?: string;
}

export interface StoreSettings {
  bkashNumber: string;
  nagadNumber: string;
  binancePayId: string;
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  defaultCurrency: 'BDT' | 'USD';
  maintenanceMode: boolean;
  autoApproveOrders: boolean;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  bkashNumber: '01673833783',
  nagadNumber: '01673833783',
  binancePayId: '874592014',
  storeName: 'FileMarket Digital Marketplace',
  supportEmail: 'support@filemarket.site',
  supportPhone: '+8801673833783',
  defaultCurrency: 'BDT',
  maintenanceMode: false,
  autoApproveOrders: false,
};

// --- GLOBAL CONFIG REAL-TIME MANAGEMENT ---

export function subscribeGlobalConfig(callback: (config: GlobalConfig) => void): () => void {
  try {
    const unsub = onSnapshot(doc(db, 'settings', 'global_config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as any;
        const maintenanceFlag = Boolean(
          data.maintenance || 
          data.maintenanceMode || 
          data.footerAndBadges?.maintenanceMode || 
          false
        );
        const merged: GlobalConfig = {
          maintenance: maintenanceFlag,
          maintenanceMode: maintenanceFlag,
          notice: data.notice || data.branding?.announcement || '',
          telegram: data.telegram || DEFAULT_GLOBAL_CONFIG.telegram,
          branding: { ...DEFAULT_GLOBAL_CONFIG.branding, ...data.branding },
          globalAds: data.globalAds ? { ...DEFAULT_GLOBAL_CONFIG.globalAds, ...data.globalAds } : DEFAULT_GLOBAL_CONFIG.globalAds,
          heroSliders: data.heroSliders && data.heroSliders.length > 0 ? data.heroSliders : DEFAULT_GLOBAL_CONFIG.heroSliders,
          categories: data.categories && data.categories.length > 0 ? data.categories : DEFAULT_GLOBAL_CONFIG.categories,
          paymentGateways: { ...DEFAULT_GLOBAL_CONFIG.paymentGateways, ...data.paymentGateways, ...data.gateways },
          gateways: { ...DEFAULT_GLOBAL_CONFIG.paymentGateways, ...data.paymentGateways, ...data.gateways },
          footerAndBadges: { 
            ...DEFAULT_GLOBAL_CONFIG.footerAndBadges, 
            ...data.footerAndBadges,
            maintenanceMode: maintenanceFlag 
          },
        };
        localStorage.setItem('fm_global_config', JSON.stringify(merged));
        callback(merged);
      } else {
        // Initialize doc with default
        setDoc(doc(db, 'settings', 'global_config'), DEFAULT_GLOBAL_CONFIG, { merge: true }).catch(console.warn);
        callback(DEFAULT_GLOBAL_CONFIG);
      }
    }, (err) => {
      console.warn("Global config snapshot error, using fallback:", err);
      const localStr = localStorage.getItem('fm_global_config');
      callback(localStr ? JSON.parse(localStr) : DEFAULT_GLOBAL_CONFIG);
    });

    return unsub;
  } catch (e) {
    console.warn("Global config subscription setup failed:", e);
    const localStr = localStorage.getItem('fm_global_config');
    callback(localStr ? JSON.parse(localStr) : DEFAULT_GLOBAL_CONFIG);
    return () => {};
  }
}

export async function saveGlobalConfig(config: GlobalConfig): Promise<void> {
  const maintenanceFlag = Boolean(
    config.maintenance || 
    config.maintenanceMode || 
    config.footerAndBadges?.maintenanceMode || 
    false
  );
  const payload = {
    ...config,
    maintenance: maintenanceFlag,
    maintenanceMode: maintenanceFlag,
    footerAndBadges: {
      ...config.footerAndBadges,
      maintenanceMode: maintenanceFlag
    },
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'settings', 'global_config'), payload, { merge: true });
    await setDoc(doc(db, 'settings', 'global'), payload, { merge: true });
  } catch (err) {
    console.warn("Firestore save global config error:", err);
  }
  try {
    localStorage.setItem('fm_global_config', JSON.stringify(payload));
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

// --- PRODUCTS MANAGEMENT ---

export function getDeletedProductIds(): Set<string> {
  try {
    const deletedStr = localStorage.getItem('fm_deleted_product_ids') || '[]';
    const arr: string[] = JSON.parse(deletedStr);
    return new Set(arr.map(String));
  } catch {
    return new Set();
  }
}

export function subscribeProducts(callback: (products: Product[]) => void): () => void {
  try {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snap) => {
      const firestoreProducts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      callback(firestoreProducts);
    }, (err) => {
      console.warn("Products snapshot error:", err);
    });
    return unsubProducts;
  } catch (e) {
    fetchAllProducts().then(callback);
    return () => {};
  }
}

export function subscribeOrders(callback: (orders: AdminOrder[]) => void): () => void {
  try {
    const unsub = onSnapshot(collection(db, 'orders'), (snap) => {
      const ordersList = snap.docs.map(d => {
        const data = d.data();
        const rawAmount = String(data.amount || data.amountBDT || data.priceBDT || data.price || 0).replace(/[^0-9.]/g, '');
        const parsedAmount = parseFloat(rawAmount) || 0;
        const parsedUSD = Number(data.amountUSD || Math.round(parsedAmount / 120) || 0);
        const rawStatus = (data.status || data.orderStatus || data.statusDisplay || 'pending').toLowerCase();
        const normalizedStatus = rawStatus === 'approved' || rawStatus === 'completed' || rawStatus === 'success' 
          ? 'approved' 
          : rawStatus === 'rejected' || rawStatus === 'declined' || rawStatus === 'cancelled' 
            ? 'rejected' 
            : 'pending';

        return {
          id: d.id,
          userId: data.userId || '',
          userEmail: data.userEmail || data.email || 'customer@filemarket.site',
          userPhone: data.userPhone || data.senderNumber || '',
          senderNumber: data.senderNumber || data.userPhone || '',
          productId: data.productId || '',
          productTitle: data.productTitle || 'Digital Product',
          productThumbnail: data.productThumbnail || '',
          category: data.category || 'Digital Assets',
          amount: parsedAmount,
          amountBDT: parsedAmount,
          amountUSD: parsedUSD,
          paymentMethod: data.paymentMethod || 'bKash',
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

      const localStr = localStorage.getItem('fm_admin_orders');
      const localOrders: AdminOrder[] = localStr ? JSON.parse(localStr) : [];

      const map = new Map<string, AdminOrder>();
      localOrders.forEach(o => map.set(o.id, o));
      ordersList.forEach(o => map.set(o.id, o));

      const sorted = Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(sorted);
    }, (err) => {
      console.warn("Orders snapshot error:", err);
      fetchAdminOrders().then(callback);
    });
    return unsub;
  } catch (e) {
    fetchAdminOrders().then(callback);
    return () => {};
  }
}

export function subscribeUsers(callback: (users: any[]) => void): () => void {
  try {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const usersList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      callback(usersList);
    }, (err) => {
      console.warn("Users snapshot error:", err);
      fetchAdminUsers().then(callback);
    });
    return unsub;
  } catch (e) {
    fetchAdminUsers().then(callback);
    return () => {};
  }
}

export async function fetchAllProducts(): Promise<Product[]> {
  try {
    const snap = await getDocs(collection(db, 'products'));
    const firestoreProducts: Product[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
    return firestoreProducts;
  } catch (error) {
    console.warn("Could not fetch products from Firestore:", error);
    return [];
  }
}

export async function saveAdminProduct(product: Product): Promise<void> {
  const strId = String(product.id);
  const cleanedProduct = prepareProductPayloadForFirestore(product);
  // If product was previously marked deleted, un-delete it locally and in Firestore
  try {
    const deletedStr = localStorage.getItem('fm_deleted_product_ids') || '[]';
    let deletedIds: string[] = JSON.parse(deletedStr);
    if (deletedIds.includes(strId)) {
      deletedIds = deletedIds.filter(id => id !== strId);
      localStorage.setItem('fm_deleted_product_ids', JSON.stringify(deletedIds));
    }
  } catch {}

  try {
    await deleteDoc(doc(db, 'deleted_products', strId));
  } catch {}

  try {
    await setDoc(doc(db, 'products', strId), cleanedProduct, { merge: true });
  } catch (err) {
    console.warn("Firestore save product error:", err);
  }

  // Always update local cache
  try {
    const localStr = localStorage.getItem('fm_custom_products');
    let localList: Product[] = localStr ? JSON.parse(localStr) : [];
    const idx = localList.findIndex(p => String(p.id) === strId);
    if (idx >= 0) {
      localList[idx] = product;
    } else {
      localList.unshift(product);
    }
    localStorage.setItem('fm_custom_products', JSON.stringify(localList));

    const genStr = localStorage.getItem('fm_products');
    let genList: any[] = genStr ? JSON.parse(genStr) : [];
    const gIdx = genList.findIndex((p: any) => String(p.id) === strId);
    if (gIdx >= 0) {
      genList[gIdx] = product;
    } else {
      genList.unshift(product);
    }
    localStorage.setItem('fm_products', JSON.stringify(genList));

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('fm_products_changed', { detail: { savedId: strId } }));
  } catch (err) {
    console.warn("Failed to update local products:", err);
  }
}

export async function deleteAdminProduct(productId: string): Promise<void> {
  const strId = String(productId);

  // 1. Delete document from Firestore products collection
  try {
    await deleteDoc(doc(db, 'products', strId));
  } catch (err) {
    console.warn("Firestore delete product error:", err);
  }

  // 2. Mark in Firestore deleted_products collection so other users/browsers see it deleted instantly
  try {
    await setDoc(doc(db, 'deleted_products', strId), {
      id: strId,
      deletedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Firestore deleted_products set error:", err);
  }

  // 3. Track in deleted product IDs so static items don't resurrect
  try {
    const deletedStr = localStorage.getItem('fm_deleted_product_ids') || '[]';
    const deletedIds: string[] = JSON.parse(deletedStr);
    if (!deletedIds.includes(strId)) {
      deletedIds.push(strId);
      localStorage.setItem('fm_deleted_product_ids', JSON.stringify(deletedIds));
    }
  } catch {}

  // 4. Remove from custom local caches
  try {
    const localStr = localStorage.getItem('fm_custom_products');
    let localList: Product[] = localStr ? JSON.parse(localStr) : [];
    localList = localList.filter(p => String(p.id) !== strId);
    localStorage.setItem('fm_custom_products', JSON.stringify(localList));

    const genStr = localStorage.getItem('fm_products');
    let genList: any[] = genStr ? JSON.parse(genStr) : [];
    genList = genList.filter((p: any) => String(p.id) !== strId);
    localStorage.setItem('fm_products', JSON.stringify(genList));

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('fm_products_changed', { detail: { deletedId: strId } }));
  } catch {}
}

// --- ORDERS MANAGEMENT ---

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  try {
    const snap = await getDocs(collection(db, 'orders'));
    const ordersList = snap.docs.map(d => {
      const data = d.data();
      const rawAmount = String(data.amount || data.amountBDT || data.priceBDT || data.price || 0).replace(/[^0-9.]/g, '');
      const parsedAmount = parseFloat(rawAmount) || 0;
      const parsedUSD = Number(data.amountUSD || Math.round(parsedAmount / 120) || 0);
      const rawStatus = (data.status || data.orderStatus || data.statusDisplay || 'pending').toLowerCase();
      const normalizedStatus = rawStatus === 'approved' || rawStatus === 'completed' || rawStatus === 'success' 
        ? 'approved' 
        : rawStatus === 'rejected' || rawStatus === 'declined' || rawStatus === 'cancelled' 
          ? 'rejected' 
          : 'pending';

      return {
        id: d.id,
        userId: data.userId || '',
        userEmail: data.userEmail || data.email || 'customer@filemarket.site',
        userPhone: data.userPhone || data.senderNumber || '',
        senderNumber: data.senderNumber || data.userPhone || '',
        productId: data.productId || '',
        productTitle: data.productTitle || 'Digital Product',
        productThumbnail: data.productThumbnail || '',
        category: data.category || 'Digital Assets',
        amount: parsedAmount,
        amountBDT: parsedAmount,
        amountUSD: parsedUSD,
        paymentMethod: data.paymentMethod || 'bKash',
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
    ordersList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    // Merge with local orders
    const localStr = localStorage.getItem('fm_admin_orders');
    const localOrders: AdminOrder[] = localStr ? JSON.parse(localStr) : [];

    const map = new Map<string, AdminOrder>();
    localOrders.forEach(o => map.set(o.id, o));
    ordersList.forEach(o => map.set(o.id, o));

    return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (error) {
    console.warn("Firestore fetch orders error:", error);
    const localStr = localStorage.getItem('fm_admin_orders');
    return localStr ? JSON.parse(localStr) : [];
  }
}

export async function saveAdminOrder(order: AdminOrder): Promise<void> {
  const rawStatus = (order.status || 'pending').toLowerCase();
  const normalizedStatus: 'approved' | 'rejected' | 'pending' = 
    rawStatus === 'approved' || rawStatus === 'completed' || rawStatus === 'success' 
      ? 'approved' 
      : rawStatus === 'rejected' || rawStatus === 'declined' || rawStatus === 'cancelled' 
        ? 'rejected' 
        : 'pending';

  const payload: AdminOrder = {
    ...order,
    status: normalizedStatus,
    statusDisplay: order.statusDisplay || (normalizedStatus === 'approved' ? 'Approved' : normalizedStatus === 'rejected' ? 'Rejected' : 'Pending'),
  };

  try {
    await setDoc(doc(db, 'orders', order.id), { ...payload, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn("Firestore save order error:", err);
  }

  try {
    const localStr = localStorage.getItem('fm_admin_orders');
    let localList: AdminOrder[] = localStr ? JSON.parse(localStr) : [];
    const idx = localList.findIndex(o => o.id === order.id);
    if (idx >= 0) {
      localList[idx] = { ...localList[idx], ...payload };
    } else {
      localList.unshift(payload);
    }
    localStorage.setItem('fm_admin_orders', JSON.stringify(localList));
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

export async function updateOrderStatus(
  orderId: string, 
  newStatus: 'Approved' | 'Rejected' | 'Pending',
  allProducts: Product[]
): Promise<void> {
  const normStatus = newStatus.toLowerCase(); // 'approved' | 'rejected' | 'pending'

  // 1. Immediately update Firestore order document
  try {
    const updatePayload: any = {
      status: normStatus,
      statusDisplay: newStatus,
      updatedAt: new Date().toISOString()
    };
    if (newStatus === 'Approved') {
      updatePayload.approvedAt = new Date().toISOString();
      updatePayload.rejectedAt = null;
    } else if (newStatus === 'Rejected') {
      updatePayload.rejectedAt = new Date().toISOString();
      updatePayload.approvedAt = null;
    }
    await setDoc(doc(db, 'orders', orderId), updatePayload, { merge: true });
  } catch (err) {
    console.warn("Direct Firestore update failed in updateOrderStatus:", err);
  }

  let targetOrder: AdminOrder | null = null;
  const orders = await fetchAdminOrders();
  targetOrder = orders.find(o => o.id === orderId) || null;

  if (targetOrder) {
    targetOrder.status = newStatus;
    if (newStatus === 'Approved') {
      targetOrder.approvedAt = new Date().toISOString();
      targetOrder.rejectedAt = null;
    } else if (newStatus === 'Rejected') {
      targetOrder.rejectedAt = new Date().toISOString();
      targetOrder.approvedAt = null;
    }
    
    await saveAdminOrder(targetOrder);

    // If approving order, grant permanent Cloud Locker access to customer in database ONLY
    if (newStatus === 'Approved') {
      const product = allProducts.find(p => p.id === targetOrder?.productId);
      
      const item: PurchasedProductItem = {
        id: product?.id || targetOrder.productId,
        title: product?.title || targetOrder.productTitle,
        category: product?.category || targetOrder.category || 'Digital Assets',
        image: product?.thumbnail || targetOrder.productThumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
        downloadUrl: product?.instantDownloadLink || 'https://drive.google.com',
        licenseKey: `FM-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-PRO`,
        purchaseDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        priceBdt: product?.priceBDT || targetOrder.amountBDT || targetOrder.amount || 0,
        priceUsd: product?.priceUSD || targetOrder.amountUSD || 0
      };

      // Determine target customer user ID (strictly never mutate current auth session)
      const targetUserId = targetOrder.userId ? targetOrder.userId.trim() : '';
      
      if (targetUserId) {
        await addPurchasedProductToUser(targetUserId, item);
      } else if (targetOrder.userEmail) {
        // Find customer user by email in Firestore
        try {
          const usersSnap = await getDocs(collection(db, 'users'));
          const matchedDoc = usersSnap.docs.find(d => d.data().email?.toLowerCase() === targetOrder?.userEmail.toLowerCase());
          if (matchedDoc) {
            await addPurchasedProductToUser(matchedDoc.id, item);
          }
        } catch (e) {
          console.warn("Could not match user by email during order approval:", e);
        }
      }
    }
  }
}

/**
 * Atomic Order Deletion & Cloud Locker Revocation:
 * 1. Deletes order document from 'orders' collection in Firestore.
 * 2. Revokes product from user profile document (purchasedProducts array & locker counts).
 * 3. Removes subcollection records at users/{userId}/locker/{productId} and users/{userId}/purchases/{productId}.
 * 4. Cleanses local caches and dispatches live update events.
 */
export async function deleteOrderAndRevokeLockerAccess(
  orderId: string, 
  extraInfo?: { productId?: string; userId?: string; userEmail?: string }
): Promise<void> {
  const cleanOrderId = String(orderId || '').trim();
  if (!cleanOrderId) return;

  try {
    let targetUserId = extraInfo?.userId ? String(extraInfo.userId).trim() : '';
    let targetProductId = extraInfo?.productId ? String(extraInfo.productId).trim() : '';
    let targetEmail = extraInfo?.userEmail ? String(extraInfo.userEmail).trim().toLowerCase() : '';

    // Fetch order doc if metadata is missing
    if (!targetUserId || !targetProductId) {
      try {
        const orderSnap = await getDoc(doc(db, 'orders', cleanOrderId));
        if (orderSnap.exists()) {
          const ordData = orderSnap.data();
          targetUserId = targetUserId || ordData.userId || ordData.uid || ordData.customerId || '';
          targetProductId = targetProductId || ordData.productId || '';
          targetEmail = targetEmail || (ordData.userEmail || ordData.customerEmail || ordData.email || '').toLowerCase();
        }
      } catch (err) {
        console.warn("Error looking up order for deletion:", err);
      }
    }

    // Match user by email if targetUserId is still empty
    if (!targetUserId && targetEmail) {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const matched = usersSnap.docs.find(d => {
          const data = d.data();
          return (data.email || '').toLowerCase().trim() === targetEmail;
        });
        if (matched) {
          targetUserId = matched.id;
        }
      } catch (e) {
        console.warn("Could not match user by email during order deletion:", e);
      }
    }

    const batch = writeBatch(db);

    // 1. Delete order doc from orders collection
    const orderDocRef = doc(db, 'orders', cleanOrderId);
    batch.delete(orderDocRef);

    // Also delete any other order records matching this user & product
    if (targetProductId) {
      try {
        const ordersSnap = await getDocs(collection(db, 'orders'));
        ordersSnap.docs.forEach(d => {
          const data = d.data();
          const oUid = (data.userId || data.uid || data.customerId || '').trim();
          const oEmail = (data.customerEmail || data.userEmail || data.email || '').trim().toLowerCase();
          const oProdId = String(data.productId || '').trim();

          const isUserMatch = (targetUserId && oUid === targetUserId) || (targetEmail && oEmail === targetEmail);
          const isProdMatch = oProdId === targetProductId || d.id === targetProductId || d.id === cleanOrderId;

          if (isUserMatch && isProdMatch && d.id !== cleanOrderId) {
            batch.delete(d.ref);
          }
        });
      } catch (e) {
        console.warn("Matching orders scan error in adminServices:", e);
      }
    }

    // 2. Revoke user locker access atomically
    if (targetUserId) {
      const userDocRef = doc(db, 'users', targetUserId);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() || {};
        const purchases: PurchasedProductItem[] = userData.purchasedProducts || [];
        const unlockedProds: string[] = Array.isArray(userData.unlockedProducts) ? userData.unlockedProducts : [];
        const unlockedAssets: string[] = Array.isArray(userData.unlockedAssets) ? userData.unlockedAssets : [];

        // Filter out the revoked product by productId or orderId
        const updatedPurchases = purchases.filter(p => {
          const pId = String(p.id || '').trim();
          const pProdId = String(p.productData?.id || '').trim();
          return pId !== targetProductId && 
                 pId !== cleanOrderId && 
                 (!targetProductId || pProdId !== targetProductId);
        });

        const updatedUnlockedProds = unlockedProds.filter(id => id !== targetProductId && id !== cleanOrderId);
        const updatedUnlockedAssets = unlockedAssets.filter(id => id !== targetProductId && id !== cleanOrderId);

        const newLockerCount = Math.max(0, updatedPurchases.length);

        batch.set(userDocRef, {
          purchasedProducts: updatedPurchases,
          unlockedProducts: updatedUnlockedProds,
          unlockedAssets: updatedUnlockedAssets,
          lockerCount: newLockerCount,
          lockerAssetsCount: newLockerCount,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      // Delete subcollections for this product / order
      try {
        if (targetProductId) {
          batch.delete(doc(db, 'users', targetUserId, 'locker', targetProductId));
          batch.delete(doc(db, 'users', targetUserId, 'purchases', targetProductId));
        }
        batch.delete(doc(db, 'users', targetUserId, 'locker', cleanOrderId));
        batch.delete(doc(db, 'users', targetUserId, 'purchases', cleanOrderId));
      } catch (subErr) {
        console.warn("Subcollection deletion staging note:", subErr);
      }
    }

    // Commit all deletions atomically
    await batch.commit();

    // Clean local cache
    try {
      const localOrdersStr = localStorage.getItem('fm_admin_orders');
      if (localOrdersStr) {
        const localList: AdminOrder[] = JSON.parse(localOrdersStr);
        const filtered = localList.filter(o => o.id !== cleanOrderId);
        localStorage.setItem('fm_admin_orders', JSON.stringify(filtered));
      }

      if (targetUserId) {
        localStorage.removeItem(`fm_purchased_products_${targetUserId}`);
        const currentUid = auth.currentUser?.uid;
        if (currentUid === targetUserId) {
          const currentPurchasesStr = localStorage.getItem('fm_purchased_products');
          if (currentPurchasesStr) {
            const currentList: any[] = JSON.parse(currentPurchasesStr);
            const filtered = currentList.filter(p => p.id !== targetProductId && p.id !== cleanOrderId);
            localStorage.setItem('fm_purchased_products', JSON.stringify(filtered));
          }
        }
      }

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('filemarket:locker-change', { detail: { orderId: cleanOrderId, userId: targetUserId, productId: targetProductId } }));
    } catch {}

  } catch (error) {
    console.error("Error in deleteOrderAndRevokeLockerAccess:", error);
    throw error;
  }
}

// --- MASTER ADMIN ACCESS MANAGEMENT ---

export const DEFAULT_MASTER_ADMIN_EMAIL = 'new144506@gmail.com';

export async function fetchMasterAdminEmail(): Promise<string> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'admin_access'));
    if (snap.exists() && snap.data().masterEmail) {
      const email = snap.data().masterEmail.trim().toLowerCase();
      localStorage.setItem('fm_master_admin_email', email);
      return email;
    }
  } catch (err) {
    console.warn("Error fetching master admin email:", err);
  }
  return localStorage.getItem('fm_master_admin_email') || DEFAULT_MASTER_ADMIN_EMAIL;
}

export async function saveMasterAdminEmail(newEmail: string): Promise<void> {
  const sanitized = newEmail.trim().toLowerCase();
  const currentUser = auth.currentUser;
  const payload = {
    masterEmail: sanitized,
    updatedAt: new Date().toISOString(),
    updatedBy: currentUser?.email || 'master'
  };

  try {
    await setDoc(doc(db, 'settings', 'admin_access'), payload, { merge: true });
    localStorage.setItem('fm_master_admin_email', sanitized);
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error("Firestore save master admin email error:", err);
    throw err;
  }
}

export function subscribeMasterAdminEmail(callback: (masterEmail: string) => void): () => void {
  try {
    const unsub = onSnapshot(doc(db, 'settings', 'admin_access'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().masterEmail) {
        const email = docSnap.data().masterEmail.trim().toLowerCase();
        localStorage.setItem('fm_master_admin_email', email);
        callback(email);
      } else {
        localStorage.setItem('fm_master_admin_email', DEFAULT_MASTER_ADMIN_EMAIL);
        callback(DEFAULT_MASTER_ADMIN_EMAIL);
      }
    }, (err) => {
      console.warn("Master admin email snapshot error:", err);
      const cached = localStorage.getItem('fm_master_admin_email') || DEFAULT_MASTER_ADMIN_EMAIL;
      callback(cached);
    });
    return unsub;
  } catch (e) {
    const cached = localStorage.getItem('fm_master_admin_email') || DEFAULT_MASTER_ADMIN_EMAIL;
    callback(cached);
    return () => {};
  }
}

// --- USERS MANAGEMENT ---

export async function fetchAdminUsers(): Promise<any[]> {
  try {
    const masterAdmin = await fetchMasterAdminEmail();
    const snap = await getDocs(collection(db, 'users'));
    const usersList: any[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Include currentUser if not present
    const current = auth.currentUser;
    if (current && !usersList.some(u => u.userId === current.uid || u.email === current.email)) {
      const isMaster = (current.email || '').toLowerCase().trim() === masterAdmin.toLowerCase().trim();
      usersList.push({
        userId: current.uid,
        fullName: current.displayName || 'Current User',
        email: current.email || '',
        role: isMaster ? 'admin' : 'user',
        createdAt: new Date().toISOString()
      });
    }

    return usersList;
  } catch (err) {
    console.warn("Firestore fetch users error:", err);
    const cachedMaster = localStorage.getItem('fm_master_admin_email') || DEFAULT_MASTER_ADMIN_EMAIL;
    const current = auth.currentUser;
    return current ? [
      {
        userId: current.uid,
        fullName: current.displayName || 'User',
        email: current.email || '',
        role: (current.email || '').toLowerCase().trim() === cachedMaster.toLowerCase().trim() ? 'admin' : 'user',
        createdAt: new Date().toISOString()
      }
    ] : [];
  }
}

export async function updateUserRole(userId: string, newRole: 'admin' | 'user'): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), { role: newRole, updatedAt: new Date().toISOString() });
  } catch (err) {
    try {
      await setDoc(doc(db, 'users', userId), { role: newRole, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.warn("Failed to update user role:", e);
    }
  }
}

export async function updateUserBlockedStatus(userId: string, isBlocked: boolean): Promise<void> {
  const statusStr = isBlocked ? 'blocked' : 'active';
  try {
    await updateDoc(doc(db, 'users', userId), { 
      isBlocked, 
      status: statusStr, 
      updatedAt: new Date().toISOString() 
    });
  } catch (err) {
    try {
      await setDoc(doc(db, 'users', userId), { 
        isBlocked, 
        status: statusStr, 
        updatedAt: new Date().toISOString() 
      }, { merge: true });
    } catch (e) {
      console.warn("Failed to update user blocked state:", e);
    }
  }
}

export async function deleteAdminUser(userId: string): Promise<void> {
  const cleanId = String(userId).trim();
  if (!cleanId) return;

  try {
    await deleteDoc(doc(db, 'users', cleanId));
  } catch (err) {
    console.warn("Firestore delete user error:", err);
    throw err;
  }

  // Clear any local cache for this user
  try {
    localStorage.removeItem(`fm_purchased_products_${cleanId}`);
  } catch {}
}

export async function fetchUserOrderHistory(userEmail: string, userId?: string): Promise<any[]> {
  const emailQuery = (userEmail || '').trim().toLowerCase();
  const uidQuery = (userId || '').trim();

  const ordersMap = new Map<string, any>();

  // 1. Fetch from Firestore orders collection
  try {
    const ordersSnap = await getDocs(collection(db, 'orders'));
    ordersSnap.docs.forEach(docSnap => {
      const data = docSnap.data();
      const oEmail = (data.userEmail || data.customerEmail || data.email || '').toLowerCase().trim();
      const oUid = (data.userId || data.uid || '').trim();

      if ((emailQuery && oEmail === emailQuery) || (uidQuery && oUid === uidQuery)) {
        const rawAmount = String(data.amount || data.amountBDT || data.priceBDT || data.price || 0).replace(/[^0-9.]/g, '');
        const amount = parseFloat(rawAmount) || 0;
        ordersMap.set(docSnap.id, {
          id: docSnap.id,
          productTitle: data.productTitle || data.title || 'Digital Asset Bundle',
          amount: amount,
          price: amount,
          paymentMethod: data.paymentMethod || 'bKash',
          trxId: data.trxId || 'Direct',
          status: data.status || data.statusDisplay || 'Completed',
          createdAt: data.createdAt || new Date().toISOString(),
          downloadUrl: data.downloadUrl || data.instantDownloadLink || null,
          category: data.category || 'Digital Assets'
        });
      }
    });
  } catch (err) {
    console.warn("Error querying orders by email/uid:", err);
  }

  // 2. Fetch from user's purchasedProducts array and purchases subcollection
  if (uidQuery) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uidQuery));
      if (userDoc.exists()) {
        const uData = userDoc.data();
        const purchases: any[] = uData.purchasedProducts || [];
        purchases.forEach((p, idx) => {
          const key = `user_purchase_${p.id || idx}`;
          if (!ordersMap.has(key)) {
            ordersMap.set(key, {
              id: key,
              productTitle: p.title || 'Unlocked Asset',
              amount: p.priceBdt || p.price || 0,
              price: p.priceBdt || p.price || 0,
              paymentMethod: 'Instant Vault',
              trxId: p.licenseKey || 'VERIFIED',
              status: 'Approved',
              createdAt: p.purchaseDate || new Date().toISOString(),
              downloadUrl: p.downloadUrl || p.driveUrl || p.instantDownloadLink || 'https://drive.google.com',
              category: p.category || 'Digital Assets'
            });
          }
        });
      }
    } catch (err) {
      console.warn("Error fetching user profile purchases:", err);
    }
  }

  return Array.from(ordersMap.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}

// --- STORE SETTINGS MANAGEMENT ---

export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'global_config'));
    if (docSnap.exists()) {
      const data = docSnap.data() as any;
      const maintenanceFlag = Boolean(data.maintenance || data.maintenanceMode || data.footerAndBadges?.maintenanceMode || false);
      return {
        ...DEFAULT_STORE_SETTINGS,
        bkashNumber: data.paymentGateways?.bkashNumber || data.gateways?.bkashNumber || data.bkashNumber || DEFAULT_STORE_SETTINGS.bkashNumber,
        nagadNumber: data.paymentGateways?.nagadNumber || data.gateways?.nagadNumber || data.nagadNumber || DEFAULT_STORE_SETTINGS.nagadNumber,
        binancePayId: data.paymentGateways?.binancePayId || data.gateways?.binancePayId || data.binancePayId || DEFAULT_STORE_SETTINGS.binancePayId,
        storeName: data.branding?.siteName || data.storeName || DEFAULT_STORE_SETTINGS.storeName,
        supportEmail: data.footerAndBadges?.supportEmail || data.supportEmail || DEFAULT_STORE_SETTINGS.supportEmail,
        supportPhone: data.footerAndBadges?.supportPhone || data.supportPhone || DEFAULT_STORE_SETTINGS.supportPhone,
        defaultCurrency: data.defaultCurrency || 'BDT',
        maintenanceMode: maintenanceFlag,
        autoApproveOrders: data.autoApproveOrders || data.footerAndBadges?.autoApproveOrders || false,
      };
    }
  } catch (err) {
    console.warn("Firestore settings error:", err);
  }

  const local = localStorage.getItem('fm_store_settings');
  return local ? JSON.parse(local) : DEFAULT_STORE_SETTINGS;
}

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  const maintenanceFlag = Boolean(settings.maintenanceMode);
  const payload = {
    ...settings,
    maintenance: maintenanceFlag,
    maintenanceMode: maintenanceFlag,
    'footerAndBadges.maintenanceMode': maintenanceFlag,
    'footerAndBadges.supportEmail': settings.supportEmail,
    'footerAndBadges.supportPhone': settings.supportPhone,
    'paymentGateways.bkashNumber': settings.bkashNumber,
    'paymentGateways.nagadNumber': settings.nagadNumber,
    'paymentGateways.binancePayId': settings.binancePayId,
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'settings', 'global_config'), payload, { merge: true });
    await setDoc(doc(db, 'settings', 'global'), payload, { merge: true });
  } catch (err) {
    console.warn("Firestore save settings error:", err);
  }

  localStorage.setItem('fm_store_settings', JSON.stringify(settings));

  const localCfgStr = localStorage.getItem('fm_global_config');
  if (localCfgStr) {
    try {
      const cfg = JSON.parse(localCfgStr);
      cfg.maintenance = maintenanceFlag;
      cfg.maintenanceMode = maintenanceFlag;
      if (cfg.footerAndBadges) cfg.footerAndBadges.maintenanceMode = maintenanceFlag;
      if (cfg.paymentGateways) {
        cfg.paymentGateways.bkashNumber = settings.bkashNumber;
        cfg.paymentGateways.nagadNumber = settings.nagadNumber;
        cfg.paymentGateways.binancePayId = settings.binancePayId;
      }
      localStorage.setItem('fm_global_config', JSON.stringify(cfg));
    } catch {}
  }
  window.dispatchEvent(new Event('storage'));
}

export interface ActiveVisitorInfo {
  id: string;
  lastSeen: number;
  url?: string;
  userAgent?: string;
}

export function subscribeActivePresence(callback: (visitors: ActiveVisitorInfo[], count: number) => void): () => void {
  try {
    return onSnapshot(collection(db, 'active_presence'), (snapshot) => {
      const now = Date.now();
      const list: ActiveVisitorInfo[] = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const lastSeen = Number(data.lastSeen || data.lastActive) || 0;
        // Count documents active within the last 35 seconds (sliding window)
        if (now - lastSeen <= 35000) {
          list.push({
            id: docSnap.id,
            lastSeen,
            url: data.url || data.path || '/',
            userAgent: data.userAgent || ''
          });
        }
      });
      callback(list, list.length);
    }, (err) => {
      console.warn("Active presence snapshot error:", err);
      callback([], 0);
    });
  } catch (err) {
    console.warn("Failed to subscribe to active presence:", err);
    return () => {};
  }
}

export function subscribeActiveVisitors(callback: (visitors: any[], count: number) => void): () => void {
  return subscribeActivePresence(callback);
}

