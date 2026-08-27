import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  deleteDoc, 
  query, 
  where, 
  getDocs,
  getDoc,
  writeBatch,
  arrayRemove
} from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { deleteOrderAndRevokeLockerAccess } from '../../lib/adminServices';
import { 
  Users, 
  Search, 
  Shield, 
  ShieldCheck, 
  Eye, 
  Trash2, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone, 
  MapPin, 
  Package, 
  Calendar, 
  Download, 
  ExternalLink, 
  AlertTriangle, 
  X, 
  CheckCircle, 
  RefreshCw,
  CreditCard,
  Hash,
  DollarSign
} from 'lucide-react';
import AdminAccessSettings from './AdminAccessSettings';

export default function AdminUsers({ onRefresh }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToBlock, setUserToBlock] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  // Toast state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ text: message, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Realtime Listen to All Users
  useEffect(() => {
    const q = collection(db, 'users');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(d => ({ id: d.id, userId: d.id, ...d.data() }));
      setUsers(usersData);
      setLoading(false);
    }, (err) => {
      console.warn("Realtime users listener error:", err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Realtime Firestore Listeners (onSnapshot) for User Inspector Modal (Orders + Direct Locker Assets)
  useEffect(() => {
    if (!showDetailModal || !selectedUser) {
      setUserOrders([]);
      return;
    }

    setLoadingOrders(true);
    const targetUid = (selectedUser.id || selectedUser.userId || selectedUser.uid || '').trim();
    const targetEmail = (selectedUser.email || '').toLowerCase().trim();

    let rawOrdersList = [];
    let profileAssetsList = [];
    let subcollectionLockerList = [];

    // Helper to merge and unify orders and locker assets in real-time
    const syncUnifiedUserRecords = () => {
      const itemsMap = new Map();

      // 1. Process all matching orders
      rawOrdersList.forEach((order) => {
        const key = order.productId || order.id;
        itemsMap.set(key, {
          ...order,
          source: 'order'
        });
      });

      // 2. Process direct subcollection locker docs (users/{uid}/locker and users/{uid}/purchases)
      subcollectionLockerList.forEach((asset) => {
        const key = asset.productId || asset.id;
        if (itemsMap.has(key)) {
          // Merge download link if missing
          const existing = itemsMap.get(key);
          if (!existing.downloadUrl && asset.downloadUrl) {
            existing.downloadUrl = asset.downloadUrl;
          }
        } else {
          itemsMap.set(key, {
            id: asset.id || key,
            orderId: asset.orderId || '',
            productId: key,
            productTitle: asset.productTitle || asset.title || 'Direct Locker Asset',
            category: asset.category || 'Digital Locker',
            amount: asset.amount || asset.price || asset.priceBdt || 0,
            amountBDT: asset.amount || asset.price || asset.priceBdt || 0,
            paymentMethod: asset.paymentMethod || 'Instant Vault / Direct Locker',
            trxId: asset.trxId || asset.licenseKey || 'DIRECT-ACCESS',
            status: asset.status || 'Approved',
            statusDisplay: asset.status || 'Approved',
            senderNumber: asset.senderNumber || '',
            createdAt: asset.createdAt || asset.purchaseDate || asset.unlockedAt || selectedUser.createdAt || new Date().toISOString(),
            downloadUrl: asset.downloadUrl || asset.instantDownloadLink || asset.driveUrl || null,
            source: 'subcollection'
          });
        }
      });

      // 3. Process direct profile purchasedProducts / unlockedProducts arrays
      profileAssetsList.forEach((asset, idx) => {
        const key = asset.productId || asset.id || (typeof asset === 'string' ? asset : `item_${idx}`);
        if (itemsMap.has(key)) {
          const existing = itemsMap.get(key);
          if (!existing.downloadUrl && (asset.downloadUrl || asset.driveUrl)) {
            existing.downloadUrl = asset.downloadUrl || asset.driveUrl;
          }
        } else {
          itemsMap.set(key, {
            id: asset.id || key,
            orderId: asset.orderId || '',
            productId: key,
            productTitle: asset.title || asset.productTitle || asset.name || (typeof asset === 'string' ? `Asset ${asset}` : 'Direct Locker Item'),
            category: asset.category || 'Digital Locker',
            amount: asset.priceBdt || asset.price || 0,
            amountBDT: asset.priceBdt || asset.price || 0,
            paymentMethod: asset.paymentMethod || 'Direct Locker',
            trxId: asset.licenseKey || 'DIRECT-ACCESS',
            status: 'Approved',
            statusDisplay: 'Approved',
            senderNumber: '',
            createdAt: asset.purchaseDate || asset.unlockedAt || selectedUser.createdAt || new Date().toISOString(),
            downloadUrl: asset.downloadUrl || asset.driveUrl || asset.instantDownloadLink || null,
            source: 'profile'
          });
        }
      });

      const unifiedList = Array.from(itemsMap.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      setUserOrders(unifiedList);
      setLoadingOrders(false);
    };

    const unsubscribers = [];

    // Listener A: Orders collection
    try {
      const ordersCollection = collection(db, 'orders');
      const unsubscribeOrders = onSnapshot(ordersCollection, (snapshot) => {
        const list = [];

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const orderEmail = (data.customerEmail || data.userEmail || data.email || '').toLowerCase().trim();
          const orderUid = (data.userId || data.uid || data.customerId || '').trim();

          // Match by user UID or user Email
          const isUserMatch = 
            (targetUid && orderUid === targetUid) || 
            (targetEmail && orderEmail === targetEmail);

          if (isUserMatch) {
            const rawAmount = String(data.amountBDT ?? data.amount ?? data.priceBDT ?? data.price ?? 0).replace(/[^0-9.]/g, '');
            const parsedAmount = parseFloat(rawAmount) || 0;
            const status = data.status || data.statusDisplay || 'Pending';

            list.push({
              id: docSnap.id,
              orderId: docSnap.id,
              productId: data.productId || '',
              productTitle: data.productTitle || data.title || 'Digital Asset Bundle',
              category: data.category || 'Digital Asset',
              amount: parsedAmount,
              amountBDT: data.amountBDT || parsedAmount,
              amountUSD: data.amountUSD || 0,
              paymentMethod: data.paymentMethod || data.method || 'Manual',
              trxId: data.trxId || data.transactionId || 'Direct',
              status: status,
              statusDisplay: status,
              senderNumber: data.senderNumber || data.userPhone || data.phone || '',
              createdAt: data.createdAt || (data.timestamp ? new Date(data.timestamp.seconds * 1000).toISOString() : new Date().toISOString()),
              downloadUrl: data.downloadUrl || data.instantDownloadLink || data.driveUrl || null
            });
          }
        });

        rawOrdersList = list;
        syncUnifiedUserRecords();
      }, (err) => {
        console.warn("Realtime user orders listener error:", err);
        setLoadingOrders(false);
      });
      unsubscribers.push(unsubscribeOrders);
    } catch (e) {
      console.warn("Orders listener setup error:", e);
    }

    // Listener B: User Document in users/{targetUid} for direct locker items
    if (targetUid) {
      try {
        const userDocRef = doc(db, 'users', targetUid);
        const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const uData = docSnap.data() || {};
            const purchases = Array.isArray(uData.purchasedProducts) ? uData.purchasedProducts : [];
            const unlockedP = Array.isArray(uData.unlockedProducts) ? uData.unlockedProducts : [];
            const unlockedA = Array.isArray(uData.unlockedAssets) ? uData.unlockedAssets : [];

            const combinedArrays = [...purchases];
            unlockedP.forEach(id => {
              if (typeof id === 'string' && !combinedArrays.some(p => p.id === id || p.productId === id)) {
                combinedArrays.push({ id, productId: id, title: `Product ${id}` });
              }
            });
            unlockedA.forEach(id => {
              if (typeof id === 'string' && !combinedArrays.some(p => p.id === id || p.productId === id)) {
                combinedArrays.push({ id, productId: id, title: `Asset ${id}` });
              }
            });

            profileAssetsList = combinedArrays;
          } else {
            profileAssetsList = [];
          }
          syncUnifiedUserRecords();
        }, (err) => {
          console.warn("User doc realtime sync error:", err);
        });
        unsubscribers.push(unsubscribeUser);
      } catch (e) {
        console.warn("User listener setup error:", e);
      }

      // Listener C: Subcollections users/{targetUid}/purchases and users/{targetUid}/locker
      try {
        const purchasesSubRef = collection(db, 'users', targetUid, 'purchases');
        const unsubPurchasesSub = onSnapshot(purchasesSubRef, (snapshot) => {
          subcollectionLockerList = snapshot.docs.map(d => ({
            id: d.id,
            productId: d.data().productId || d.id,
            ...d.data()
          }));
          syncUnifiedUserRecords();
        }, () => {});
        unsubscribers.push(unsubPurchasesSub);
      } catch {}
    }

    // Cleanup & Unsubscribe all listeners when closing inspector or switching users
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [showDetailModal, selectedUser]);

  // Open User Inspector
  const handleInspectUser = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  // Close User Inspector
  const handleCloseInspector = () => {
    setShowDetailModal(false);
    setSelectedUser(null);
    setUserOrders([]);
  };

  // 3. Toggle User Block Status (Prompt)
  const handleToggleBlock = (user) => {
    const isCurrentlyBlocked = user.status === 'blocked' || !!user.isBlocked || user.status === 'Blocked';
    const newStatus = isCurrentlyBlocked ? 'Active' : 'Blocked';
    setUserToBlock({ user, newStatus });
  };

  // Execute Toggle Block
  const executeToggleBlock = async () => {
    if (!userToBlock) return;
    const { user, newStatus } = userToBlock;
    const targetId = user.id || user.uid || user.userId;
    setActionLoadingId(targetId);
    
    // Optimistic close
    setUserToBlock(null);

    try {
      const updateData = {
        status: newStatus,
        isBlocked: newStatus === 'Blocked',
        updatedAt: new Date().toISOString()
      };
      
      try {
        await updateDoc(doc(db, 'users', targetId), updateData);
      } catch (err) {
        await setDoc(doc(db, 'users', targetId), updateData, { merge: true });
      }

      showToast(`User ${user.email || user.name || 'account'} is now ${newStatus}`, 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error updating user status:", err);
      showToast('Error updating status: ' + err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 4. Toggle User Role (Admin / User)
  const handleToggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const targetId = user.id || user.userId;
    setActionLoadingId(targetId);

    try {
      const updateData = {
        role: newRole,
        updatedAt: new Date().toISOString()
      };
      try {
        await updateDoc(doc(db, 'users', targetId), updateData);
      } catch (err) {
        await setDoc(doc(db, 'users', targetId), updateData, { merge: true });
      }

      showToast(`User role updated to ${newRole.toUpperCase()}`, 'success');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error updating user role:", err);
      showToast('Error updating role: ' + err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // 5. Delete User Document from Firestore
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const targetId = userToDelete.id || userToDelete.userId;
    setIsDeleting(true);

    try {
      await deleteDoc(doc(db, 'users', targetId));
      
      // Cleanup local cache if matching
      try {
        localStorage.removeItem(`fm_purchased_products_${targetId}`);
      } catch {}

      showToast(`User account ${userToDelete.email} permanently deleted`, 'success');
      setUserToDelete(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast('Error deleting user: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // 6. Revoke User Product Access & Delete Order with Atomic Firestore Batch
  const executeRevokeUserProductAccess = async (orderId, productId, userId) => {
    const cleanOrderId = String(orderId || '').trim();
    const cleanProductId = String(productId || cleanOrderId).trim();
    const targetUserId = String(userId || selectedUser?.id || selectedUser?.userId || selectedUser?.uid || '').trim();
    const targetEmail = String(selectedUser?.email || '').trim().toLowerCase();
    const loadingKey = cleanOrderId || cleanProductId;

    setDeletingOrderId(loadingKey);

    try {
      const batch = writeBatch(db);

      // 1. Delete specific order document if cleanOrderId exists
      if (cleanOrderId && cleanOrderId !== 'undefined') {
        const orderRef = doc(db, "orders", cleanOrderId);
        batch.delete(orderRef);
      }

      // 2. Query any additional orders matching this user & product
      if (cleanProductId) {
        try {
          const ordersSnap = await getDocs(collection(db, 'orders'));
          ordersSnap.docs.forEach(d => {
            const data = d.data();
            const oUid = (data.userId || data.uid || data.customerId || '').trim();
            const oEmail = (data.customerEmail || data.userEmail || data.email || '').trim().toLowerCase();
            const oProdId = String(data.productId || '').trim();

            const isUserMatch = (targetUserId && oUid === targetUserId) || (targetEmail && oEmail === targetEmail);
            const isProdMatch = oProdId === cleanProductId || d.id === cleanProductId || d.id === cleanOrderId;

            if (isUserMatch && isProdMatch && d.id !== cleanOrderId) {
              batch.delete(d.ref);
            }
          });
        } catch (e) {
          console.warn("Matching orders scan error:", e);
        }
      }

      // 3. Remove product from user's locker / unlocked array in Firestore
      if (targetUserId) {
        const userRef = doc(db, "users", targetUserId);
        
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const uData = userSnap.data() || {};
            const purchases = Array.isArray(uData.purchasedProducts) ? uData.purchasedProducts : [];
            const updatedPurchases = purchases.filter(p => {
              const pId = String(p.id || '').trim();
              const pProdId = String(p.productData?.id || p.productId || '').trim();
              return pId !== cleanProductId && pId !== cleanOrderId && (!cleanProductId || pProdId !== cleanProductId);
            });
            const newCount = Math.max(0, updatedPurchases.length);

            batch.update(userRef, {
              purchasedProducts: updatedPurchases,
              unlockedProducts: arrayRemove(cleanProductId, cleanOrderId),
              unlockedAssets: arrayRemove(cleanProductId, cleanOrderId),
              purchasedAssets: arrayRemove(cleanProductId, cleanOrderId),
              lockerCount: newCount,
              lockerAssetsCount: newCount,
              updatedAt: new Date().toISOString()
            });
          } else {
            batch.set(userRef, {
              unlockedProducts: arrayRemove(cleanProductId, cleanOrderId),
              unlockedAssets: arrayRemove(cleanProductId, cleanOrderId),
              purchasedAssets: arrayRemove(cleanProductId, cleanOrderId),
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        } catch {
          batch.set(userRef, {
            unlockedProducts: arrayRemove(cleanProductId, cleanOrderId),
            unlockedAssets: arrayRemove(cleanProductId, cleanOrderId),
            purchasedAssets: arrayRemove(cleanProductId, cleanOrderId),
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }

        // 4. Delete from subcollections (users/{userId}/locker and users/{userId}/purchases)
        if (cleanProductId) {
          batch.delete(doc(db, `users/${targetUserId}/locker`, cleanProductId));
          batch.delete(doc(db, `users/${targetUserId}/purchases`, cleanProductId));
        }
        if (cleanOrderId && cleanOrderId !== cleanProductId && cleanOrderId !== 'undefined') {
          batch.delete(doc(db, `users/${targetUserId}/locker`, cleanOrderId));
          batch.delete(doc(db, `users/${targetUserId}/purchases`, cleanOrderId));
        }
      }

      await batch.commit();

      // 5. Update local caches and broadcast locker change
      try {
        if (targetUserId) {
          localStorage.removeItem(`fm_purchased_products_${targetUserId}`);
          const currentUid = auth.currentUser?.uid;
          if (currentUid === targetUserId) {
            const currentPurchasesStr = localStorage.getItem('fm_purchased_products');
            if (currentPurchasesStr) {
              const currentList = JSON.parse(currentPurchasesStr);
              const filtered = currentList.filter(p => p.id !== cleanProductId && p.id !== cleanOrderId);
              localStorage.setItem('fm_purchased_products', JSON.stringify(filtered));
            }
          }
        }
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('filemarket:locker-change', { 
          detail: { orderId: cleanOrderId, userId: targetUserId, productId: cleanProductId } 
        }));
      } catch {}

      // Update selectedUser's cached purchasedProducts in modal state
      if (selectedUser && selectedUser.purchasedProducts && Array.isArray(selectedUser.purchasedProducts)) {
        const updatedPurchases = selectedUser.purchasedProducts.filter(
          (p) => p.id !== cleanOrderId && p.id !== cleanProductId && p.productId !== cleanProductId
        );
        setSelectedUser((prev) => prev ? { 
          ...prev, 
          purchasedProducts: updatedPurchases,
          lockerCount: updatedPurchases.length,
          lockerAssetsCount: updatedPurchases.length
        } : null);
      }

      showToast("Product access revoked and record deleted successfully from live user.", "success");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error revoking access:", err);
      showToast("Failed to delete record: " + (err?.message || 'Unknown error'), "error");
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handlePromptDeleteOrder = (orderId, productId, userId, title) => {
    const cleanOrderId = String(orderId || '').trim();
    const cleanProductId = String(productId || cleanOrderId).trim();
    const targetUserId = String(userId || selectedUser?.id || selectedUser?.userId || selectedUser?.uid || '').trim();
    const productTitle = title || 'Product Bundle';

    setOrderToDelete({
      orderId: cleanOrderId,
      productId: cleanProductId,
      userId: targetUserId,
      title: productTitle
    });
  };

  // Backward-compatible alias
  const handleDeleteUserOrder = (orderId) => {
    const targetOrder = userOrders.find(o => o.id === orderId || o.orderId === orderId);
    const prodId = targetOrder?.productId || orderId;
    const uId = targetOrder?.userId || selectedUser?.id || selectedUser?.userId || selectedUser?.uid || '';
    const title = targetOrder?.productTitle || targetOrder?.title || 'Product Asset';
    handlePromptDeleteOrder(orderId, prodId, uId, title);
  };

  // Delegated event listener on userOrderRecordsList container for resilient delete handling
  useEffect(() => {
    if (!showDetailModal) return;

    const handleContainerClick = (e) => {
      const target = e.target;
      if (!target) return;

      const deleteBtn = target.closest('.delete-order-record-btn, .delete-order-btn');
      if (!deleteBtn) return;

      const orderId = deleteBtn.dataset.orderId || deleteBtn.getAttribute('data-order-id') || '';
      const productId = deleteBtn.dataset.productId || deleteBtn.getAttribute('data-product-id') || '';
      const userId = deleteBtn.dataset.userId || deleteBtn.getAttribute('data-user-id') || selectedUser?.id || selectedUser?.userId || selectedUser?.uid || '';
      const title = deleteBtn.dataset.productTitle || deleteBtn.getAttribute('data-product-title') || 'Product Bundle';

      handlePromptDeleteOrder(orderId, productId, userId, title);
    };

    const container = document.getElementById('userOrderRecordsList');
    if (container) {
      container.addEventListener('click', handleContainerClick);
      return () => {
        container.removeEventListener('click', handleContainerClick);
      };
    }
  }, [showDetailModal, selectedUser, userOrders]);

  // Search and filter logic
  const filteredUsers = users.filter(u => {
    const q = searchTerm.toLowerCase();
    const name = (u.name || u.fullName || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = (u.phone || '').toLowerCase();
    const id = (u.id || u.userId || '').toLowerCase();
    return name.includes(q) || email.includes(q) || phone.includes(q) || id.includes(q);
  });

  // Calculate order stats for selected user in modal
  // "Total Spent": Dynamically calculate sum(order.amount) only for approved/completed orders
  const totalSpent = userOrders
    .filter(o => {
      const s = (o.status || '').toLowerCase();
      return s === 'approved' || s === 'completed' || s === 'success';
    })
    .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  // "Locker Assets": Count unique approved digital products matching Cloud Vault
  const lockerAssetsCount = (() => {
    const uniqueAssets = new Set();
    userOrders.forEach(o => {
      const s = (o.status || '').toLowerCase();
      if (s === 'approved' || s === 'completed' || s === 'success') {
        const key = o.productId || o.productTitle || o.id;
        if (key) uniqueAssets.add(key);
      }
    });

    if (selectedUser?.purchasedProducts && Array.isArray(selectedUser.purchasedProducts)) {
      selectedUser.purchasedProducts.forEach((p) => {
        const key = p.id || p.productId || p.title;
        if (key) uniqueAssets.add(key);
      });
    }

    return uniqueAssets.size;
  })();

  return (
    <div className="space-y-6 text-slate-100 p-2 sm:p-4 max-w-7xl mx-auto">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-bold ${
            toastMessage.type === 'error' 
              ? 'bg-rose-950 text-rose-200 border-rose-800' 
              : 'bg-emerald-950 text-emerald-200 border-emerald-800'
          }`}>
            {toastMessage.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header & Master Admin Access Settings */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-500" />
            User Management & Access Control
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage registered accounts, inspect order history, toggle block state, and manage roles.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Name, Email, Phone, UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none transition shadow-sm"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Master Admin Configuration Card */}
      <AdminAccessSettings onUpdated={onRefresh} />

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-extrabold">
              <tr>
                <th className="py-3.5 px-4">User Details</th>
                <th className="py-3.5 px-4">Phone / Address</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                      <span>Loading real-time user database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 text-xs">
                    No registered user accounts match your search query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const uid = user.id || user.userId;
                  const userName = user.name || user.fullName || 'Registered User';
                  const userEmail = user.email || 'No Email';
                  const userPhone = user.phone || '';
                  const userAddress = user.deliveryAddress || user.address || '';
                  const isAdmin = user.role === 'admin';
                  const isBlocked = user.status === 'blocked' || !!user.isBlocked;
                  const isBusy = actionLoadingId === uid;

                  return (
                    <tr key={uid} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-emerald-600 dark:text-emerald-400 text-xs shrink-0 overflow-hidden">
                            {user.avatar || user.picture ? (
                              <img src={user.avatar || user.picture} alt={userName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              userName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5">
                              <span>{userName}</span>
                              {user.authProvider === 'google.com' && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                                  G
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px] sm:max-w-xs">{userEmail}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Address */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1 text-xs">
                          {userPhone ? (
                            <><Phone className="w-3 h-3 text-emerald-500 shrink-0" /> <span>{userPhone}</span></>
                          ) : (
                            <span className="text-slate-400 italic">No Phone</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px] flex items-center gap-1 mt-0.5">
                          {userAddress ? (
                            <><MapPin className="w-3 h-3 text-slate-400 shrink-0" /> <span>{userAddress}</span></>
                          ) : (
                            <span className="text-slate-400 italic">No Address</span>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          isAdmin 
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {isAdmin ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                          {isAdmin ? 'ADMIN' : 'USER'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          isBlocked 
                            ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30' 
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isBlocked ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          {isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Details Button */}
                          <button
                            onClick={() => handleInspectUser(user)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Inspect User Details & Purchases"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>

                          {/* Role Toggle Button */}
                          <button
                            onClick={() => handleToggleRole(user)}
                            disabled={isBusy}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                              isAdmin
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            }`}
                            title={isAdmin ? 'Revoke Admin Permissions' : 'Promote to Admin'}
                          >
                            {isAdmin ? 'Revoke' : 'Make Admin'}
                          </button>

                          {/* Block / Unblock Button */}
                          <button
                            onClick={() => handleToggleBlock(user)}
                            disabled={isBusy}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                              isBlocked
                                ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/30'
                            }`}
                            title={isBlocked ? 'Unblock User Account' : 'Block User from Purchases'}
                          >
                            {isBlocked ? 'Unblock' : 'Block'}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setUserToDelete(user)}
                            className="p-1.5 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/30 transition-colors cursor-pointer"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details & Purchases Inspector Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/60 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                  {selectedUser.avatar || selectedUser.picture ? (
                    <img src={selectedUser.avatar || selectedUser.picture} alt="Avatar" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Users className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                    {selectedUser.name || selectedUser.fullName || 'User Profile'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedUser.email}</p>
                </div>
              </div>
              <button 
                onClick={handleCloseInspector}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Profile Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-20">Full Name:</span> 
                  <strong className="text-white font-semibold truncate">{selectedUser.name || selectedUser.fullName || 'N/A'}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-20">Email:</span> 
                  <strong className="text-white font-mono font-semibold truncate">{selectedUser.email || 'N/A'}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-20">Phone:</span> 
                  <strong className="text-white font-semibold">{selectedUser.phone || 'N/A'}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-20">Role:</span> 
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    selectedUser.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {selectedUser.role || 'user'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-20">Status:</span> 
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    (selectedUser.status === 'blocked' || selectedUser.isBlocked) ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {(selectedUser.status === 'blocked' || selectedUser.isBlocked) ? 'Blocked' : 'Active'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-20">Joined:</span> 
                  <span className="text-slate-300">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
                <div className="sm:col-span-2 flex items-start gap-2 pt-1 border-t border-slate-800/60">
                  <span className="text-slate-500 w-20 shrink-0">Address:</span> 
                  <span className="text-slate-300">{selectedUser.deliveryAddress || selectedUser.address || 'No physical delivery address recorded'}</span>
                </div>
                <div className="sm:col-span-2 flex items-start gap-2 pt-1 border-t border-slate-800/60">
                  <span className="text-slate-500 w-20 shrink-0">User UID:</span> 
                  <span className="text-slate-400 font-mono text-[10px] truncate">{selectedUser.id || selectedUser.userId || selectedUser.uid}</span>
                </div>
              </div>

              {/* Order Stats Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</div>
                  <div className="text-lg font-black text-white mt-0.5">{userOrders.length}</div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Spent</div>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">৳{totalSpent.toLocaleString()}</div>
                </div>
                <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-center col-span-2 sm:col-span-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Locker Assets</div>
                  <div className="text-lg font-black text-teal-400 mt-0.5">
                    {lockerAssetsCount}
                  </div>
                </div>
              </div>

              {/* Purchased Products & Orders List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-emerald-400" />
                    Purchased Products & Order Records ({userOrders.length})
                  </h4>
                </div>

                {loadingOrders ? (
                  <div className="text-center py-8 text-slate-500 text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                    <span>Loading real-time order history...</span>
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-8 bg-slate-950/40 rounded-2xl border border-slate-800/80 text-slate-500 text-xs">
                    This user has not made any purchases or submitted any orders yet.
                  </div>
                ) : (
                  <div id="userOrderRecordsList" className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {userOrders.map((order, idx) => {
                      const isApproved = (order.status || '').toLowerCase() === 'approved' || (order.status || '').toLowerCase() === 'completed';
                      const isRejected = (order.status || '').toLowerCase() === 'rejected';
                      const orderId = order.orderId || order.id || '';
                      const productId = order.productId || order.id || '';
                      const targetUserId = selectedUser?.id || selectedUser?.userId || selectedUser?.uid || order.userId || '';

                      return (
                        <div key={order.id || idx} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-bold text-white truncate text-xs sm:text-sm">
                                {order.productTitle || order.title || 'Product Bundle'}
                              </h5>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-400 shrink-0">
                                {order.category || 'Asset'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                isApproved
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : isRejected
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}>
                                {order.status || 'Pending'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                              <span>TrxID: <strong className="text-slate-200 font-mono">{order.trxId || 'N/A'}</strong></span>
                              <span>Method: <strong className="text-emerald-400">{order.paymentMethod || 'Manual'}</strong></span>
                              {order.senderNumber && <span>Sender: <strong className="text-slate-300">{order.senderNumber}</strong></span>}
                              <span>Date: {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3 pt-0.5">
                              <div className="text-emerald-400 font-extrabold text-sm">
                                ৳{(order.amount || 0).toLocaleString()}
                              </div>
                              {order.downloadUrl && (
                                <a
                                  href={order.downloadUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-400 hover:text-teal-300 underline"
                                >
                                  <Download className="w-3 h-3" /> Download Link
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Delete Purchase Button */}
                          <button
                            type="button"
                            data-order-id={orderId}
                            data-product-id={productId}
                            data-user-id={targetUserId}
                            data-product-title={order.productTitle || order.title || 'Product Bundle'}
                            disabled={deletingOrderId === (order.id || order.orderId || order.productId)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePromptDeleteOrder(orderId, productId, targetUserId, order.productTitle || order.title || 'Product Bundle');
                            }}
                            className="delete-order-record-btn delete-order-btn p-2 sm:px-3 sm:py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer disabled:opacity-50"
                            title="Revoke access and delete this order record"
                          >
                            {deletingOrderId === (order.id || order.orderId || order.productId) ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin pointer-events-none" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                            )}
                            <span className="hidden sm:inline pointer-events-none">
                              {deletingOrderId === (order.id || order.orderId || order.productId) ? 'Deleting...' : 'Delete'}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 rounded-b-3xl flex justify-end gap-3">
              <button 
                onClick={handleCloseInspector}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Order Confirmation Modal (100% In-App working, bypasses browser iframe confirm restrictions) */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl w-full max-w-sm p-6 space-y-4 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Delete Record & Revoke Access?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete this order and revoke live locker access for <strong className="text-white">{orderToDelete.title}</strong>?
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setOrderToDelete(null)}
                disabled={Boolean(deletingOrderId)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={async () => {
                  const target = orderToDelete;
                  setOrderToDelete(null);
                  if (target) {
                    await executeRevokeUserProductAccess(target.orderId, target.productId, target.userId);
                  }
                }}
                disabled={Boolean(deletingOrderId)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-red-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {deletingOrderId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Yes, Revoke & Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl w-full max-w-sm p-6 space-y-4 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Permanently Delete User?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">{userToDelete.email || userToDelete.name}</strong> from Firestore? All associated credentials and records will be removed.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button 
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Yes, Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block/Unblock User Confirmation Modal */}
      {userToBlock && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-sm p-6 space-y-4 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto border ${userToBlock.newStatus === 'Blocked' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'}`}>
              {userToBlock.newStatus === 'Blocked' ? <UserX className="w-6 h-6" /> : <UserCheck className="w-6 h-6" />}
            </div>
            <h3 className="text-base font-bold text-white">
              {userToBlock.newStatus === 'Blocked' ? 'Block User Account?' : 'Unblock User Account?'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to change the status of <strong className="text-white">{userToBlock.user.email || userToBlock.user.name}</strong> to <strong className={userToBlock.newStatus === 'Blocked' ? 'text-rose-400' : 'text-emerald-400'}>{userToBlock.newStatus}</strong>?
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setUserToBlock(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={executeToggleBlock}
                className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl transition shadow-lg flex items-center gap-1.5 cursor-pointer ${
                  userToBlock.newStatus === 'Blocked' 
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20' 
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                }`}
              >
                {userToBlock.newStatus === 'Blocked' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                <span>Yes, {userToBlock.newStatus}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
