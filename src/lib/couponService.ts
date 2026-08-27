import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot 
} from 'firebase/firestore';
import { db, cleanFirestoreData } from './firebase';
import { Coupon } from '../types';

export type { Coupon };

export const DEFAULT_COUPONS: Coupon[] = [
  {
    id: 'WELCOME50',
    code: 'WELCOME50',
    discountType: 'percent',
    discountValue: 50,
    minOrderBDT: 200,
    minOrderUSD: 2,
    maxUses: 1000,
    usedCount: 142,
    expiryDate: '2027-12-31',
    enabled: true,
    description: 'Special 50% Off Welcome Discount for all new and returning members!'
  },
  {
    id: 'SAVE100',
    code: 'SAVE100',
    discountType: 'fixed',
    discountValue: 100, // 100 BDT or $1
    minOrderBDT: 400,
    minOrderUSD: 4,
    maxUses: 500,
    usedCount: 89,
    expiryDate: '2027-12-31',
    enabled: true,
    description: 'Flat ৳100 BDT / $1 USD Instant Discount on orders above ৳400'
  },
  {
    id: 'VIP20',
    code: 'VIP20',
    discountType: 'percent',
    discountValue: 20,
    minOrderBDT: 100,
    minOrderUSD: 1,
    maxUses: 5000,
    usedCount: 310,
    expiryDate: '2028-12-31',
    enabled: true,
    description: '20% VIP Storewide Discount on all digital and physical assets'
  }
];

/**
 * Subscribe to real-time coupons updates
 */
export function subscribeCoupons(callback: (coupons: Coupon[]) => void): () => void {
  try {
    const q = query(collection(db, 'coupons'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const list: Coupon[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as Coupon);
        });
        callback(list);
      } else {
        // Fallback to defaults if no coupons in DB yet
        callback(DEFAULT_COUPONS);
      }
    }, (error) => {
      console.warn("Firestore coupons subscription error:", error);
      callback(DEFAULT_COUPONS);
    });
    return unsubscribe;
  } catch (err) {
    console.warn("Error subscribing to coupons:", err);
    callback(DEFAULT_COUPONS);
    return () => {};
  }
}

/**
 * Fetch all coupons from Firestore with fallback
 */
export async function fetchCoupons(): Promise<Coupon[]> {
  try {
    const q = query(collection(db, 'coupons'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const list: Coupon[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Coupon);
      });
      return list;
    }
    return DEFAULT_COUPONS;
  } catch (err) {
    console.warn("Error fetching coupons:", err);
    return DEFAULT_COUPONS;
  }
}

/**
 * Save or update coupon in Firestore
 */
export async function saveCoupon(coupon: Coupon): Promise<void> {
  try {
    const id = coupon.id || coupon.code.toUpperCase().trim();
    const docRef = doc(db, 'coupons', id);
    const couponPayload = cleanFirestoreData({
      ...coupon,
      id,
      code: coupon.code.toUpperCase().trim(),
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, couponPayload, { merge: true });
  } catch (err) {
    console.error("Error saving coupon to Firestore:", err);
    throw err;
  }
}

/**
 * Delete a coupon from Firestore
 */
export async function deleteCoupon(couponId: string): Promise<void> {
  try {
    const docRef = doc(db, 'coupons', couponId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("Error deleting coupon:", err);
    throw err;
  }
}

export interface CouponValidationResult {
  valid: boolean;
  message: string;
  coupon?: Coupon;
  discountBDT: number;
  discountUSD: number;
}

/**
 * Validate a coupon against an order total
 */
export function validateCoupon(
  code: string,
  totalBDT: number,
  totalUSD: number,
  couponsList: Coupon[] = DEFAULT_COUPONS
): CouponValidationResult {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, message: 'Please enter a coupon code', discountBDT: 0, discountUSD: 0 };
  }

  const coupon = couponsList.find((c) => c.code.toUpperCase() === cleanCode);
  if (!coupon) {
    return { valid: false, message: `Coupon "${cleanCode}" is invalid or does not exist.`, discountBDT: 0, discountUSD: 0 };
  }

  if (!coupon.enabled) {
    return { valid: false, message: `Coupon "${cleanCode}" has been disabled.`, discountBDT: 0, discountUSD: 0 };
  }

  if (coupon.expiryDate) {
    const expiry = new Date(coupon.expiryDate).getTime();
    if (!isNaN(expiry) && expiry < Date.now()) {
      return { valid: false, message: `Coupon "${cleanCode}" expired on ${coupon.expiryDate}.`, discountBDT: 0, discountUSD: 0 };
    }
  }

  if (coupon.maxUses && coupon.usedCount && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: `Coupon "${cleanCode}" has reached its maximum usage limit.`, discountBDT: 0, discountUSD: 0 };
  }

  if (coupon.minOrderBDT && totalBDT < coupon.minOrderBDT) {
    return { 
      valid: false, 
      message: `Minimum order amount of ৳${coupon.minOrderBDT} BDT required for coupon "${cleanCode}".`, 
      discountBDT: 0, 
      discountUSD: 0 
    };
  }

  // Calculate discount
  let discountBDT = 0;
  let discountUSD = 0;

  if (coupon.discountType === 'percent') {
    discountBDT = Math.round((totalBDT * coupon.discountValue) / 100);
    discountUSD = Math.round(((totalUSD * coupon.discountValue) / 100) * 100) / 100;
  } else {
    // Fixed amount
    discountBDT = Math.min(coupon.discountValue, totalBDT);
    discountUSD = Math.min(Math.round(coupon.discountValue / 120 * 100) / 100, totalUSD);
  }

  return {
    valid: true,
    message: `🎉 Coupon "${coupon.code}" applied! You saved ${coupon.discountType === 'percent' ? `${coupon.discountValue}%` : `৳${discountBDT}`}.`,
    coupon,
    discountBDT,
    discountUSD
  };
}
