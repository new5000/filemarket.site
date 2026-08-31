import React, { useState, useEffect, useMemo } from 'react';
import { Star, CheckCircle2, ShieldCheck, Download, HardDrive, FileCode, Calendar, Clock, Zap, Check, Sparkles, Share2, Heart, ShoppingBag, Package, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { Product, Currency } from '../types';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { ProductCard } from './ProductCard';
import { navigateTo, getProductSlug } from '../router';
import { formatDirectImageUrl } from '../utils/formatImageUrl';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { useAuth } from '../context/AuthContext';
import { db, getUserProfileFromFirestore } from '../lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { scoreProductRelevance, AIUserProfile } from '../utils/aiRecommender';
import { generateSeoKeywordCluster } from '../utils/seoKeywordGenerator';
import { VideoPreviewModal } from './VideoPreviewModal';

interface ProductDetailPageProps {
  product: Product | null;
  currency?: Currency;
  onBack: () => void;
  onInstantBuy: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
  isCheckoutOpen?: boolean;
  savedProducts?: string[];
  onToggleSave?: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailPageProps> = ({
  product,
  currency = 'BDT',
  onBack,
  onInstantBuy,
  onSelectProduct,
  isCheckoutOpen = false,
  savedProducts = [],
  onToggleSave,
}) => {
  const { productGuarantee } = useGlobalSettings();
  const { products } = useProducts();
  const { addToCart } = useCart();

  const isPhysical = product?.productKind === 'physical';
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState<number>(1);

  useEffect(() => {
    if (product?.variants?.colors && product.variants.colors.length > 0) {
      setSelectedColor(product.variants.colors[0]);
    } else {
      setSelectedColor('');
    }
    if (product?.variants?.sizes && product.variants.sizes.length > 0) {
      setSelectedSize(product.variants.sizes[0]);
    } else {
      setSelectedSize('');
    }
    setSelectedQty(1);
  }, [product]);

  const fallbackGuarantee = {
    guarantee: {
      titleBN: "১০০% মানি-ব্যাক গ্যারান্টি",
      titleEN: "100% Money-Back Quality Protection",
      description: "ফাইলে কোনো সমস্যা থাকলে বা ডেসক্রিপশন অনুযায়ী না হলে ২৪ ঘণ্টার মধ্যে ১০০% রিফান্ড! Instant 100% refund if asset is defective or not as described.",
      isEnabled: true
    }
  };

  const guaranteeSettings = productGuarantee || fallbackGuarantee;

  const [copiedLink, setCopiedLink] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const [isHeartAnimating, setIsHeartAnimating] = useState<boolean>(false);

  // Interest-based recommendations personalization states
  const { currentUser } = useAuth();
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [lastViewedId, setLastViewedId] = useState<string | null>(null);

  // Load user profile & browse history from Firestore (or LocalStorage fallback)
  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      if (currentUser) {
        try {
          const profile = await getUserProfileFromFirestore(currentUser.uid);
          if (profile && active) {
            if (profile.recentInterests) {
              setUserInterests(profile.recentInterests);
            }
            if (profile.recentTags) {
              setUserTags(profile.recentTags);
            }
            if (profile.lastViewedProductId) {
              setLastViewedId(profile.lastViewedProductId);
            }
          }
        } catch (err) {
          console.warn("Error loading user profile for recommendations:", err);
        }
      } else {
        // LocalStorage fallback for anonymous users
        try {
          const localInterests = localStorage.getItem('fm_anon_interests');
          if (localInterests) {
            setUserInterests(JSON.parse(localInterests));
          }
          const localTags = localStorage.getItem('fm_anon_tags');
          if (localTags) {
            setUserTags(JSON.parse(localTags));
          }
          const localLastViewed = localStorage.getItem('fm_anon_last_viewed');
          if (localLastViewed) {
            setLastViewedId(localLastViewed);
          }
        } catch {}
      }
    };
    loadProfile();
    return () => {
      active = false;
    };
  }, [currentUser]);

  // Track browsing history when active product changes
  useEffect(() => {
    if (product) {
      const trackView = async () => {
        // Track locally first to guarantee fast responsive updates
        try {
          const localInterests = localStorage.getItem('fm_anon_interests');
          let interestsArr: string[] = localInterests ? JSON.parse(localInterests) : [];
          if (!interestsArr.includes(product.category)) {
            interestsArr.push(product.category);
          }
          localStorage.setItem('fm_anon_interests', JSON.stringify(interestsArr));

          const localTags = localStorage.getItem('fm_anon_tags');
          let tagsArr: string[] = localTags ? JSON.parse(localTags) : [];
          const productTags = Array.isArray(product.tags) 
            ? product.tags 
            : (typeof product.tags === 'string' ? (product.tags as string).split(',').map(t => t.trim()).filter(Boolean) : []);
          productTags.forEach(t => {
            if (!tagsArr.includes(t)) {
              tagsArr.push(t);
            }
          });
          if (tagsArr.length > 100) tagsArr = tagsArr.slice(-100);
          localStorage.setItem('fm_anon_tags', JSON.stringify(tagsArr));
          localStorage.setItem('fm_anon_last_viewed', product.id);
          
          if (!currentUser) {
            setUserInterests(interestsArr);
            setUserTags(tagsArr);
            setLastViewedId(product.id);
          }
        } catch {}

        // Push to Firestore if authenticated
        if (currentUser) {
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const validTags = Array.isArray(product.tags) 
              ? product.tags.filter(Boolean) 
              : (typeof product.tags === 'string' ? (product.tags as string).split(',').map(t => t.trim()).filter(Boolean) : []);
            
            const updatePayload: Record<string, any> = {
              recentInterests: arrayUnion(product.category),
              lastViewedProductId: product.id,
              updatedAt: new Date().toISOString()
            };
            if (validTags.length > 0) {
              updatePayload.recentTags = arrayUnion(...validTags);
            }

            await updateDoc(userDocRef, updatePayload);
            
            setUserInterests(prev => Array.from(new Set([...prev, product.category])));
            setUserTags(prev => Array.from(new Set([...prev, ...validTags])));
            setLastViewedId(product.id);
          } catch (err) {
            console.warn("Failed to update user browse history in Firestore:", err);
          }
        }
      };

      trackView();
    }
  }, [product, currentUser]);

  useEffect(() => {
    if (product) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Dynamic SEO Title, Meta Description, Keywords & JSON-LD Schema
      document.title = `${product.title} | FileMarket.site`;
      
      let metaDesc = document.querySelector("meta[name='description']");
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', product.description);

      const cluster = generateSeoKeywordCluster(product.title, product.category, product.description);
      let metaKeywords = document.querySelector("meta[name='keywords']");
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', cluster.keywordsString);

      const scriptId = 'filemarket-product-schema';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify({
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.title,
        "image": product.thumbnail,
        "description": product.description,
        "keywords": cluster.keywordsString,
        "brand": {
          "@type": "Brand",
          "name": "FileMarket.site"
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "BDT",
          "price": product.priceBDT,
          "availability": "https://schema.org/InStock"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": product.rating,
          "reviewCount": product.reviewsCount || 42
        }
      });
    }
  }, [product]);

  if (!product) return null;

  const isLiked = savedProducts.includes(product.id);
  
  const salePrice = product.priceBDT || product.price || product.discountPrice || 350;
  const originalPrice = product.originalPriceBDT || (salePrice * 2);
  const discountPercentage = Math.round(((originalPrice - salePrice) / originalPrice) * 100);

  // Likes calculation (custom product.likesCount with fallback)
  const getDetailDisplayLikes = () => {
    if (product.likesCount !== undefined && product.likesCount !== null && String(product.likesCount).trim() !== '') {
      const raw = String(product.likesCount).trim();
      if (raw.toLowerCase().endsWith('k')) {
        const num = parseFloat(raw.toLowerCase().replace('k', ''));
        if (!isNaN(num)) {
          const base = Math.round(num * 1000);
          const val = isLiked ? base + 1 : base;
          return val >= 1000 ? (val / 1000).toFixed(1) + 'k' : String(val);
        }
        return raw;
      }
      if (raw.toLowerCase().endsWith('m')) {
        const num = parseFloat(raw.toLowerCase().replace('m', ''));
        if (!isNaN(num)) {
          const base = Math.round(num * 1000000);
          const val = isLiked ? base + 1 : base;
          return (val / 1000000).toFixed(1) + 'm';
        }
        return raw;
      }
      const parsed = parseFloat(raw.replace(/[^0-9.]/g, ''));
      if (!isNaN(parsed)) {
        const val = isLiked ? parsed + 1 : parsed;
        return val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toLocaleString();
      }
      return raw;
    }

    // Deterministic auto-seeding based on product ID
    let hash = 0;
    for (let i = 0; i < product.id.length; i++) {
      hash = product.id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const baseLikes = 500 + (Math.abs(hash) % 9500);
    const count = isLiked ? baseLikes + 1 : baseLikes;
    return count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count.toLocaleString();
  };

  const handleToggleLike = () => {
    setIsHeartAnimating(true);
    setTimeout(() => setIsHeartAnimating(false), 300);
    if (onToggleSave) onToggleSave(product.id);
  };

  // Curated tags for visual UI pills
  const getVisualTags = () => {
    const base = ['#FileMarket2026', '#DigitalAssetsBD', '#InstantDownload', '#GoogleDriveBundle', '#VerifiedSafe'];
    const catTags: Record<string, string[]> = {
      'Video Bundles': ['#VideoEditing', '#PremiereProPack', '#ViralReels', '#CapCutTemplates', '#AfterEffects', '#MotionGraphics'],
      'Online Courses': ['#Masterclass', '#OnlineLearning', '#SkillUpgrade', '#ExpertCourses', '#CareerGrowth'],
      'E-Books': ['#BestsellerBook', '#KnowledgeHub', '#PDFGuides', '#ReadAndGrow'],
      'Premium Apps': ['#MobileApps', '#ProApps', '#AndroidAPKs', '#UnlockedApps'],
      'AI Prompts': ['#AIPrompts', '#ChatGPTGuides', '#MidjourneyPrompts', '#ArtificialIntelligence'],
      'PHP Scripts': ['#PHPScripts', '#WebDevelopment', '#SourceCode', '#SaaSTemplates'],
      'Blogger Templates': ['#BloggerThemes', '#SEOOptimized', '#FastLoading', '#BlogspotTemplates']
    };
    const specific = catTags[product.category] || ['#ProTools', '#CreatorEconomy', '#SoftwareBundle'];
    return [...specific, ...base];
  };

  // Dynamic Interest-Based Recommendation Engine:
  const rawSimilar = products.filter(p => p.id !== product.id);

  // Score each product in the pool based on contextual relevance and user interests
  const scoredProducts = rawSimilar.map(p => {
    const profile: AIUserProfile = {
      viewedCategories: userInterests.reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      viewedTags: userTags
    };

    let score = scoreProductRelevance(p, profile);

    // Contextual boost inside active detail page
    if (p.category === product.category) {
      score += 15;
    }
    if (lastViewedId) {
      const lastViewedProduct = products.find(lp => lp.id === lastViewedId);
      if (lastViewedProduct && p.category === lastViewedProduct.category) {
        score += 8;
      }
    }

    // Fallback boost for top-rated if user has no history
    if (userInterests.length === 0 && userTags.length === 0) {
       score += (p.rating || 0) * 2;
    }

    return { product: p, score };
  });

  // Sort by score descending (highest priority first), then extract products
  const prioritizedProducts = scoredProducts
    .sort((a, b) => b.score - a.score)
    .map(sp => sp.product);

  // Extract unique products to ensure no duplicates, and take top 4
  const recommendedProducts = Array.from(new Map(prioritizedProducts.map(p => [p.id, p])).values()).slice(0, 4);

  const handleShare = async () => {
    const shareData = {
      title: product.title,
      text: 'Check out this asset on FileMarket',
      url: window.location.href,
    };

    if (navigator.share && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = window.location.href;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const formatLikes = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toLocaleString();
  };

  // Structured breakdown for scannable high-converting product description
  const getStructuredDescription = () => {
    const categoryBullets: Record<string, string[]> = {
      'Video Bundles': [
        '5,000+ Cinematic Transitions, Light Leaks & 4K Overlays',
        'Professional Sound FX Library (SFX) with Studio-Grade Audio',
        'Ready-to-Use Animated Titles, Lower Thirds & Call-outs',
        'Premium Color Grading LUTs & Viral Reel Hooks',
        'High-Speed Google Drive Cloud Access with Lifetime Updates'
      ],
      'Online Courses': [
        'Complete Masterclass Video Training Modules in Full HD',
        'Direct Google Drive Cloud Access with Lifetime Download',
        'Actionable Source Files, Workbooks & Step-by-Step Blueprints',
        'Real-World Case Studies & Career Acceleration Strategies',
        'Beginner-to-Advanced Structured Curriculum'
      ],
      'E-Books': [
        'High-Resolution PDF & EPUB Complete Digital Edition',
        'Actionable Frameworks, Strategy Blueprints & Checklists',
        'Mobile, Tablet & Desktop Optimized Reading Formats',
        'Instant Google Drive Download & Lifetime Cloud Access'
      ],
      'Premium Apps': [
        '100% Virus-Scanned & Verified Full Version Features',
        'Instant Direct Google Drive Cloud Download',
        'Unlocked Pro Capabilities without Recurring Subscriptions',
        'Step-by-Step Installation & Setup Instructions'
      ],
      'Premium PC Software': [
        '100% Virus-Scanned & Pre-Activated Full Version Software',
        'Lifetime Multi-PC Commercial & Personal License',
        'Direct Google Drive Cloud Access with Fast Server Speeds',
        'Detailed Video Tutorial for 1-Click Setup'
      ],
      'AI Prompts': [
        'High-Converting Master Prompt Library (ChatGPT, Midjourney, Claude)',
        'Plug-and-Play Copywriting & Image Generation Formulas',
        'Production-Tested for Maximum Efficiency & ROI',
        'Includes Step-by-Step Prompt Engineering Cheatsheets'
      ],
      'PHP Scripts': [
        'Full Clean PHP / Laravel Source Code with Modular Architecture',
        'Complete Database SQL Dump & 1-Click Setup Documentation',
        'Responsive Multi-Device UI & Powerful Admin Control Panel',
        'Commercial License with Unlimited Client Deployments'
      ],
      'Blogger Templates': [
        '100% Responsive & Google AdSense Friendly Theme Code',
        'Ultra-Fast 99+ Core Web Vitals Performance Optimization',
        'SEO Clean Schema Markup & Social OpenGraph Tags Built-in',
        '1-Click XML Import with Complete Customization Guide'
      ]
    };

    const customBundleList = (product.bundleFeatures && product.bundleFeatures.length > 0)
      ? product.bundleFeatures
      : ((product.features && product.features.length >= 1) ? product.features : null);

    const bulletList = customBundleList || (categoryBullets[product.category] || [
      '100% Virus-Free & Verified Source Package',
      'Instant Google Drive Direct Cloud Download',
      'Commercial & Personal Project Lifetime License',
      'Compatible with All Standard Tools & Workflows'
    ]);

    const whyChooseText = "Unlock your creative potential, edit like a pro, and save countless hours of tedious workflow with instant cloud access and verified lifetime commercial rights.";

    return { bulletList, whyChooseText };
  };

  // Unified dynamic SEO keywords array
  const activeSeoKeywords = React.useMemo(() => {
    if (!product) return [];
    if (product.seoKeywords) {
      if (Array.isArray(product.seoKeywords) && product.seoKeywords.length > 0) return product.seoKeywords;
      if (typeof product.seoKeywords === 'string' && product.seoKeywords.trim().length > 0) {
        return product.seoKeywords.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    if (product.tags) {
      if (Array.isArray(product.tags) && product.tags.length > 0) return product.tags;
      if (typeof product.tags === 'string' && (product.tags as string).trim().length > 0) {
        return (product.tags as string).split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    if (product.keywords) {
      if (Array.isArray(product.keywords) && product.keywords.length > 0) return product.keywords;
      if (typeof product.keywords === 'string' && (product.keywords as string).trim().length > 0) {
        return (product.keywords as string).split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return generateSeoKeywordCluster(product.title, product.category, product.description).keywordsList;
  }, [product]);

  return (
    <div className="w-full max-w-full px-0 sm:px-4 md:px-6 py-0 sm:py-4 space-y-0 sm:space-y-6 pb-12 sm:pb-16 animate-in fade-in duration-200">
      
      {/* Removed Hidden Semantic Index Block as requested */}

      {/* Main Product Details Card Container */}
      <div className="rounded-none sm:rounded-3xl bg-white dark:bg-[#0B1120] border-0 sm:border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-sm sm:shadow-2xl p-0 sm:p-8 transition-colors duration-200 overflow-hidden">
        
        {/* Hero & Media Showcase Banner */}
        <div className="relative w-full aspect-video rounded-none sm:rounded-2xl overflow-hidden bg-[#0B1120] border-0 sm:border border-slate-200 dark:border-slate-800 shadow-inner group flex items-center justify-center">
          <motion.img
            layoutId={`product-thumb-${product.id}`}
            src={formatDirectImageUrl(product.thumbnail) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'}
            alt={product.title}
            className="w-full h-full object-contain group-hover:scale-105 transition duration-500 will-change-transform"
            referrerPolicy="no-referrer"
          />
          
          {/* Action Row Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between z-10">
            {/* Left Group (Preview & Rating) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  navigateTo(`/preview/${getProductSlug(product)}`, { title: `Watch Preview: ${product.title} — FileMarket` });
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span>Watch Preview</span>
              </button>

              <div className="bg-black/60 backdrop-blur-md text-amber-400 border border-white/10 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#FFD700]" />
                <span>{product.rating}</span>
              </div>
            </div>

            {/* Right Group (Social & Engagement) */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleLike}
                aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
                className={`bg-black/60 backdrop-blur-md text-white border border-white/10 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 hover:bg-black/80 active:scale-95 transition-all cursor-pointer ${
                  isLiked ? 'text-rose-400 border-rose-500/50' : ''
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isLiked ? 'fill-rose-400 text-rose-400' : 'text-white'
                  } ${isHeartAnimating ? 'scale-125' : 'scale-100'}`}
                />
                <span>{getDetailDisplayLikes()}</span>
              </button>

              <button
                onClick={handleShare}
                aria-label="Share this asset"
                className="bg-black/60 backdrop-blur-md text-white border border-white/10 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 hover:bg-black/80 active:scale-95 transition-all cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Wrapper for Mobile (Adds padding back to text content) */}
        <div className="px-4 sm:px-0 space-y-5 pb-5 sm:pb-0 pt-2 sm:pt-6">
          
          {/* Title & Structured Description Section */}
          <div className="space-y-4">
            <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {product.title}
            </h1>

            {/* Pricing & Discount Badge Section */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                ৳{salePrice.toLocaleString('en-BD')}
              </span>
              <span className="text-lg text-slate-400 line-through decoration-slate-400/50">
                ৳{originalPrice.toLocaleString('en-BD')}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-black border border-rose-500/20 shadow-sm">
                -{discountPercentage}% OFF
              </span>
            </div>

            {/* Physical Product Variants & Stock Banner */}
            {isPhysical && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3.5">
                {/* Stock & Delivery Info */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold">
                    <Package className="w-4 h-4" />
                    <span>{product.stockQuantity !== undefined ? `${product.stockQuantity} In Stock (SKU: ${product.sku || 'N/A'})` : 'In Stock'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                    <Truck className="w-4 h-4 text-emerald-500" />
                    <span>Est. Delivery: {product.estimatedDeliveryDays || '2-4 business days'}</span>
                  </div>
                </div>

                {/* Color Variants */}
                {product.variants?.colors && product.variants.colors.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Choose Color:</span>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.colors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setSelectedColor(c)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                            selectedColor === c
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Variants */}
                {product.variants?.sizes && product.variants.sizes.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Choose Size:</span>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.sizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedSize(s)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                            selectedSize === s
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dual CTA Buttons (Instant Buy + Add to Cart) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 mb-6 sm:mt-7 sm:mb-7">
              {/* Premium Crimson Red Buy Button with Soft Red Ambient Glow */}
              <div className="relative group w-full flex items-center justify-center">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 via-rose-500 to-red-500 rounded-2xl opacity-60 blur-md group-hover:opacity-100 group-hover:blur-lg animate-pulse transition-all duration-500 pointer-events-none" />

                <button
                  type="button"
                  onClick={() => onInstantBuy(product)}
                  className="relative z-10 w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-red-900/30 border border-red-300/40 active:scale-98 transition-all duration-200 cursor-pointer select-none"
                >
                  <Zap className="w-4 h-4 fill-amber-300 text-amber-300 shrink-0" />
                  <span className="tracking-wide">{isPhysical ? 'Buy Now • Parcel Delivery' : 'Buy Now • Instant Access'}</span>
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={() => addToCart(product, selectedQty, selectedColor, selectedSize)}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-md border border-slate-700 active:scale-98 transition-all duration-200 cursor-pointer select-none"
              >
                <ShoppingBag className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="tracking-wide">Add to Cart</span>
              </button>
            </div>

            {/* Redesigned Structured Product Description Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.08] space-y-4 transition-all duration-200">
              
              {/* 1. Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>DESCRIPTION</span>
                </div>
                <div className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-line break-words">
                  {product.description ? product.description.trim() : ''}
                </div>
              </div>

              {/* 2. What's Inside the Bundle */}
              <div className="space-y-2.5 pt-3 border-t border-slate-200/80 dark:border-white/[0.08]">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 fill-amber-500/20" />
                  <span>What&apos;s Inside this Bundle:</span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                  {getStructuredDescription().bulletList.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 py-0.5">
                      <div className="w-4.5 h-4.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span className="leading-snug font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>

        {/* 2. MONEY-BACK GUARANTEE BADGE (DIGITAL PRODUCTS) */}
        {guaranteeSettings.guarantee.isEnabled && (
          <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 my-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 shadow-sm group">
            <div className="absolute inset-0 w-[200%] -translate-x-full animate-[lightSweep_3s_linear_infinite] bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent pointer-events-none skew-x-12" />
            <div className="relative flex items-start sm:items-center gap-4">
              <div className="relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                <div className="absolute inset-0 rounded-xl bg-emerald-500/10 animate-pulse" />
                <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 relative z-10" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-emerald-600 dark:text-emerald-400 font-bold text-sm sm:text-base lg:text-lg tracking-wide mb-1">
                  🛡️ {guaranteeSettings.guarantee.titleBN} • {guaranteeSettings.guarantee.titleEN}
                </h4>
                <p className="text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm leading-relaxed">
                  {guaranteeSettings.guarantee.description.split('Instant 100%')[0]}
                </p>
                {guaranteeSettings.guarantee.description.includes('Instant 100%') && (
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs mt-1 leading-snug">
                    Instant 100%{guaranteeSettings.guarantee.description.split('Instant 100%')[1]}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 backdrop-blur-sm">
                    ⚡ Instant 24h Refund
                  </span>
                  <span className="bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50 text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1 backdrop-blur-sm">
                    <Check className="w-3 h-3 text-emerald-500" /> Human Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* 4. Dynamic Recommendation Engine / Similar Products */}
        <div id="recommended-section" className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-0.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📦 You May Also Like</span>
              </h3>
            </div>
          </div>

          {recommendedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-4">
              {recommendedProducts.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  currency={currency}
                  onInstantBuy={onInstantBuy}
                  onViewDetails={(p) => {
                    if (onSelectProduct) onSelectProduct(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  isSaved={savedProducts.includes(item.id)}
                  onToggleSave={onToggleSave}
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">More products coming soon.</p>
            </div>
          )}
        </div>

        {/* Removed DYNAMIC SEO KEYWORD & SEARCH TAGS CLOUD as requested */}

        </div>
      </div>

      {/* Video / Interactive Gallery Preview Modal Popup */}
      <VideoPreviewModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        product={product}
        videoUrl={product.previewVideoUrl || product.demoUrl}
        previewWebsiteUrl={product.previewWebsiteUrl}
        previewPlayers={product.previewPlayers}
        previewBlocks={product.previewBlocks}
        previewImages={product.previewImages || product.gallery}
        title={`Preview: ${product.title}`}
        thumbnailUrl={product.thumbnail}
        onInstantBuy={onInstantBuy}
      />

      {/* Toast Notification for Clipboard Copy */}
      {copiedLink && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-emerald-500/50 text-emerald-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs sm:text-sm font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>🔗 Link copied to clipboard!</span>
        </div>
      )}

    </div>
  );
};
