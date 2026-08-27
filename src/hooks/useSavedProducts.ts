import { useState, useEffect } from 'react';
import { getAuthStatus } from '../lib/authGuard';
import { toggleSavedProduct, getUserProfileFromFirestore, auth } from '../lib/firebase';

export function useSavedProducts() {
  const [savedProducts, setSavedProducts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const authStatus = getAuthStatus();

  useEffect(() => {
    let isMounted = true;

    const fetchSaved = async () => {
      if (!authStatus.isLoggedIn) {
        setSavedProducts([]);
        setIsLoading(false);
        return;
      }

      try {
        const uid = auth.currentUser?.uid || authStatus.user?.userId;
        if (uid) {
          const profile = await getUserProfileFromFirestore(uid);
          if (profile && profile.savedProducts && isMounted) {
            setSavedProducts(profile.savedProducts);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch saved products:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchSaved();

    return () => {
      isMounted = false;
    };
  }, [authStatus.isLoggedIn]);

  const toggleProduct = async (productId: string) => {
    if (!authStatus.isLoggedIn) return { requiresAuth: true, isSaved: false };

    // Optimistic update
    const wasSaved = savedProducts.includes(productId);
    setSavedProducts(prev => 
      wasSaved ? prev.filter(id => id !== productId) : [...prev, productId]
    );

    try {
      const result = await toggleSavedProduct(productId);
      setSavedProducts(result.savedProducts);
      return { requiresAuth: false, isSaved: result.saved };
    } catch (err) {
      console.error('Failed to toggle saved product:', err);
      // Revert optimistic update
      setSavedProducts(prev => 
        wasSaved ? [...prev, productId] : prev.filter(id => id !== productId)
      );
      throw err;
    }
  };

  return { savedProducts, toggleProduct, isLoading };
}
