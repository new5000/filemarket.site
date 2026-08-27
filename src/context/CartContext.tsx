import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Product, CartItem, Coupon } from '../types';
import { fetchCoupons, validateCoupon } from '../lib/couponService';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedColor?: string, selectedSize?: string, selectedOption?: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  appliedCoupon: Coupon | null;
  setAppliedCoupon: (coupon: Coupon | null) => void;
  couponError: string | null;
  applyCouponCode: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  totalItemsCount: number;
  subtotalBDT: number;
  subtotalUSD: number;
  shippingCostBDT: number;
  shippingCostUSD: number;
  discountBDT: number;
  discountUSD: number;
  totalBDT: number;
  totalUSD: number;
  hasPhysicalItems: boolean;
  hasDigitalItems: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'filemarket_universal_cart';
const COUPON_STORAGE_KEY = 'filemarket_active_coupon';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem(COUPON_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);

  // Load available coupons
  useEffect(() => {
    fetchCoupons().then((list) => {
      setAvailableCoupons(list);
    });
  }, []);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn("Failed to persist cart to localStorage:", e);
    }
  }, [cartItems]);

  // Save coupon to local storage
  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Failed to persist coupon to localStorage:", e);
    }
  }, [appliedCoupon]);

  const addToCart = useCallback((
    product: Product, 
    quantity = 1, 
    selectedColor?: string, 
    selectedSize?: string, 
    selectedOption?: string
  ) => {
    if (!product) return;

    setCartItems((prevItems) => {
      const variantKey = `${selectedColor || ''}-${selectedSize || ''}-${selectedOption || ''}`;
      const itemKey = `${product.id}__${variantKey}`;

      const existingIndex = prevItems.findIndex((item) => item.id === itemKey);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const newQty = updated[existingIndex].quantity + quantity;
        // Check stock if physical product
        const maxStock = product.stockQuantity;
        if (maxStock !== undefined && maxStock > 0 && newQty > maxStock) {
          updated[existingIndex].quantity = maxStock;
        } else {
          updated[existingIndex].quantity = newQty;
        }
        return updated;
      } else {
        const newItem: CartItem = {
          id: itemKey,
          product,
          quantity: Math.max(1, quantity),
          selectedColor,
          selectedSize,
          selectedOption
        };
        return [...prevItems, newItem];
      }
    });

    // Auto open cart drawer
    setIsCartDrawerOpen(true);
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const maxStock = item.product.stockQuantity;
          if (maxStock !== undefined && maxStock > 0 && quantity > maxStock) {
            return { ...item, quantity: maxStock };
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch {}
  }, []);

  // Summary Calculations
  const totalItemsCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [cartItems]);

  const subtotalBDT = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + ((item.product.priceBDT || 0) * item.quantity), 0);
  }, [cartItems]);

  const subtotalUSD = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + ((item.product.priceUSD || 0) * item.quantity), 0);
  }, [cartItems]);

  const hasPhysicalItems = useMemo(() => {
    return cartItems.some((item) => item.product.productKind === 'physical');
  }, [cartItems]);

  const hasDigitalItems = useMemo(() => {
    return cartItems.some((item) => !item.product.productKind || item.product.productKind === 'digital');
  }, [cartItems]);

  // Shipping Cost: If physical items are present, sum or max shipping cost
  const shippingCostBDT = useMemo(() => {
    if (!hasPhysicalItems) return 0;
    return cartItems
      .filter((item) => item.product.productKind === 'physical')
      .reduce((max, item) => Math.max(max, item.product.shippingCostBDT ?? 60), 0);
  }, [cartItems, hasPhysicalItems]);

  const shippingCostUSD = useMemo(() => {
    if (!hasPhysicalItems) return 0;
    return cartItems
      .filter((item) => item.product.productKind === 'physical')
      .reduce((max, item) => Math.max(max, item.product.shippingCostUSD ?? 2.5), 0);
  }, [cartItems, hasPhysicalItems]);

  // Coupon Calculation
  const { discountBDT, discountUSD } = useMemo(() => {
    if (!appliedCoupon) return { discountBDT: 0, discountUSD: 0 };
    const res = validateCoupon(appliedCoupon.code, subtotalBDT, subtotalUSD, [appliedCoupon]);
    if (res.valid) {
      return { discountBDT: res.discountBDT, discountUSD: res.discountUSD };
    }
    return { discountBDT: 0, discountUSD: 0 };
  }, [appliedCoupon, subtotalBDT, subtotalUSD]);

  const totalBDT = useMemo(() => {
    return Math.max(0, subtotalBDT + shippingCostBDT - discountBDT);
  }, [subtotalBDT, shippingCostBDT, discountBDT]);

  const totalUSD = useMemo(() => {
    return Math.max(0, Math.round((subtotalUSD + shippingCostUSD - discountUSD) * 100) / 100);
  }, [subtotalUSD, shippingCostUSD, discountUSD]);

  const applyCouponCode = useCallback((code: string) => {
    const res = validateCoupon(code, subtotalBDT, subtotalUSD, availableCoupons);
    if (res.valid && res.coupon) {
      setAppliedCoupon(res.coupon);
      setCouponError(null);
      return { success: true, message: res.message };
    } else {
      setCouponError(res.message);
      return { success: false, message: res.message };
    }
  }, [subtotalBDT, subtotalUSD, availableCoupons]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponError(null);
  }, []);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        appliedCoupon,
        setAppliedCoupon,
        couponError,
        applyCouponCode,
        removeCoupon,
        totalItemsCount,
        subtotalBDT,
        subtotalUSD,
        shippingCostBDT,
        shippingCostUSD,
        discountBDT,
        discountUSD,
        totalBDT,
        totalUSD,
        hasPhysicalItems,
        hasDigitalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
