export type ProductCategory =
  | 'Video Bundles'
  | 'Online Courses'
  | 'E-Books'
  | 'Premium Apps'
  | 'Premium PC Software'
  | 'AI Prompts'
  | 'PHP Scripts'
  | 'Blogger Templates'
  | 'Digital Services'
  | 'Others';

export type Currency = 'BDT' | 'USD';
export type AppLanguage = 'en' | 'bn';
export type ProductType = 'asset' | 'service';

export type PreviewBlockType = 'player' | 'ad';

export interface PreviewBlock {
  id: string;
  type: PreviewBlockType;
  enabled: boolean;
  // For 'player' block
  url?: string;
  aspectRatio?: '16:9' | '9:16';
  // For 'ad' block
  code?: string;
}

export interface PreviewPlayer {
  id: number;
  enabled: boolean;
  url: string;
  aspectRatio: '16:9' | '9:16';
}

export interface ProductVariants {
  colors?: string[];
  sizes?: string[];
  options?: string[];
}

export interface Product {
  id: string;
  title: string;
  category: ProductCategory;
  type?: ProductType;
  productKind?: 'digital' | 'physical';
  deliveryTime?: string;
  whatsappMessage?: string;
  priceBDT: number;
  priceUSD: number;
  originalPriceBDT: number;
  thumbnail: string;
  badge?: string;
  rating: number;
  reviewsCount: number;
  fileSize: string;
  fileFormat: string;
  license: string;
  cardSubtitle?: string;
  bundleFeatures?: string[];
  softwareFormat?: string;
  licenseTerms?: string;
  releaseDate?: string;
  version?: string;
  instantDownloadLink: string;
  description: string;
  features: string[];
  demoUrl?: string;
  previewVideoUrl?: string;
  previewWebsiteUrl?: string;
  previewPlayers?: PreviewPlayer[];
  previewBlocks?: PreviewBlock[];
  updatedDate: string;
  downloadsCount: number;
  likesCount?: string | number;
  tags?: string[];
  keywords?: string[];
  seoKeywords?: string[] | string;
  altText?: string;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  status?: 'active' | 'draft' | 'hidden';
  // Physical product fields
  stockQuantity?: number;
  sku?: string;
  shippingCostBDT?: number;
  shippingCostUSD?: number;
  estimatedDeliveryDays?: string;
  variants?: ProductVariants;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  selectedOption?: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderBDT?: number;
  minOrderUSD?: number;
  maxUses?: number;
  usedCount?: number;
  expiryDate?: string;
  enabled: boolean;
  description?: string;
}

export interface ShippingDetails {
  fullName: string;
  phone: string;
  email: string;
  city: string;
  address: string;
  postalCode?: string;
  notes?: string;
}

export type PaymentMethod = 
  | 'bKash' 
  | 'Nagad' 
  | 'Rocket'
  | 'Shurjopay'
  | 'SSLCommerz'
  | 'AamarPay'
  | 'Binance'
  | 'Stripe'
  | 'PayPal'
  | 'Razorpay'
  | 'Mollie'
  | 'Paystack'
  | 'Flutterwave'
  | 'MercadoPago'
  | 'Coinbase'
  | 'Skrill'
  | 'BankTransfer'
  | 'Payoneer'
  | string;

export interface GatewayBaseConfig {
  enabled: boolean;
  mode?: 'sandbox' | 'live' | 'manual';
  currency?: string;
}

export interface StripeGatewayConfig extends GatewayBaseConfig {
  publishableKey: string;
  secretKey: string;
}

export interface PayPalGatewayConfig extends GatewayBaseConfig {
  clientId: string;
  secretKey: string;
}

export interface ShurjopayGatewayConfig extends GatewayBaseConfig {
  merchantUsername: string;
  merchantPassword: string;
  keyPrefix: string;
}

export interface SSLCommerzGatewayConfig extends GatewayBaseConfig {
  storeId: string;
  storePassword: string;
}

export interface AamarPayGatewayConfig extends GatewayBaseConfig {
  storeId: string;
  signatureKey: string;
}

export interface RazorpayGatewayConfig extends GatewayBaseConfig {
  keyId: string;
  keySecret: string;
}

export interface MollieGatewayConfig extends GatewayBaseConfig {
  apiKey: string;
}

export interface PaystackGatewayConfig extends GatewayBaseConfig {
  publicKey: string;
  secretKey: string;
}

export interface FlutterwaveGatewayConfig extends GatewayBaseConfig {
  publicKey: string;
  secretKey: string;
  encryptionKey?: string;
}

export interface MercadoPagoGatewayConfig extends GatewayBaseConfig {
  accessToken: string;
  publicKey?: string;
}

export interface CoinbaseGatewayConfig extends GatewayBaseConfig {
  apiKey: string;
  webhookSecret?: string;
}

export interface SkrillGatewayConfig extends GatewayBaseConfig {
  merchantEmail: string;
  secretWord: string;
}

export interface ManualMobileGatewayConfig extends GatewayBaseConfig {
  merchantNumber: string;
  type?: string;
  instructions: string;
  qrCodeUrl?: string;
}

export interface BankTransferGatewayConfig extends GatewayBaseConfig {
  bankName: string;
  accountName?: string;
  accountNumber: string;
  routingNumber: string;
  swift: string;
  branchName?: string;
  instructions: string;
}

export interface BinanceGatewayConfig extends GatewayBaseConfig {
  payId: string;
  usdtAddress?: string;
  network?: string;
  instructions: string;
  qrCodeUrl?: string;
}

export interface PayoneerGatewayConfig extends GatewayBaseConfig {
  email: string;
  instructions: string;
}

export interface CustomPaymentGateway {
  id: string;
  name: string;
  iconUrl?: string;
  category?: 'cards' | 'mobile' | 'crypto' | 'bank' | 'wallet' | 'other';
  enabled: boolean;
  instructions: string;
  accountDetails: string;
  requireProof?: boolean;
  requiredFields?: string[];
  qrCodeUrl?: string;
  mode?: 'manual' | 'automated';
}

export interface PaymentSettingsData {
  stripe: StripeGatewayConfig;
  paypal: PayPalGatewayConfig;
  shurjopay: ShurjopayGatewayConfig;
  sslcommerz: SSLCommerzGatewayConfig;
  aamarpay: AamarPayGatewayConfig;
  razorpay: RazorpayGatewayConfig;
  mollie: MollieGatewayConfig;
  paystack: PaystackGatewayConfig;
  flutterwave: FlutterwaveGatewayConfig;
  mercadopago: MercadoPagoGatewayConfig;
  coinbase: CoinbaseGatewayConfig;
  skrill: SkrillGatewayConfig;
  bkash: ManualMobileGatewayConfig;
  nagad: ManualMobileGatewayConfig;
  rocket: ManualMobileGatewayConfig;
  binance: BinanceGatewayConfig;
  bankTransfer: BankTransferGatewayConfig;
  payoneer: PayoneerGatewayConfig;
  customGateways: CustomPaymentGateway[];
  globalCurrency: string;
  exchangeRates: Record<string, number>;
  updatedAt?: string;
}

export interface OrderState {
  product: Product | null;
  paymentMethod: PaymentMethod;
  customerPhone: string;
  customerEmail: string;
  trxId: string;
  isVerified: boolean;
}

export interface PurchasedProduct {
  id: string;
  title: string;
  category: string;
  image: string;
  downloadUrl: string;
  licenseKey: string;
  purchaseDate: string;
  priceBdt?: number;
  priceUsd?: number;
}

export interface HeroSlideItem {
  id: string;
  title: string;
  tag: string;
  badge: string;
  imageUrl: string;
  previewUrl?: string;
  buyUrl?: string;
  originalPriceBDT?: number;
  salePriceBDT?: number;
  discountPercent?: number;
}

export interface HeroBannerSlide {
  id: number;
  badge: string;
  headline: string;
  subtext: string;
  imageUrl: string;
  actionLink: string;
  actionText: string;
}

export interface HeroBannersData {
  banners: HeroBannerSlide[];
  autoPlayInterval: number;
  isEnabled: boolean;
  updatedAt?: string;
}

export interface DynamicCategoryItem {
  id: string;
  name: string;
  iconEmoji: string;
  sortOrder: number;
}

export interface TelegramConfig {
  botToken: string;
  chatId: string;
  enabled: boolean;
}

export interface VideoAdItem {
  enabled: boolean;
  type: 'banner' | 'script' | 'custom';
  title?: string;
  badge?: string;
  subtext?: string;
  imageUrl?: string;
  targetUrl?: string;
  ctaText?: string;
  scriptHtml?: string;
}

export interface PreviewVideoAdsConfig {
  enabled: boolean;
  topBannerAd: VideoAdItem;
  bottomNativeAd: VideoAdItem;
}

export interface GlobalConfig {
  maintenanceMode?: boolean;
  maintenance?: boolean;
  notice?: string;
  telegram?: TelegramConfig;
  previewVideoAds?: PreviewVideoAdsConfig;
  branding: {
    siteName: string;
    slogan: string;
    tagline?: string;
    logoUrl: string;
    darkLogoUrl?: string;
    faviconUrl: string;
    avatarUrl: string;
    whatsappNumber: string;
    announcement?: string;
  };
  heroSliders: HeroSlideItem[];
  categories: DynamicCategoryItem[];
  paymentGateways: {
    bkashNumber: string;
    nagadNumber: string;
    rocketNumber: string;
    binancePayId: string;
    bkashQr: string;
    nagadQr: string;
    paymentInstructions: string;
  };
  gateways?: {
    bkashNumber: string;
    nagadNumber: string;
    rocketNumber: string;
    binancePayId: string;
    bkashQr: string;
    nagadQr: string;
    paymentInstructions: string;
  };
  footerAndBadges: {
    sslText: string;
    deliveryNote: string;
    securityText: string;
    copyrightNotice: string;
    noticeBarText: string;
    supportEmail: string;
    supportPhone: string;
    facebookUrl: string;
    youtubeUrl: string;
    telegramUrl: string;
    whatsappGroupUrl: string;
    maintenanceMode: boolean;
    autoApproveOrders: boolean;
    aboutText?: string;
    copyright?: string;
    address?: string;
    whatsapp?: string;
  };
  homeContent?: {
    productGridHeading: string;
    loadMoreText: string;
    trustMetrics: {
      stat1Value: string;
      stat1Badge: string;
      stat1Label: string;
      stat2Value: string;
      stat2Label: string;
      stat3Value: string;
      stat3Badge: string;
      stat3Label: string;
    };
    faq: {
      badge: string;
      heading: string;
      headingHighlight: string;
      description: string;
    };
    aboutContact: {
      hero: {
        titleEn: string;
        titleBn: string;
        subtitleEn: string;
        subtitleBn: string;
      };
      mission: {
        headingEn: string;
        headingBn: string;
        subtextEn: string;
        descriptionEn: string;
        descriptionBn: string;
      };
      founderDetails: {
        location: string;
        experience: string;
        protection: string;
        bioText: string;
      };
      contactBadges: {
        addressLabel: string;
        addressValue: string;
        addressSubtext: string;
        emailLabel: string;
        emailValue: string;
        emailSubtext: string;
      };
      whatsappBox: {
        label: string;
        descriptionEn: string;
        descriptionBn: string;
        buttonText: string;
      };
    };
    privacyPolicy: {
      hero: { titleEn: string; titleBn: string; subtitleEn: string; subtitleBn: string; };
      commitment: { titleEn: string; titleBn: string; descriptionEn: string; descriptionBn: string; };
    };
    refundPolicy: {
      hero: { titleEn: string; titleBn: string; subtitleEn: string; subtitleBn: string; };
      guarantee: { badge: string; titleEn: string; titleBn: string; descriptionEn: string; descriptionBn: string; };
    };
    termsOfService: {
      hero: { titleEn: string; titleBn: string; subtitleEn: string; subtitleBn: string; };
      license: { titleEn: string; titleBn: string; descriptionEn: string; };
    };
  };
}

export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  telegram: {
    botToken: '',
    chatId: '',
    enabled: true
  },
  previewVideoAds: {
    enabled: true,
    topBannerAd: {
      enabled: true,
      type: 'banner',
      title: '⚡ Exclusive VIP All-In-One Access Pack 2026',
      badge: 'SPONSORED',
      subtext: 'Get instant cloud access to 50,000+ premium verified source codes & bundles.',
      imageUrl: '',
      targetUrl: 'https://filemarket.site',
      ctaText: 'Claim 70% Off',
      scriptHtml: ''
    },
    bottomNativeAd: {
      enabled: true,
      type: 'custom',
      title: '🚀 Join Official Telegram VIP Channel',
      badge: 'EXCLUSIVE OFFER',
      subtext: 'Daily free premium digital tools, Canva Pro templates, and fast-track support.',
      imageUrl: '',
      targetUrl: 'https://t.me/filemarket',
      ctaText: 'Join VIP Free',
      scriptHtml: ''
    }
  },
  branding: {
    siteName: 'FileMarket',
    slogan: "Bangladesh's Premier Digital Asset Marketplace & Cloud Locker",
    logoUrl: 'https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10',
    faviconUrl: 'https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10',
    avatarUrl: 'https://lh3.googleusercontent.com/d/1XORisly52YSBcNc4Iukz60y9ho9GrEuE',
    whatsappNumber: '8801673833783',
  },
  heroSliders: [
    {
      id: 'slide-1',
      title: '4K Cinematic Video Bundles & Motion FX Pack 2026',
      tag: 'Video Bundles',
      badge: 'Best Seller',
      imageUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1200&q=80',
      previewUrl: 'https://filemarket.site',
      originalPriceBDT: 1500,
      salePriceBDT: 499,
      discountPercent: 67,
    },
    {
      id: 'slide-2',
      title: 'Full-Stack MERN & AI Software Development Masterclass',
      tag: 'Online Courses',
      badge: 'Verified',
      imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
      originalPriceBDT: 2500,
      salePriceBDT: 799,
      discountPercent: 68,
    },
    {
      id: 'slide-3',
      title: '10,000+ Supercharged Midjourney & ChatGPT Prompt Vault',
      tag: 'AI Prompts',
      badge: 'Hot Deal',
      imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      originalPriceBDT: 1200,
      salePriceBDT: 350,
      discountPercent: 71,
    }
  ],
  categories: [
    { id: 'cat-0', name: 'Digital Services', iconEmoji: '🛠️', sortOrder: 1 },
    { id: 'cat-1', name: 'Video Bundles', iconEmoji: '🎬', sortOrder: 2 },
    { id: 'cat-2', name: 'Online Courses', iconEmoji: '🎓', sortOrder: 3 },
    { id: 'cat-3', name: 'E-Books', iconEmoji: '📚', sortOrder: 4 },
    { id: 'cat-4', name: 'Premium Apps', iconEmoji: '📱', sortOrder: 5 },
    { id: 'cat-5', name: 'Premium PC Software', iconEmoji: '💻', sortOrder: 6 },
    { id: 'cat-6', name: 'AI Prompts', iconEmoji: '🤖', sortOrder: 7 },
    { id: 'cat-7', name: 'PHP Scripts', iconEmoji: '⚡', sortOrder: 8 },
    { id: 'cat-8', name: 'Blogger Templates', iconEmoji: '🎨', sortOrder: 9 },
    { id: 'cat-9', name: 'Others', iconEmoji: '📦', sortOrder: 10 }
  ],
  paymentGateways: {
    bkashNumber: '01673833783',
    nagadNumber: '01673833783',
    rocketNumber: '01673833783',
    binancePayId: '874592014',
    bkashQr: 'https://lh3.googleusercontent.com/d/1B-mR6Tc-KaZGWejKJap3gjN_YrPKPfYm',
    nagadQr: 'https://lh3.googleusercontent.com/d/1B-mR6Tc-KaZGWejKJap3gjN_YrPKPfYm',
    paymentInstructions: 'Send Send Money to the numbers above and enter your TrxID for instant automated access approval.',
  },
  footerAndBadges: {
    sslText: '100% Secure 256-Bit SSL Encrypted Transactions',
    deliveryNote: 'Instant Cloud Locker Access after bKash/Nagad TrxID Verification',
    securityText: 'Virus-Free & Lifetime Unlimited Downloads',
    copyrightNotice: '© 2026 FileMarket.site. All Rights Reserved.',
    noticeBarText: '⚡ Flash Sale Live: Get 70% Off All Video & Course Bundles Today!',
    supportEmail: 'support@filemarket.site',
    supportPhone: '+8801673833783',
    facebookUrl: 'https://facebook.com/filemarket',
    youtubeUrl: 'https://youtube.com/filemarket',
    telegramUrl: 'https://t.me/filemarket',
    whatsappGroupUrl: 'https://chat.whatsapp.com/filemarket',
    maintenanceMode: false,
    autoApproveOrders: false,
  },
  homeContent: {
    productGridHeading: 'Featured Digital Marketplace Assets',
    loadMoreText: 'Load Next Products',
    trustMetrics: {
      stat1Value: '1,500+',
      stat1Badge: 'Verified',
      stat1Label: 'Happy Bangladeshi Creators',
      stat2Value: '100% Virus-Free',
      stat2Label: 'Tested & Malware Scanned',
      stat3Value: 'Instant Delivery',
      stat3Badge: 'Auto Unlock',
      stat3Label: 'bKash • Nagad • Google Drive',
    },
    faq: {
      badge: 'FAQ & Knowledge Base',
      heading: 'Got Questions?',
      headingHighlight: "We've Got Answers",
      description: 'Everything you need to know about purchasing, accessing, and licensing digital assets from FileMarket.',
    },
    aboutContact: {
      hero: {
        titleEn: 'About FileMarket & Founder Contact',
        titleBn: 'আমাদের সম্পর্কে ও যোগাযোগ',
        subtitleEn: "Learn about Bangladesh's premier automated digital assets marketplace and get in touch directly with our leadership and support architects.",
        subtitleBn: 'বাংলাদেশের ডিজিটাল মার্কেটের নির্ভরযোগ্য প্ল্যাটফর্ম ও প্রতিষ্ঠাতা পরিচিতি।',
      },
      mission: {
        headingEn: 'Marketplace Mission',
        headingBn: 'আমাদের লক্ষ্য',
        subtextEn: 'Pioneering frictionless digital trade for Bangladeshi creators and coders',
        descriptionEn: 'FileMarket.site was created to break foreign currency barriers for Bangladeshi creators, freelance video editors, software engineers, and digital marketers. We curate high-ticket, virus-free creative and coding tools at affordable BDT prices with instant automated bKash & Nagad delivery.',
        descriptionBn: 'আন্তর্জাতিক মানের প্রিমিয়াম ডিজিটাল টুলস ও ভিডিও রিসোর্স বাংলাদেশি ক্রিয়েটরদের জন্য সাশ্রয়ী মূল্যে সহজলভ্য করাই আমাদের মূল লক্ষ্য।',
      },
      founderDetails: {
        location: '📍 Bayzid, Chittagong, Bangladesh',
        experience: '⚡ 10+ Years Web Experience',
        protection: '🛡️ 100% Refund Protected',
        bioText: 'Full-stack developer, cloud architect, and digital assets curator based in Chittagong, Bangladesh. Committed to 100% authentic digital downloads with direct personalized founder support.',
      },
      contactBadges: {
        addressLabel: 'Registered Headquarters',
        addressValue: 'Bayzid Bostami, Chittagong - 4214, Bangladesh.',
        addressSubtext: 'অফিসিয়াল যোগাযোগ ও পার্টনারশিপ অনুসন্ধানের ঠিকানা।',
        emailLabel: 'Official Support Email (24/7 Response)',
        emailValue: 'filemarket.help@gmail.com',
        emailSubtext: 'যেকোনো অর্ডার সমস্যা বা অনুসন্ধানে দ্রুত রিপ্লাই দেওয়া হয়।',
      },
      whatsappBox: {
        label: 'Instant Founder WhatsApp Line (সরাসরি হোয়াটসঅ্যাপ)',
        descriptionEn: 'Direct one-on-one assistance for custom orders, bKash verification, or instant refunds.',
        descriptionBn: 'যেকোনো প্রয়োজনে সরাসরি আমাদের হোয়াটসঅ্যাপে মেসেজ করুন।',
        buttonText: 'Chat on WhatsApp (+8801673833783)',
      },
    },
    privacyPolicy: {
      hero: {
        titleEn: 'Privacy Policy & Data Security',
        titleBn: 'প্রাইভেসি পলিসি ও তথ্য নিরাপত্তা',
        subtitleEn: 'Complete transparency on customer data protection, transaction confidentiality, and digital asset security across FileMarket.site.',
        subtitleBn: 'আমাদের ওয়েবসাইটে আপনার সমস্ত তথ্যের ১০০% গোপনীয়তা ও সুরক্ষা নিশ্চিত করা হয়।',
      },
      commitment: {
        titleEn: 'Zero-Knowledge Privacy Commitment',
        titleBn: '১০০% নিরাপদ ডেটা সুরক্ষা',
        descriptionEn: 'At FileMarket.site, we respect your confidentiality. We operate with strict zero-knowledge principles for sensitive payment credentials and guarantee that your personal data is never sold, shared, or rented.',
        descriptionBn: 'আপনার কোনো ব্যক্তিগত তথ্য বা পেমেন্ট হিস্ট্রি কোনো তৃতীয় পক্ষের সাথে শেয়ার করা হয় না।',
      },
    },
    refundPolicy: {
      hero: {
        titleEn: '100% Money-Back Refund Guarantee',
        titleBn: '১০০% মানিব্যাক রিফান্ড পলিসি',
        subtitleEn: 'Unmatched buyer protection with our 24-48 hour instant refund policy for any defective, broken, or mismatched digital assets.',
        subtitleBn: 'ফাইলের লিংক কাজ না করলে বা কোনো সমস্যা থাকলে ২৪-৪৮ ঘণ্টার মধ্যে ১০০% টাকা ফেরত।',
      },
      guarantee: {
        badge: '⭐ Zero Risk Buyer Protection',
        titleEn: 'Zero Risk, Guaranteed Buyer Satisfaction',
        titleBn: '১০০% ঝুঁকিমুক্ত কেনাকাটার নিশ্চয়তা',
        descriptionEn: 'If the digital product you purchased from FileMarket does not match the product description, has corrupted archive files, or contains broken Google Drive download links that our team cannot fix within 24 hours, you receive an instant 100% money-back cash refund to your bKash or Nagad wallet.',
        descriptionBn: 'যদি ড্রাইভ লিংক নষ্ট থাকে বা প্রোডাক্টে ত্রুটি থাকে এবং আমরা সমাধান করতে না পারি, তবে সম্পূর্ণ টাকা ফেরত পাবেন।',
      },
    },
    termsOfService: {
      hero: {
        titleEn: 'Terms of Service & Licensing',
        titleBn: 'ব্যবহারের শর্তাবলী ও লাইসেন্স',
        subtitleEn: 'Clear digital asset licensing rights, commercial fair usage rules, and buyer responsibilities on FileMarket.site.',
        subtitleBn: 'ফাইলমার্কেট থেকে ডিজিটাল অ্যাসেট ব্যবহারের লাইসেন্স ও নিয়মনীতি।',
      },
      license: {
        titleEn: 'Lifetime Commercial License',
        titleBn: 'লাইফটাইম কমার্শিয়াল অধিকার',
        descriptionEn: 'Every digital asset purchased on FileMarket grants you a perpetual, royalty-free license for commercial and creative outputs:',
      },
    },
  },
};


