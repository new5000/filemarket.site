import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
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

  // Active Real-Time Listener strictly on Firestore 'products'
  useEffect(() => {
    let unsubProducts: (() => void) | null = null;

    const setupListener = (isAdmin: boolean) => {
      if (unsubProducts) unsubProducts();
      unsubProducts = onSnapshot(
        collection(db, 'products'),
        (snapshot) => {
          const firestoreList = snapshot.docs.map(
            (d) => {
              const data = d.data();
              if (isAdmin) {
                return { id: d.id, ...data } as Product;
              } else {
                // Bank-Grade Security: Strictly isolate private download URLs from public payloads
                const { downloadUrl, instantDownloadLink, driveUrl, driveLink, cloudDriveUrl, cloudAccessLink, ...publicData } = data;
                return { id: d.id, ...publicData } as Product;
              }
            }
          );
          // We do NOT filter drafts here so that the Admin Panel sees them.
          // Frontend filtering handles drafts appropriately in App.tsx.
          setProducts(firestoreList);
          setLoading(false);
        },
        (error) => {
          console.warn('Realtime products listener error:', error);
          setLoading(false);
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
      unsubAuth();
      if (unsubProducts) unsubProducts();
    };
  }, []);

  const saveProduct = useCallback(async (product: Product): Promise<void> => {
    const strId = String(product.id);
    const cleanedProduct = prepareProductPayloadForFirestore(product);
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
