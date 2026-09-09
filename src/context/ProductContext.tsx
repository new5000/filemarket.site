import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active Real-Time Listener strictly on Firestore 'products' with zero local storage cache poisoning
  useEffect(() => {
    let unsubProducts: (() => void) | null = null;
    let isMounted = true;

    // Purge legacy product caches across all devices to prevent stale data resurrection
    try {
      localStorage.removeItem('fm_custom_products');
      localStorage.removeItem('fm_products');
      localStorage.removeItem('fm_deleted_product_ids');
    } catch {}

    const setupListener = async (isAdmin: boolean) => {
      if (unsubProducts) unsubProducts();

      const parseDocData = (docSnap: any): Product => {
        const data = docSnap.data();
        if (isAdmin) {
          return { id: docSnap.id, ...data } as Product;
        } else {
          // Bank-Grade Security: Strictly isolate private download URLs from public storefront payloads
          const { downloadUrl, instantDownloadLink, driveUrl, driveLink, cloudDriveUrl, cloudAccessLink, ...publicData } = data;
          return { id: docSnap.id, ...publicData } as Product;
        }
      };

      // 1. Immediate fresh direct-from-server query to avoid waiting for WebSocket/snapshot handshake
      try {
        const serverSnap = await getDocsFromServer(collection(db, 'products'));
        if (isMounted && serverSnap && !serverSnap.empty) {
          const freshList = serverSnap.docs.map(parseDocData);
          setProducts(freshList);
          setLoading(false);
        }
      } catch (serverErr) {
        try {
          const fallbackSnap = await getDocs(collection(db, 'products'));
          if (isMounted && fallbackSnap && !fallbackSnap.empty) {
            setProducts(fallbackSnap.docs.map(parseDocData));
            setLoading(false);
          }
        } catch {}
      }

      // 2. Real-time active listener with metadata changes so newly published products show up on all devices instantly
      unsubProducts = onSnapshot(
        collection(db, 'products'),
        { includeMetadataChanges: true },
        (snapshot) => {
          if (!isMounted) return;
          const firestoreList = snapshot.docs.map(parseDocData);
          setProducts(firestoreList);
          setLoading(false);
        },
        (error) => {
          console.warn('Realtime products listener error:', error);
          if (isMounted) setLoading(false);
        }
      );
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
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], ...updatedProduct };
            return copy;
          }
          return [updatedProduct, ...prev];
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
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...product };
        return copy;
      }
      return [product, ...prev];
    });

    // 2. Broadcast to local tab listeners
    try {
      window.dispatchEvent(new CustomEvent('fm_products_updated', { detail: product }));
    } catch {}

    // 3. Save directly to Firestore; onSnapshot real-time listener will broadcast to all other open devices instantly
    try {
      await setDoc(doc(db, 'products', strId), cleanedProduct, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${strId}`);
    }
  }, []);

  const deleteProduct = useCallback(async (productId: string): Promise<void> => {
    const strId = String(productId);
    
    // Optimistic UI update across all storefront and admin components
    setProducts((prev) => prev.filter((p) => String(p.id) !== strId));

    try {
      await deleteDoc(doc(db, 'products', strId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${strId}`);
    }
  }, []);

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
