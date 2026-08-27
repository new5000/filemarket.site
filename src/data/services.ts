export interface DigitalService {
  id: string;
  title: string;
  category: 'Digital Services';
  tagline: string;
  description: string;
  priceStartingBDT: number;
  priceStartingUSD: number;
  deliveryTime: string;
  badge?: string;
  iconName: 'PlayStore' | 'Website' | 'MobileApp' | 'Seo' | 'Gateway';
  rating: number;
  completedOrders: number;
  features: string[];
  scopeIncludes: string[];
  techStack?: string[];
  whatsappMessage: string;
}

export const DIGITAL_SERVICES: DigitalService[] = [
  {
    id: 'srv-001',
    title: 'Play Store App Upload & Publishing',
    category: 'Digital Services',
    tagline: 'Guaranteed 100% Policy-Compliant Google Play Store Launch',
    description: 'Get your Android application professionally uploaded, signed, and published on Google Play Store with full compliance, 20 testers setup, and ASO metadata optimization.',
    priceStartingBDT: 1500,
    priceStartingUSD: 15,
    deliveryTime: '24–48 Hours',
    badge: '⚡ Fast Approval',
    iconName: 'PlayStore',
    rating: 4.95,
    completedOrders: 184,
    features: [
      'Fast Google Play Store approval assistance',
      'Basic ASO (App Store Optimization) for higher ranking',
      '100% Google Developer Policy compliance check',
      '20 Closed Testers setup & requirement management',
      'App Signing Keystore generation & SHA-256 fingerprinting',
      'Data Safety Form & Privacy Policy URL hosting included'
    ],
    scopeIncludes: [
      'AAB / APK Bundle verification',
      'Store listing icons, featured graphics & screenshots formatting',
      'Target API 34+ compliance inspection',
      'Direct WhatsApp status updates until live on Play Store'
    ],
    techStack: ['Google Play Console', 'Android Studio', 'ASO Tools', 'Cloudflare DNS'],
    whatsappMessage: "Hi Joy, I am interested in your Play Store App Upload & Publishing service on FileMarket. I would like to get my Android app published on Google Play Store."
  },
  {
    id: 'srv-002',
    title: 'Custom Website Development',
    category: 'Digital Services',
    tagline: 'High-Converting, Lightning-Fast Web Platforms',
    description: 'Modern, fully responsive, and SEO-optimized custom website development built with Next.js, React, Tailwind CSS, or WordPress with an easy-to-use admin control panel.',
    priceStartingBDT: 4999,
    priceStartingUSD: 49,
    deliveryTime: '3–5 Days',
    badge: '🚀 Most Popular',
    iconName: 'Website',
    rating: 4.98,
    completedOrders: 236,
    features: [
      '100% Responsive design across mobile, tablet, and desktop',
      'Rank #1 SEO optimized schema, metadata & sitemaps',
      'Intuitive Admin Panel / CMS for easy content management',
      'Ultra-fast Google PageSpeed (95+ Performance score)',
      'bKash, Nagad, Stripe, or manual checkout integration',
      'Free SSL setup, Cloudflare CDN & Domain configuration'
    ],
    scopeIncludes: [
      'Modern UI/UX wireframe & clean interactive frontend',
      'Database integration (PostgreSQL / Firestore / MongoDB)',
      'Contact forms & WhatsApp direct chat widget',
      '1 Month of complimentary maintenance & security support'
    ],
    techStack: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript', 'Node.js', 'WordPress'],
    whatsappMessage: "Hi Joy, I am interested in your Custom Website Development service on FileMarket. Let's discuss my website project requirements and timeline."
  },
  {
    id: 'srv-003',
    title: 'Custom App Development',
    category: 'Digital Services',
    tagline: 'Native-Quality Cross-Platform iOS & Android Apps',
    description: 'End-to-end custom mobile application development crafted with Flutter or React Native. Features clean architecture, realtime Firebase backend, smooth animations, and high performance.',
    priceStartingBDT: 9999,
    priceStartingUSD: 99,
    deliveryTime: '7–14 Days',
    badge: '💎 Full Stack Solution',
    iconName: 'MobileApp',
    rating: 5.0,
    completedOrders: 112,
    features: [
      'Cross-platform single codebase for Android & iOS',
      'Modern, intuitive UI/UX with smooth 60fps micro-animations',
      'High-performance realtime Firebase / Supabase backend',
      'Push notifications, user authentication & profile engine',
      'In-app purchases, digital product lockers, or gateway payment',
      'Complete clean source code repository transfer'
    ],
    scopeIncludes: [
      'UI/UX prototype design in Figma',
      'Full backend API & database modeling',
      'Release-ready APK/AAB builds & IPA packaging',
      'App Store & Play Store publication assistance included'
    ],
    techStack: ['Flutter', 'React Native', 'Firebase', 'Node.js', 'REST API'],
    whatsappMessage: "Hi Joy, I am interested in your Custom App Development service on FileMarket. Let's discuss my mobile app idea, features, and quote."
  },
  {
    id: 'srv-004',
    title: 'Payment Gateway Integration',
    category: 'Digital Services',
    tagline: 'Automated bKash, Nagad, Rocket & Global Card Processing',
    description: 'Seamless integration of Bangladeshi merchant APIs (bKash PGW, Nagad, SSLCommerz, Shurjopay) or global gateways (Stripe, Binance Pay, PayPal) into your website or mobile app.',
    priceStartingBDT: 2999,
    priceStartingUSD: 29,
    deliveryTime: '24–48 Hours',
    badge: '💳 Instant TrxID',
    iconName: 'Gateway',
    rating: 4.92,
    completedOrders: 94,
    features: [
      'Instant automated TrxID verification or direct redirect payment',
      'bKash Tokenized Checkout & Nagad Payment API support',
      'Secure webhook listeners with fail-safe database callbacks',
      'Automated invoice generation & digital receipt emailing',
      'Sandbox testing & live production credential onboarding'
    ],
    scopeIncludes: [
      'Backend middleware integration',
      'Frontend checkout button & modal triggers',
      'Error handling & refund workflow logic',
      'Complete security token validation'
    ],
    techStack: ['bKash PGW API', 'Nagad API', 'Stripe', 'Node.js', 'PHP / Laravel'],
    whatsappMessage: "Hi Joy, I am interested in your Payment Gateway Integration service on FileMarket. I want to integrate bKash / Nagad / Stripe into my platform."
  }
];
