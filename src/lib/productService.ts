import { collection, query, where, getDocs, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Product } from '../types';

export const getRelatedProducts = async (category: string, currentProductId: string): Promise<Product[]> => {
  try {
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('category', '==', category),
      limit(31)
    );
    const querySnapshot = await getDocs(q);
    const related: Product[] = [];
    querySnapshot.forEach((docSnap) => {
      if (docSnap.id !== currentProductId) {
        related.push({ id: docSnap.id, ...docSnap.data() } as Product);
      }
    });
    if (related.length > 0) {
      return related.slice(0, 30);
    }
  } catch (error) {
    console.warn("Error fetching related products from Firestore, falling back to local products:", error);
  }

  return [];
};

const BILINGUAL_SYNONYMS: Record<string, string[]> = {
  "ভিডিও": ["video", "reels", "footage", "ভিডিও বান্ডেল", "video bundles"],
  "ভিডিও বান্ডেল": ["video bundles", "video", "reels", "footage"],
  "অ্যাপ": ["app", "play store", "apk", "source code", "অ্যাপ্লিকেশন"],
  "প্লে স্টোর": ["app", "play store", "apk", "source code"],
  "কোর্স": ["course", "tutorial", "e-book", "শিখুন", "টিউটোরিয়াল", "online courses"],
  "টিউটোরিয়াল": ["course", "tutorial", "e-book", "শিখুন", "online courses"],
  "ইবুক": ["ebook", "e-books", "pdf books", "বই", "গাইড"],
  "বই": ["ebook", "e-books", "pdf books", "ইবুক", "গাইড"],
  "সফটওয়্যার": ["software", "pc tools", "windows", "mac", "অ্যাপ"],
  "প্রম্পট": ["prompt", "chatgpt", "midjourney", "ai tools", "এআই"],
  "এআই": ["ai", "chatgpt", "midjourney", "prompt", "প্রম্পট"],
  "স্ক্রিপ্ট": ["script", "php", "source code", "ওয়েব", "web"],
  "থিম": ["theme", "template", "blogger", "wordpress", "টেমপ্লেট"],
  "টেমপ্লেট": ["template", "theme", "blogger", "wordpress", "থিম"],
  "ডিজাইন": ["design", "graphics", "ui", "ux", "গ্রাফিক্স"],
  "মার্কেটিং": ["marketing", "seo", "digital", "ads", "এডস"],
  "সার্ভিস": ["service", "freelancing", "support", "সেবা"]
};

// Normalize Bangla unicode spaces and generic text
const normalizeText = (text: string) => {
  if (!text) return '';
  return text.toLowerCase().replace(/[​-‍﻿]/g, '').trim();
};

export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  if (!searchTerm.trim()) return [];
  let allProducts: Product[] = [];
  try {
    const productsRef = collection(db, 'products');
    
    // For small catalogs, client-side rich filtering is much more powerful for bilingual & fuzzy matching.
    const qAll = query(productsRef);
    const allSnapshot = await getDocs(qAll);
    allSnapshot.forEach(docSnap => allProducts.push({ id: docSnap.id, ...docSnap.data() } as Product));
  } catch (error) {
    console.warn("Firestore search error:", error);
  }

  const rawTerm = normalizeText(searchTerm);
  let searchTerms = [rawTerm];
  
  // Synonym Expansion
  for (const [key, synonyms] of Object.entries(BILINGUAL_SYNONYMS)) {
    if (rawTerm.includes(key) || synonyms.some(s => rawTerm.includes(s))) {
      searchTerms = [...searchTerms, key, ...synonyms];
    }
  }
  
  // Deduplicate
  searchTerms = [...new Set(searchTerms)];
  
  const matchedProducts = allProducts.filter(p => {
    const title = normalizeText(p.title);
    const desc = normalizeText(p.description || '');
    const cat = normalizeText(p.category || '');
    const tags = (p.tags || []).map(normalizeText).join(' ');
    const keywords = (p.keywords || []).map(normalizeText).join(' ');
    
    const searchableText = [title, desc, cat, tags, keywords].join(' | ');
    
    // If ANY of our expanded search terms match the searchable text
    return searchTerms.some(term => searchableText.includes(term));
  });
  
  return matchedProducts;
};

export const saveProductAltText = async (productId: string, altText: string) => {
  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, { altText });
    return true;
  } catch (error) {
    console.error("Error saving alt text:", error);
    return false;
  }
};
