import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc, getDocs, getDocsFromServer } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, handleFirestoreError, prepareProductPayloadForFirestore, OperationType } from '../lib/firebase';
import { Product } from '../types';
import { PRODUCTS_DATA } from '../data/products';

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

// Helper to retrieve deleted product IDs from storage
const getDeletedProductIds = (): Set<string> => {
  try {
    const deletedStr = localStorage.getItem('fm_deleted_product_ids') || '[]';
    const arr: string[] = JSON.parse(deletedStr);
    return new Set(arr.map(String));
  } catch {
    return new Set();
  }
};

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

// Merges Firestore / custom products with the baseline catalog (excluding deleted items)
export const mergeProductsWithCatalog = (
  customOrRemote: Product[], 
  isAdmin: boolean = false
): Product[] => {
  const deletedIds = getDeletedProductIds();
  const map = new Map<string, Product>();

  // 1. First add baseline PRODUCTS_DATA (excluding any explicitly deleted items)
  PRODUCTS_DATA.forEach((p) => {
    const strId = String(p.id);
    if (!deletedIds.has(strId)) {
      const normalized = sanitizeAndNormalizeProduct(p, strId, isAdmin);
      if (normalized) map.set(strId, normalized);
    }
  });

  // 2. Overlay remote Firestore / custom products on top
  if (Array.isArray(customOrRemote)) {
    customOrRemote.forEach((raw) => {
      if (!raw) return;
      const strId = String(raw.id || '');
      if (strId && !deletedIds.has(strId)) {
        const normalized = sanitizeAndNormalizeProduct(raw, strId, isAdmin);
        if (normalized) map.set(strId, normalized);
      }
    });
  }

  const merged = Array.from(map.values());

  // Safe cache persistence for offline, network downtime, or quota limits
  try {
    localStorage.setItem('fm_products', JSON.stringify(merged));
  } catch {}

  return merged;
};

// Initial state provider: tries localStorage cache first, then falls back to PRODUCTS_DATA
const getInitialProducts = (isAdmin: boolean = false): Product[] => {
  try {
    const cached = localStorage.getItem('fm_products');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return mergeProductsWithCatalog(parsed, isAdmin);
      }
    }
  } catch {}
  return mergeProductsWithCatalog([], isAdmin);
};

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => getInitialProducts(false));
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let unsubProducts: (() => void) | null = null;
    let isMounted = true;

    const setupListener = async (isAdmin: boolean) => {
      if (unsubProducts) unsubProducts();

      const parseDocData = (docSnap: any): Product | null => {
        return sanitizeAndNormalizeProduct(docSnap.data(), docSnap.id, isAdmin);
      };

      // 1. Initial direct-from-server query with graceful fallback
      try {
        const serverSnap = await getDocsFromServer(collection(db, 'products'));
        if (isMounted && serverSnap && !serverSnap.empty) {
          const freshList: Product[] = [];
          serverSnap.docs.forEach((d) => {
            const p = parseDocData(d);
            if (p) freshList.push(p);
          });
          const merged = mergeProductsWithCatalog(freshList, isAdmin);
          setProducts(merged);
          setLoading(false);
        }
      } catch (serverErr: any) {
        if (serverErr?.code === 'resource-exhausted' || String(serverErr).includes('Quota')) {
          console.warn('[ProductContext] Firestore daily read quota exceeded. Serving verified product catalog.');
        }
        try {
          const fallbackSnap = await getDocs(collection(db, 'products'));
          if (isMounted && fallbackSnap && !fallbackSnap.empty) {
            const fallbackList: Product[] = [];
            fallbackSnap.docs.forEach((d) => {
              const p = parseDocData(d);
              if (p) fallbackList.push(p);
            });
            const merged = mergeProductsWithCatalog(fallbackList, isAdmin);
            setProducts(merged);
            setLoading(false);
          }
        } catch {
          // Gracefully retain catalog
          if (isMounted) setLoading(false);
        }
      }

      // 2. Real-time active listener with metadata changes
      try {
        unsubProducts = onSnapshot(
          collection(db, 'products'),
          { includeMetadataChanges: true },
          (snapshot) => {
            if (!isMounted) return;
            const firestoreList: Product[] = [];
            snapshot.docs.forEach((d) => {
              const p = parseDocData(d);
              if (p) firestoreList.push(p);
            });
            // Merge with catalog so 0 products is NEVER shown if Firestore collection is empty
            const merged = mergeProductsWithCatalog(firestoreList, isAdmin);
            setProducts(merged);
            setLoading(false);
          },
          (error: any) => {
            console.warn('[ProductContext] Realtime products listener warning (using resilient fallback):', error);
            if (isMounted) {
              setProducts((prev) => (prev.length > 0 ? prev : mergeProductsWithCatalog([], isAdmin)));
              setLoading(false);
            }
          }
        );
      } catch (listenerErr) {
        console.warn('[ProductContext] Failed to attach snapshot listener:', listenerErr);
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

  // Listen for local real-time product updates from Admin panel (within same browser window)
  useEffect(() => {
    const handleProductUpdated = (e: any) => {
      const updatedProduct = e.detail as Product;
      if (updatedProduct && updatedProduct.id) {
        setProducts((prev) => {
          const strId = String(updatedProduct.id);
          const idx = prev.findIndex((p) => String(p.id) === strId);
          let nextList: Product[];
          if (idx >= 0) {
            nextList = [...prev];
            nextList[idx] = { ...nextList[idx], ...updatedProduct };
          } else {
            nextList = [updatedProduct, ...prev];
          }
          try {
            localStorage.setItem('fm_products', JSON.stringify(nextList));
          } catch {}
          return nextList;
        });
      }
    };
    window.addEventListener('fm_products_updated', handleProductUpdated);
    return () => window.removeEventListener('fm_products_updated', handleProductUpdated);
  }, []);

  const saveProduct = useCallback(async (product: Product): Promise<void> => {
    const strId = String(product.id);
    const cleanedProduct = prepareProductPayloadForFirestore(product);

    // 1. Optimistic UI update across all storefront and admin components immediately
    setProducts((prev) => {
      const idx = prev.findIndex((p) => String(p.id) === strId);
      let nextList: Product[];
      if (idx >= 0) {
        nextList = [...prev];
        nextList[idx] = { ...nextList[idx], ...product };
      } else {
        nextList = [product, ...prev];
      }
      try {
        localStorage.setItem('fm_products', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    // Remove from deleted list if it was previously marked deleted
    try {
      const deletedIds = getDeletedProductIds();
      if (deletedIds.has(strId)) {
        deletedIds.delete(strId);
        localStorage.setItem('fm_deleted_product_ids', JSON.stringify(Array.from(deletedIds)));
      }
    } catch {}

    // 2. Broadcast to local tab listeners
    try {
      window.dispatchEvent(new CustomEvent('fm_products_updated', { detail: product }));
      window.dispatchEvent(new CustomEvent('fm_products_changed', { detail: { savedId: strId } }));
    } catch {}

    // 3. Save directly to Firestore if available
    try {
      await setDoc(doc(db, 'products', strId), cleanedProduct, { merge: true });
    } catch (error) {
      console.warn('[ProductContext] Firestore setDoc error (saved to local store):', error);
    }
  }, []);

  const deleteProduct = useCallback(async (productId: string): Promise<void> => {
    const strId = String(productId);
    
    // Mark as deleted in local storage so fallback catalog never resurrects it
    try {
      const deletedIds = getDeletedProductIds();
      deletedIds.add(strId);
      localStorage.setItem('fm_deleted_product_ids', JSON.stringify(Array.from(deletedIds)));
    } catch {}

    // Optimistic UI update across all storefront and admin components
    setProducts((prev) => {
      const nextList = prev.filter((p) => String(p.id) !== strId);
      try {
        localStorage.setItem('fm_products', JSON.stringify(nextList));
      } catch {}
      return nextList;
    });

    try {
      window.dispatchEvent(new CustomEvent('fm_products_changed', { detail: { deletedId: strId } }));
    } catch {}

    try {
      await deleteDoc(doc(db, 'products', strId));
    } catch (error) {
      console.warn('[ProductContext] Firestore deleteDoc error (marked deleted locally):', error);
    }
  }, []);

  const refreshProducts = useCallback(async (): Promise<void> => {
    try {
      const serverSnap = await getDocsFromServer(collection(db, 'products'));
      if (serverSnap && !serverSnap.empty) {
        const freshList: Product[] = [];
        serverSnap.docs.forEach((d) => {
          const p = sanitizeAndNormalizeProduct(d.data(), d.id, false);
          if (p) freshList.push(p);
        });
        const merged = mergeProductsWithCatalog(freshList, false);
        setProducts(merged);
        setLoading(false);
      }
    } catch {
      try {
        const fallbackSnap = await getDocs(collection(db, 'products'));
        if (fallbackSnap && !fallbackSnap.empty) {
          const list: Product[] = [];
          fallbackSnap.docs.forEach((d) => {
            const p = sanitizeAndNormalizeProduct(d.data(), d.id, false);
            if (p) list.push(p);
          });
          setProducts(mergeProductsWithCatalog(list, false));
          setLoading(false);
        }
      } catch {
        // Retain current catalog state
        setLoading(false);
      }
    }
  }, []);

  // Mobile Lifecycle & Cache Invalidation: Re-validate when mobile browser wakes up or resumes from BFCache
  useEffect(() => {
    const handleMobileResume = (e?: any) => {
      // If resumed from iOS Safari / Android Chrome BFCache or brought to visible state
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

