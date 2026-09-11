import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs, getDocsFromServer } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, handleFirestoreError, prepareProductPayloadForFirestore, OperationType } from '../lib/firebase';
import { Product } from '../types';

export interface ProductContextType {
  products: Product[];
  loading: boolean;
  saveProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

/**
 * Universal Mobile-Safe Fetch with High-Entropy Anti-Cache Query Tokens and Strict Headers.
 * Completely disables intermediate mobile proxies, WebKit disk caches, and carrier gateways.
 */
export async function fetchWithAntiCache(inputUrl: string, init?: RequestInit): Promise<Response> {
  const urlObj = new URL(inputUrl, typeof window !== 'undefined' ? window.location.origin : 'https://filemarket.site');
  const highEntropyToken = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  urlObj.searchParams.set('_t', highEntropyToken);
  urlObj.searchParams.set('_v', '2026.1');

  const headers = new Headers(init?.headers || {});
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');

  return fetch(urlObj.toString(), {
    ...init,
    cache: 'no-store',
    headers,
  });
}

// Safe normalizer to parse product whether from Firestore doc, JSON, or object
export const sanitizeAndNormalizeProduct = (data: any, idFallback: string, isAdmin: boolean = false): Product | null => {
  if (!data || typeof data !== 'object') return null;
  const id = String(data.id || idFallback || '').trim();
  if (!id) return null;

  const title = String(data.title || '').trim();
  // Strictly filter out any hardcoded dummy/demo products
  if (/^demo\s*product\b/i.test(title) || /demo product [0-9]+/i.test(title)) {
    return null;
  }

  // Isolate sensitive download links for non-admin visitors
  let publicData = { ...data };
  if (!isAdmin) {
    const { downloadUrl, instantDownloadLink, driveUrl, driveLink, cloudDriveUrl, cloudAccessLink, ...safeFields } = publicData;
    publicData = safeFields;
  }

  return {
    ...publicData,
    id,
    title: title || 'Digital Asset',
    category: String(publicData.category || 'Digital Services').trim(),
    priceBDT: Number(publicData.priceBDT ?? publicData.salePrice ?? publicData.price ?? 499),
    priceUSD: publicData.priceUSD !== undefined && publicData.priceUSD !== null ? Number(publicData.priceUSD) : undefined,
    originalPriceBDT: publicData.originalPriceBDT ? Number(publicData.originalPriceBDT) : undefined,
    thumbnail: publicData.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    badge: publicData.badge || undefined,
    rating: typeof publicData.rating === 'number' ? publicData.rating : 4.9,
    reviewsCount: typeof publicData.reviewsCount === 'number' ? publicData.reviewsCount : 12,
    downloadsCount: typeof publicData.downloadsCount === 'number' ? publicData.downloadsCount : 100,
    tags: Array.isArray(publicData.tags) 
      ? publicData.tags 
      : (typeof publicData.tags === 'string' ? publicData.tags.split(',') : []),
    keywords: Array.isArray(publicData.keywords) 
      ? publicData.keywords 
      : (typeof publicData.keywords === 'string' ? publicData.keywords.split(',') : []),
    status: publicData.status || 'published'
  } as Product;
};

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const isInitialMount = useRef(true);

  useEffect(() => {
    let unsubProducts: (() => void) | null = null;
    let isMounted = true;

    const setupListener = (isAdmin: boolean) => {
      if (unsubProducts) {
        unsubProducts();
        unsubProducts = null;
      }

      const parseDocData = (docSnap: any): Product | null => {
        return sanitizeAndNormalizeProduct(docSnap.data(), docSnap.id, isAdmin);
      };

      // Real-time active listener with Firestore local memory cache fallback
      try {
        unsubProducts = onSnapshot(
          collection(db, 'products'),
          (snapshot) => {
            if (!isMounted) return;
            isInitialMount.current = false;
            const firestoreList: Product[] = [];
            snapshot.docs.forEach((d) => {
              const p = parseDocData(d);
              if (p) firestoreList.push(p);
            });
            setProducts(firestoreList);
            setLoading(false);
          },
          (error: any) => {
            console.warn('[Firestore] Realtime products listener warning:', error);
            if (isMounted) setLoading(false);
          }
        );
      } catch (listenerErr) {
        console.warn('[Firestore] Failed to attach snapshot listener:', listenerErr);
        if (isMounted) setLoading(false);
      }
    };

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      const masterAdminEmail = localStorage.getItem('fm_master_admin_email') || 'new144506@gmail.com';
      const currentEmail = user?.email?.toLowerCase().trim() || '';
      const isAdmin = Boolean(user && currentEmail === masterAdminEmail.toLowerCase().trim());
      setupListener(isAdmin);
    });

    return () => {
      isMounted = false;
      unsubAuth();
      if (unsubProducts) unsubProducts();
    };
  }, []);

  const saveProduct = useCallback(async (product: Product): Promise<void> => {
    const strId = String(product.id || '').trim() || `fm-${Date.now()}`;
    const cleanedProduct = prepareProductPayloadForFirestore({ ...product, id: strId });

    // 1. Optimistic UI update across all active local components immediately
    setProducts((prev) => {
      const idx = prev.findIndex((p) => String(p.id) === strId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...product, id: strId };
        return next;
      }
      return [{ ...product, id: strId }, ...prev];
    });

    // 2. Direct Cloud Database CRUD (Writes to Firebase Firestore - pushes to all devices via onSnapshot)
    await setDoc(doc(db, 'products', strId), cleanedProduct, { merge: true });
  }, []);

  const deleteProduct = useCallback(async (productId: string): Promise<void> => {
    const strId = String(productId || '').trim();
    if (!strId) return;

    // 1. Optimistic UI update
    setProducts((prev) => prev.filter((p) => String(p.id) !== strId));

    // 2. Direct Cloud Database CRUD (Deletes document permanently from Firebase Firestore)
    await deleteDoc(doc(db, 'products', strId));
  }, []);

  const refreshProducts = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const serverSnap = await getDocsFromServer(collection(db, 'products'));
      const freshList: Product[] = [];
      if (serverSnap) {
        serverSnap.docs.forEach((d) => {
          const p = sanitizeAndNormalizeProduct(d.data(), d.id, false);
          if (p) freshList.push(p);
        });
      }
      setProducts(freshList);
    } catch {
      try {
        const fallbackSnap = await getDocs(collection(db, 'products'));
        const list: Product[] = [];
        if (fallbackSnap) {
          fallbackSnap.docs.forEach((d) => {
            const p = sanitizeAndNormalizeProduct(d.data(), d.id, false);
            if (p) list.push(p);
          });
        }
        setProducts(list);
      } catch (err) {
        console.warn('[Firestore] Product refresh failed:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Mobile Lifecycle & Cache Invalidation: Re-validate when mobile browser wakes up or resumes from BFCache
  useEffect(() => {
    const handleMobileResume = (e?: any) => {
      if (!e || e.persisted || document.visibilityState === 'visible') {
        refreshProducts();
      }
    };

    window.addEventListener('pageshow', handleMobileResume);
    document.addEventListener('visibilitychange', handleMobileResume);
    window.addEventListener('online', handleMobileResume);

    return () => {
      window.removeEventListener('pageshow', handleMobileResume);
      document.removeEventListener('visibilitychange', handleMobileResume);
      window.removeEventListener('online', handleMobileResume);
    };
  }, [refreshProducts]);

  const getProductById = useCallback(
    (id: string) => {
      return products.find((p) => String(p.id) === String(id));
    },
    [products]
  );

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        saveProduct,
        deleteProduct,
        getProductById,
        refreshProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

