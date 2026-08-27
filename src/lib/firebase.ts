import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  reload,
  User as FirebaseUser,
  updatePassword,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocFromServer,
  updateDoc,
  deleteDoc,
  writeBatch,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Use browserLocalPersistence (localStorage) instead of indexedDB to avoid "Database is closing/hidden" errors in iframes
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: browserLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
} catch (error: any) {
  if (error.code === 'auth/already-initialized') {
    authInstance = getAuth(app);
  } else {
    throw error;
  }
}
export const auth = authInstance;

let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, { 
    experimentalAutoDetectLongPolling: true 
  }, firebaseConfig.firestoreDatabaseId);
} catch (error: any) {
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}
export const db = firestoreDb;

// Silence non-fatal offline retry warnings in iframe/sandboxed environments
setLogLevel('silent');
export const googleProvider = new GoogleAuthProvider();
// CRITICAL: Force Google to ALWAYS show the account picker screen
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const handleGoogleLogin = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("Successfully logged in as:", user.email);
    return user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};

// Connection check according to Firebase skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    if (
      error?.code === 'unavailable' || 
      error?.message?.includes('offline') || 
      error?.message?.includes('Could not reach Cloud Firestore backend')
    ) {
      console.warn("Firestore status: operating in offline mode / temporary network re-connection.");
    }
  }
}
testConnection();

export interface PurchasedProductItem {
  id: string;
  title: string;
  category: string;
  image?: string;
  downloadUrl?: string;
  cloudDriveUrl?: string;
  driveUrl?: string;
  cloudAccessLink?: string;
  instantDownloadLink?: string;
  driveLink?: string;
  productData?: any;
  licenseKey: string;
  purchaseDate: string;
  priceBdt?: number;
  priceUsd?: number;
}

export interface UserProfileData {
  userId: string;
  uid?: string;
  fullName: string;
  name?: string;
  email: string;
  phone?: string;
  address?: string;
  fullAddress?: string;
  city?: string;
  zipCode?: string;
  deliveryAddress: string;
  createdAt: string;
  authProvider?: string;
  picture?: string;
  avatar?: string;
  purchasedProducts?: PurchasedProductItem[];
  savedProducts?: string[];
  recentInterests?: string[];
  recentTags?: string[];
  searchHistory?: string[];
  lastViewedProductId?: string;
  role?: string;
  status?: string;
  isBlocked?: boolean;
  updatedAt?: string;
}

// Graceful firestore initialization helper


export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanFirestoreData) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanFirestoreData(value);
    }
  }
  return cleaned as T;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Save or sync user profile in Firestore
export async function saveUserProfileToFirestore(profile: Partial<UserProfileData> & { userId?: string }): Promise<void> {
  const currentAuthUid = auth.currentUser?.uid;
  const effectiveUserId = currentAuthUid || profile.userId;
  if (!effectiveUserId) return;
  const path = `users/${effectiveUserId}`;

  try {
    let existing: UserProfileData | null = null;
    try {
      existing = await getUserProfileFromFirestore(effectiveUserId);
    } catch {}

    const updatedData: UserProfileData = {
      userId: effectiveUserId,
      fullName: profile.fullName || existing?.fullName || auth.currentUser?.displayName || 'User',
      name: profile.fullName || existing?.fullName || auth.currentUser?.displayName || 'User',
      email: profile.email || existing?.email || auth.currentUser?.email || '',
      phone: profile.phone !== undefined ? profile.phone : (existing?.phone || ''),
      address: profile.address !== undefined ? profile.address : (profile.deliveryAddress || existing?.address || existing?.deliveryAddress || ''),
      fullAddress: profile.address !== undefined ? profile.address : (profile.deliveryAddress || existing?.address || existing?.deliveryAddress || ''),
      deliveryAddress: profile.deliveryAddress !== undefined ? profile.deliveryAddress : (profile.address || existing?.deliveryAddress || 'Bangladesh'),
      city: profile.city !== undefined ? profile.city : (existing?.city || ''),
      zipCode: profile.zipCode !== undefined ? profile.zipCode : (existing?.zipCode || ''),
      role: existing?.role || profile.role || 'user',
      status: existing?.status || profile.status || 'active',
      isBlocked: existing?.isBlocked !== undefined ? existing.isBlocked : false,
      createdAt: existing?.createdAt || profile.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authProvider: profile.authProvider || existing?.authProvider || (currentAuthUid ? 'google.com' : 'password'),
      picture: profile.picture || profile.avatar || existing?.picture || existing?.avatar || auth.currentUser?.photoURL || '',
      avatar: profile.avatar || profile.picture || existing?.avatar || existing?.picture || auth.currentUser?.photoURL || '',
      purchasedProducts: profile.purchasedProducts || existing?.purchasedProducts || [],
      savedProducts: profile.savedProducts || existing?.savedProducts || []
    };

    await setDoc(doc(db, 'users', effectiveUserId), {
      uid: effectiveUserId,
      ...updatedData
    }, { merge: true });
  } catch (error) {
    console.warn("Firestore saveUserProfile warning:", error);
  }
}

// Fetch user profile from Firestore
export async function getUserProfileFromFirestore(userId?: string): Promise<UserProfileData | null> {
  const currentAuthUid = auth.currentUser?.uid;
  const effectiveUserId = currentAuthUid || userId;
  if (!effectiveUserId) return null;
  const path = `users/${effectiveUserId}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', effectiveUserId));
    if (docSnap.exists()) {
      return docSnap.data() as UserProfileData;
    }
    return null;
  } catch (error) {
    console.warn("Firestore getUserProfile warning:", error);
    return null;
  }
}

// Google One-Click Auto-Signup & Sync Flow
export async function syncGoogleUserWithFirestore(user: FirebaseUser): Promise<UserProfileData> {
  const userId = user.uid;
  const path = `users/${userId}`;
  
  try {
    const existing = await getUserProfileFromFirestore(userId);
    
    const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'Google User');
    const photo = user.photoURL || '';

    let profileData: UserProfileData;

    if (!existing) {
      // New User: Auto-create lifetime account
      profileData = {
        userId,
        fullName: displayName,
        email: user.email || '',
        avatar: photo,
        picture: photo,
        phone: '',
        deliveryAddress: 'Bangladesh',
        purchasedProducts: [],
        savedProducts: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        authProvider: 'google.com'
      };
      await setDoc(doc(db, 'users', userId), profileData);
    } else {
      // Existing User: Merge profile details, preserve phone, address, and purchase history
      profileData = {
        ...existing,
        userId,
        fullName: existing.fullName || displayName,
        email: existing.email || user.email || '',
        avatar: existing.avatar || existing.picture || photo,
        picture: existing.picture || existing.avatar || photo,
        phone: existing.phone || '',
        deliveryAddress: existing.deliveryAddress || 'Bangladesh',
        purchasedProducts: existing.purchasedProducts || [],
        updatedAt: new Date().toISOString(),
        authProvider: existing.authProvider || 'google.com'
      };
      await setDoc(doc(db, 'users', userId), profileData, { merge: true });
    }

    return profileData;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Append product to target user's lifetime purchasedProducts vault & purchases subcollection
export async function addPurchasedProductToUser(
  userId: string,
  productItem: PurchasedProductItem
): Promise<PurchasedProductItem[]> {
  const targetUserId = userId ? userId.trim() : '';
  if (!targetUserId) return [];
  const path = `users/${targetUserId}`;
  try {
    const profile = await getUserProfileFromFirestore(targetUserId);
    const currentPurchases = profile?.purchasedProducts || [];
    
    // Avoid duplicate entry if id already in purchases
    const alreadyExists = currentPurchases.some(p => p.id === productItem.id);
    const updatedPurchases = alreadyExists 
      ? currentPurchases.map(p => p.id === productItem.id ? { ...p, ...productItem } : p)
      : [productItem, ...currentPurchases];

    // 1. Update user profile document in Firestore
    await setDoc(doc(db, 'users', targetUserId), {
      userId: targetUserId,
      email: profile?.email || '',
      fullName: profile?.fullName || 'Valued Customer',
      purchasedProducts: updatedPurchases,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 2. Also write to purchases subcollection for resilient structured access
    try {
      const userPurchaseRef = doc(db, 'users', targetUserId, 'purchases', productItem.id);
      await setDoc(userPurchaseRef, {
        productId: productItem.id,
        productTitle: productItem.title,
        downloadUrl: productItem.downloadUrl || '',
        licenseKey: productItem.licenseKey || '',
        category: productItem.category || 'Digital Assets',
        image: productItem.image || '',
        unlockedAt: new Date().toISOString(),
        purchaseDate: productItem.purchaseDate || new Date().toISOString()
      }, { merge: true });
    } catch (subErr) {
      console.warn("Subcollection write warning:", subErr);
    }

    // 3. Update localStorage ONLY IF the target user is the currently logged-in client
    const currentAuthUid = auth.currentUser?.uid;
    if (currentAuthUid && currentAuthUid === targetUserId) {
      try {
        localStorage.setItem(`fm_purchased_products_${targetUserId}`, JSON.stringify(updatedPurchases));
        localStorage.setItem('fm_purchased_products', JSON.stringify(updatedPurchases));
      } catch {}
    }

    return updatedPurchases;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return [];
  }
}

// Revoke a purchased product from a user's lifetime vault & subcollections
export async function revokePurchasedProductFromUser(
  userId: string,
  productIdOrOrderId: string
): Promise<PurchasedProductItem[]> {
  const targetUserId = userId ? userId.trim() : '';
  const targetKey = productIdOrOrderId ? productIdOrOrderId.trim() : '';
  if (!targetUserId || !targetKey) return [];

  const path = `users/${targetUserId}`;
  try {
    const profile = await getUserProfileFromFirestore(targetUserId);
    const currentPurchases = profile?.purchasedProducts || [];

    const updatedPurchases = currentPurchases.filter(p => {
      const pId = String(p.id || '').trim();
      const pProdId = String(p.productData?.id || '').trim();
      return pId !== targetKey && (!targetKey || pProdId !== targetKey);
    });

    const newLockerCount = updatedPurchases.length;

    // 1. Update user profile document in Firestore
    await setDoc(doc(db, 'users', targetUserId), {
      purchasedProducts: updatedPurchases,
      lockerCount: newLockerCount,
      lockerAssetsCount: newLockerCount,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 2. Remove from purchases & locker subcollections if present
    try {
      await deleteDoc(doc(db, 'users', targetUserId, 'purchases', targetKey));
    } catch {}
    try {
      await deleteDoc(doc(db, 'users', targetUserId, 'locker', targetKey));
    } catch {}

    // 3. Update local cache if target is active user
    const currentAuthUid = auth.currentUser?.uid;
    if (currentAuthUid && currentAuthUid === targetUserId) {
      try {
        localStorage.setItem(`fm_purchased_products_${targetUserId}`, JSON.stringify(updatedPurchases));
        localStorage.setItem('fm_purchased_products', JSON.stringify(updatedPurchases));
      } catch {}
    }

    return updatedPurchases;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return [];
  }
}

// Fetch customer submitted orders strictly by user UID
export async function getUserOrders(userId?: string): Promise<any[]> {
  const currentAuthUid = auth.currentUser?.uid;
  const targetUid = userId || currentAuthUid;
  if (!targetUid) return [];

  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', targetUid)
    );
    const snap = await getDocs(ordersQuery);
    const userOrders = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    return userOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (err) {
    console.warn("Could not fetch user orders from Firestore:", err);
    return [];
  }
}

// Real-time listener for current user's orders strictly filtered by userId
export function subscribeUserOrders(userId: string, callback: (orders: any[]) => void): () => void {
  if (!userId) {
    callback([]);
    return () => {};
  }

  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', userId)
    );

    return onSnapshot(ordersQuery, (snapshot) => {
      const userOrders = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as any));

      userOrders.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      callback(userOrders);
    }, (err) => {
      console.warn("Real-time orders subscription error:", err);
    });
  } catch (err) {
    console.warn("Failed to attach user orders listener:", err);
    return () => {};
  }
}

// Fetch user's lifetime purchases
export async function getUserPurchasedProducts(userId?: string): Promise<PurchasedProductItem[]> {
  const currentAuthUid = auth.currentUser?.uid;
  const effectiveUserId = currentAuthUid || userId;
  if (!effectiveUserId) {
    const local = localStorage.getItem('fm_purchased_products');
    return local ? JSON.parse(local) : [];
  }
  try {
    const profile = await getUserProfileFromFirestore(effectiveUserId);
    const purchases = profile?.purchasedProducts || [];
    localStorage.setItem('fm_purchased_products', JSON.stringify(purchases));
    return purchases;
  } catch (error) {
    console.warn("Could not fetch user purchases from Firestore:", error);
    const local = localStorage.getItem('fm_purchased_products');
    return local ? JSON.parse(local) : [];
  }
}

// Send verification email to user
export async function triggerEmailVerification(user?: FirebaseUser | null): Promise<boolean> {
  const targetUser = user || auth.currentUser;
  if (!targetUser) return false;
  try {
    await sendEmailVerification(targetUser);
    return true;
  } catch (error) {
    console.warn("sendEmailVerification notice:", error);
    return false;
  }
}

// Trigger password reset email (Standard pure Firebase flow)
export async function triggerPasswordReset(email: string): Promise<boolean> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return true;
  } catch (error: any) {
    console.error('Password reset failed:', error);
    throw error;
  }
}

// Reload user to check fresh emailVerified status
export async function checkFreshEmailVerifiedStatus(): Promise<boolean> {
  if (!auth.currentUser) return false;
  try {
    await reload(auth.currentUser);
    return auth.currentUser.emailVerified;
  } catch (error) {
    console.warn("reload auth status notice:", error);
    return false;
  }
}

// Toggle saved product
export async function toggleSavedProduct(productId: string): Promise<{ saved: boolean, savedProducts: string[] }> {
  const currentAuthUid = auth.currentUser?.uid;
  if (!currentAuthUid) {
    throw new Error('User must be logged in to save products.');
  }

  const profile = await getUserProfileFromFirestore(currentAuthUid);
  
  let savedProducts = profile?.savedProducts || [];
  let isSaved = false;

  if (savedProducts.includes(productId)) {
    // Remove it
    savedProducts = savedProducts.filter(id => id !== productId);
    isSaved = false;
    await setDoc(doc(db, 'users', currentAuthUid), {
      savedProducts: arrayRemove(productId),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } else {
    // Add it
    savedProducts = [...savedProducts, productId];
    isSaved = true;
    await setDoc(doc(db, 'users', currentAuthUid), {
      savedProducts: arrayUnion(productId),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  return { saved: isSaved, savedProducts };
}

// Check which sign-in providers are associated with an email
export async function getSignInMethods(emailStr: string): Promise<string[]> {
  try {
    return await fetchSignInMethodsForEmail(auth, emailStr.trim());
  } catch (e) {
    console.warn("fetchSignInMethodsForEmail error:", e);
    return [];
  }
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  reload,
  fbSignOut,
  fbSignOut as signOut,
  onAuthStateChanged,
  updatePassword,
  fetchSignInMethodsForEmail
};
export type { FirebaseUser };
