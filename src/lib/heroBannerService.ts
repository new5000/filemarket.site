import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { Product, HeroBannerSlide, HeroBannersData } from '../types';
import { DEFAULT_HERO_BANNERS } from '../context/GlobalSettingsContext';
import { formatDirectImageUrl } from '../utils/formatImageUrl';
import { getProductSlug } from '../router';

const HERO_BANNERS_DOC_REF = doc(db, 'system_settings', 'hero_banners');

/**
 * Fetch current hero banners from Firestore or return defaults
 */
export async function getHeroBanners(): Promise<HeroBannersData> {
  try {
    const snap = await getDoc(HERO_BANNERS_DOC_REF);
    if (snap.exists()) {
      const data = snap.data() as Partial<HeroBannersData>;
      return {
        banners: data.banners || DEFAULT_HERO_BANNERS.banners,
        autoPlayInterval: data.autoPlayInterval || 5000,
        isEnabled: data.isEnabled !== undefined ? data.isEnabled : true,
        updatedAt: data.updatedAt
      };
    }
  } catch (err) {
    console.warn('Could not fetch hero banners from Firestore:', err);
  }
  return DEFAULT_HERO_BANNERS;
}

/**
 * Check if a product is already featured in the hero banners list
 */
export function isProductInHeroBanners(product: Product, banners: HeroBannerSlide[]): boolean {
  if (!product || !banners || !Array.isArray(banners)) return false;
  const prodId = String(product.id).toLowerCase();
  const prodSlug = getProductSlug(product).toLowerCase();

  return banners.some(b => {
    if (b.productId && String(b.productId).toLowerCase() === prodId) return true;
    if (b.id && String(b.id).toLowerCase() === prodId) return true;
    const link = (b.actionLink || '').toLowerCase();
    if (link.includes(`/product/${prodId}`) || link.includes(`/product/${prodSlug}`)) return true;
    if (link.includes(prodId) || link.includes(prodSlug)) return true;
    return false;
  });
}

/**
 * Find the banner index for a given product
 */
export function findProductBannerIndex(product: Product, banners: HeroBannerSlide[]): number {
  if (!product || !banners || !Array.isArray(banners)) return -1;
  const prodId = String(product.id).toLowerCase();
  const prodSlug = getProductSlug(product).toLowerCase();

  return banners.findIndex(b => {
    if (b.productId && String(b.productId).toLowerCase() === prodId) return true;
    if (b.id && String(b.id).toLowerCase() === prodId) return true;
    const link = (b.actionLink || '').toLowerCase();
    if (link.includes(`/product/${prodId}`) || link.includes(`/product/${prodSlug}`)) return true;
    if (link.includes(prodId) || link.includes(prodSlug)) return true;
    return false;
  });
}

/**
 * Create a clean, high-impact HeroBannerSlide object from any Product
 */
export function createBannerSlideFromProduct(product: Product): HeroBannerSlide {
  const prodSlug = getProductSlug(product);
  const actionLink = `/product/${prodSlug}`;
  
  // Choose best image
  const rawImage = (product as any).coverImage || product.thumbnail || (product.previewImages && product.previewImages[0]) || '';
  const imageUrl = formatDirectImageUrl(rawImage) || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop';

  // Subtext: pricing + category or subtitle
  const priceText = product.priceUSD ? `$${product.priceUSD} USD / ৳${product.priceBDT}` : `৳${product.priceBDT}`;
  const subtext = product.cardSubtitle 
    ? `${product.cardSubtitle} • ${priceText}`
    : (product.description 
        ? `${product.description.slice(0, 85).trim()}... • ${priceText}` 
        : `Instant Direct Access • ${product.category || 'Digital Asset'} • ${priceText}`);

  return {
    id: Date.now(),
    productId: String(product.id),
    badge: product.badge || '🔥 FEATURED ASSET',
    headline: product.title,
    subtext,
    imageUrl,
    actionLink,
    actionText: 'Get Instant Access'
  };
}

/**
 * 1-Click Action: Add any published product directly to the Hero Section
 */
export async function addProductToHeroBanner(product: Product): Promise<{
  success: boolean;
  message: string;
  isAdded: boolean;
  updatedBanners: HeroBannerSlide[];
}> {
  try {
    const current = await getHeroBanners();
    const existingIndex = findProductBannerIndex(product, current.banners);

    let updatedList: HeroBannerSlide[];
    if (existingIndex !== -1) {
      // Already present -> update details and move to top
      const newSlide = createBannerSlideFromProduct(product);
      newSlide.id = current.banners[existingIndex].id || Date.now();
      const filtered = current.banners.filter((_, i) => i !== existingIndex);
      updatedList = [newSlide, ...filtered];
    } else {
      const newSlide = createBannerSlideFromProduct(product);
      updatedList = [newSlide, ...current.banners];
    }

    const payload: HeroBannersData = {
      ...current,
      banners: updatedList,
      isEnabled: true,
      updatedAt: new Date().toISOString()
    };

    await setDoc(HERO_BANNERS_DOC_REF, payload, { merge: true });

    return {
      success: true,
      message: `"${product.title}" has been added to Homepage Hero Slider! 🚀`,
      isAdded: true,
      updatedBanners: updatedList
    };
  } catch (err: any) {
    console.error('Failed to add product to hero banner:', err);
    return {
      success: false,
      message: err.message || 'Failed to add product to Hero section.',
      isAdded: false,
      updatedBanners: []
    };
  }
}

/**
 * 1-Click Action: Remove a product from the Hero Section
 */
export async function removeProductFromHeroBanner(product: Product): Promise<{
  success: boolean;
  message: string;
  isAdded: boolean;
  updatedBanners: HeroBannerSlide[];
}> {
  try {
    const current = await getHeroBanners();
    const existingIndex = findProductBannerIndex(product, current.banners);

    if (existingIndex === -1) {
      return {
        success: true,
        message: `Product is not in the Hero Slider.`,
        isAdded: false,
        updatedBanners: current.banners
      };
    }

    const updatedList = current.banners.filter((_, i) => i !== existingIndex);
    const payload: HeroBannersData = {
      ...current,
      banners: updatedList,
      updatedAt: new Date().toISOString()
    };

    await setDoc(HERO_BANNERS_DOC_REF, payload, { merge: true });

    return {
      success: true,
      message: `"${product.title}" removed from Hero Slider.`,
      isAdded: false,
      updatedBanners: updatedList
    };
  } catch (err: any) {
    console.error('Failed to remove product from hero banner:', err);
    return {
      success: false,
      message: err.message || 'Failed to remove product from Hero section.',
      isAdded: true,
      updatedBanners: []
    };
  }
}

/**
 * 1-Click Action: Toggle a product in/out of the Hero Section
 */
export async function toggleProductInHeroBanner(product: Product): Promise<{
  success: boolean;
  message: string;
  isAdded: boolean;
  updatedBanners: HeroBannerSlide[];
}> {
  const current = await getHeroBanners();
  const isPresent = isProductInHeroBanners(product, current.banners);
  if (isPresent) {
    return removeProductFromHeroBanner(product);
  } else {
    return addProductToHeroBanner(product);
  }
}
