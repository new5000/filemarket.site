import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Currency, AppLanguage, GlobalConfig, DEFAULT_GLOBAL_CONFIG, HeroBannersData } from '../types';
import { subscribeGlobalConfig } from '../lib/adminServices';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { translations, getTranslation } from '../utils/i18n';


export interface PaymentMethodsData {
  bKash: { number: string; type: string; active: boolean };
  nagad: { number: string; type: string; active: boolean };
  rocket: { number: string; type: string; active: boolean };
  binance: { payId: string; active: boolean };
}


export interface GeneralConfigData {
  siteTitle?: string;
  siteTagline?: string;
  siteDescription?: string;
  physicalAddress?: string;
  supportEmail?: string;
  headerLogoUrl?: string;
  faviconUrl?: string;
  founderAvatarUrl?: string;
  playStoreEnabled?: boolean;
  playStoreUrl?: string;
  imageSizes?: {
    logoWidth?: number;
    logoHeight?: number;
    productThumbRatio?: string;
    bannerHeight?: number;
  };
  socialLinks?: {
    telegram?: string;
    whatsapp?: string;
  };
}


export interface ProductGuaranteeData {
  fastTrack: {
    badge: string;
    title: string;
    description: string;
    buttonText: string;
    isEnabled: boolean;
  };
  guarantee: {
    titleBN: string;
    titleEN: string;
    description: string;
    isEnabled: boolean;
  };
}

export type ThemeMode = 'day' | 'night';

interface GlobalSettingsContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  toggleCurrency: () => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  changeLanguage: (lang: AppLanguage) => void;
  i18n: { language: AppLanguage };
  t: (key: keyof typeof translations['en']) => string;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode | ((prev: ThemeMode) => ThemeMode)) => void;
  toggleTheme: () => void;
  darkMode: boolean;
  setDarkMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleDarkMode: () => void;
  globalConfig: GlobalConfig;
  paymentMethods: PaymentMethodsData | null;
  generalConfig: GeneralConfigData | null;
  supportLinks: { whatsappNumber: string; telegramLink: string; supportEmail?: string; playStoreEnabled?: boolean; playStoreUrl?: string } | null;
  heroBanners: HeroBannersData | null;
  productGuarantee: ProductGuaranteeData | null;
}

const GlobalSettingsContext = createContext<GlobalSettingsContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = 'filemarket_currency';
const LANGUAGE_STORAGE_KEY = 'filemarket_language';


export const DEFAULT_PRODUCT_GUARANTEE: ProductGuaranteeData = {
  fastTrack: {
    badge: "⚡ Direct Founder Fast-Track Desk",
    title: "Need Instant Fast-Track Approval or Direct Support?",
    description: "Connect directly with FileMarket Support on WhatsApp for 1-on-1 payment assistance and instant access delivery.",
    buttonText: "⚡ Fast-Track Approval via WhatsApp",
    isEnabled: true
  },
  guarantee: {
    titleBN: "১০০% মানি-ব্যাক গ্যারান্টি",
    titleEN: "100% Money-Back Quality Protection",
    description: "ফাইলে কোনো সমস্যা থাকলে বা ডেসক্রিপশন অনুযায়ী না হলে ২৪ ঘণ্টার মধ্যে ১০০% রিফান্ড! Instant 100% refund if asset is defective or not as described.",
    isEnabled: true
  }
};

export const DEFAULT_HERO_BANNERS: HeroBannersData = {
  banners: [
    {
      id: 1,
      badge: "⚡ Instant Access",
      headline: "Premium Source Codes & Software",
      subtext: "Direct Google Drive high-speed downloads with verified licenses.",
      imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop",
      actionLink: "/category/scripts",
      actionText: "Explore Scripts"
    },
    {
      id: 2,
      badge: "🔥 Best Seller",
      headline: "All-In-One Graphic Bundles",
      subtext: "Lifetime access to 50,000+ vector assets and UI kits.",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop",
      actionLink: "/category/graphics",
      actionText: "Browse Graphics"
    },
    {
      id: 3,
      badge: "🛡️ 100% Tested",
      headline: "Mobile Apps & UI Kits",
      subtext: "Clean production-ready Flutter and React Native project files.",
      imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop",
      actionLink: "/category/apps",
      actionText: "Get Apps"
    }
  ],
  autoPlayInterval: 5000,
  isEnabled: true
};

export const GlobalSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodsData | null>(null);
  const [generalConfig, setGeneralConfig] = useState<GeneralConfigData | null>(null);
  const [supportLinks, setSupportLinks] = useState<{ whatsappNumber: string; telegramLink: string } | null>(null);
  const [heroBanners, setHeroBanners] = useState<HeroBannersData | null>(null);
  const [productGuarantee, setProductGuarantee] = useState<ProductGuaranteeData | null>(null);


  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'product_guarantee'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ProductGuaranteeData;
        setProductGuarantee(data);
      } else {
        setProductGuarantee(DEFAULT_PRODUCT_GUARANTEE);
      }
    }, (error) => {
      console.warn("Real-time product guarantee sync error:", error);
      setProductGuarantee(DEFAULT_PRODUCT_GUARANTEE);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'support_links'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSupportLinks({
          whatsappNumber: data.whatsappNumber || '',
          telegramLink: data.telegramLink || '',
          supportEmail: data.supportEmail || '',
          playStoreEnabled: data.playStoreEnabled ?? false,
          playStoreUrl: data.playStoreUrl || ''
        });
      }
    }, (error) => {
      console.warn("Real-time support links sync error:", error);
    });
    return () => unsub();
  }, []);


  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'general_config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as GeneralConfigData;
        setGeneralConfig(data);
        if (data.faviconUrl) {
          const link = (document.querySelector("link[rel~='icon']") as HTMLLinkElement) || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'shortcut icon';
          link.href = data.faviconUrl;
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        if (data.siteTitle) {
          document.title = data.siteTitle;
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'payment_methods'), (docSnap) => {
      if (docSnap.exists()) {
        setPaymentMethods(docSnap.data() as PaymentMethodsData);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'system_settings', 'hero_banners'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setHeroBanners({
          banners: data.banners || DEFAULT_HERO_BANNERS.banners,
          autoPlayInterval: data.autoPlayInterval || 5000,
          isEnabled: data.isEnabled !== undefined ? data.isEnabled : true
        });
      } else {
        setHeroBanners(DEFAULT_HERO_BANNERS);
      }
    }, (error) => {
      console.warn("Real-time hero banners sync error:", error);
      setHeroBanners(DEFAULT_HERO_BANNERS);
    });
    return () => unsub();
  }, []);

  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_GLOBAL_CONFIG;
    try {
      const saved = localStorage.getItem('fm_global_config');
      return saved ? JSON.parse(saved) : DEFAULT_GLOBAL_CONFIG;
    } catch {
      return DEFAULT_GLOBAL_CONFIG;
    }
  });

  useEffect(() => {
    const unsub = subscribeGlobalConfig((config) => {
      setGlobalConfig(config);
    });
    return () => unsub();
  }, []);

  // 1. Currency state with localStorage persistence (Default: BDT)
  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window === 'undefined') return 'BDT';
    try {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
      return saved === 'USD' ? 'USD' : 'BDT';
    } catch {
      return 'BDT';
    }
  });

  // 2. Language state with localStorage persistence (Default: 'en')
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) || localStorage.getItem('app_language') || localStorage.getItem('i18nextLng');
      return saved === 'bn' ? 'bn' : 'en';
    } catch {
      return 'en';
    }
  });

  // 3. Theme state with localStorage persistence (Default: 'day' / Light mode)
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'day';
    try {
      const savedTheme = localStorage.getItem('theme') || localStorage.getItem('app_theme') || localStorage.getItem('filemarket_theme') || localStorage.getItem('preferred_theme') || localStorage.getItem('fm_theme');
      if (savedTheme === 'night' || savedTheme === 'dark') {
        return 'night';
      }
      return 'day'; // Default to day / Light mode
    } catch {
      return 'day';
    }
  });

  const darkMode = theme === 'night';

  // Keep HTML root class & localStorage synchronized whenever theme changes
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (theme === 'day') {
        root.classList.remove('dark');
        root.classList.add('light');
        root.setAttribute('data-theme', 'light');
      } else {
        root.classList.remove('light');
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      }
      localStorage.setItem('theme', theme === 'night' ? 'dark' : 'light');
      localStorage.setItem('app_theme', theme);
      localStorage.setItem('filemarket_theme', theme === 'night' ? 'dark' : 'light');
      localStorage.setItem('preferred_theme', theme === 'night' ? 'dark' : 'light');
      localStorage.setItem('fm_theme', theme === 'night' ? 'dark' : 'light');
    } catch (e) {
      console.warn('Could not sync theme state:', e);
    }
  }, [theme]);

  // Keep localStorage synchronized whenever currency changes
  useEffect(() => {
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    } catch (e) {
      console.warn('Could not sync currency state:', e);
    }
  }, [currency]);

  // Keep localStorage synchronized whenever language changes
  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      localStorage.setItem('app_language', language);
      document.documentElement.lang = language;
    } catch (e) {
      console.warn('Could not sync language state:', e);
    }
  }, [language]);

  // Cross-tab synchronization via window storage listener
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CURRENCY_STORAGE_KEY && e.newValue) {
        setCurrencyState(e.newValue === 'USD' ? 'USD' : 'BDT');
      }
      if ((e.key === LANGUAGE_STORAGE_KEY || e.key === 'app_language') && e.newValue) {
        setLanguageState(e.newValue === 'bn' ? 'bn' : 'en');
      }
      if (e.key === 'app_theme' || e.key === 'filemarket_theme' || e.key === 'preferred_theme' || e.key === 'fm_theme') {
        if (e.newValue) {
          setThemeState(e.newValue === 'day' || e.newValue === 'light' ? 'day' : 'night');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
    } catch {}
  }, []);

  const toggleCurrency = useCallback(() => {
    setCurrencyState((prev) => {
      const next = prev === 'BDT' ? 'USD' : 'BDT';
      try {
        localStorage.setItem(CURRENCY_STORAGE_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  const changeLanguage = useCallback((newLang: AppLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      localStorage.setItem('app_language', newLang);
    } catch {}
  }, []);

  const setLanguage = useCallback((newLang: AppLanguage) => {
    changeLanguage(newLang);
  }, [changeLanguage]);

  const t = useCallback((key: keyof typeof translations['en']): string => {
    return getTranslation(language, key);
  }, [language]);

  const setTheme = useCallback((value: ThemeMode | ((prev: ThemeMode) => ThemeMode)) => {
    setThemeState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      return next;
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'night' ? 'day' : 'night'));
  }, []);

  const setDarkMode = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setThemeState((prev) => {
      const currentDark = prev === 'night';
      const nextDark = typeof value === 'function' ? value(currentDark) : value;
      return nextDark ? 'night' : 'day';
    });
  }, []);

  const toggleDarkMode = useCallback(() => {
    setThemeState((prev) => (prev === 'night' ? 'day' : 'night'));
  }, []);

  return (
    <GlobalSettingsContext.Provider
      value={{
        currency,
        setCurrency,
        toggleCurrency,
        language,
        setLanguage,
        changeLanguage,
        i18n: { language },
        t,
        theme,
        setTheme,
        toggleTheme,
        darkMode,
        setDarkMode,
        toggleDarkMode,
        globalConfig,
        paymentMethods,
        generalConfig,
        supportLinks,
        heroBanners,
        productGuarantee,
      }}
    >
      {children}
    </GlobalSettingsContext.Provider>
  );
};

export const useGlobalSettings = (): GlobalSettingsContextType => {
  const context = useContext(GlobalSettingsContext);
  if (!context) {
    throw new Error('useGlobalSettings must be used within a GlobalSettingsProvider');
  }
  return context;
};
