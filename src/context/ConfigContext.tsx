import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { GlobalConfig, DEFAULT_GLOBAL_CONFIG } from '../types';

export interface SiteConfigData {
  siteName: string;
  tagline: string;
  logoUrl: string;
  avatarUrl: string;
  whatsappNumber: string;
  heroBanners: any[];
  categories: any[];
  footerText: string;
  [key: string]: any;
}

export interface ConfigContextType {
  siteConfig: SiteConfigData;
  globalConfig: GlobalConfig;
  loading: boolean;
  updateSiteConfig: (newConfig: any) => Promise<void>;
  saveGlobalConfig: (newConfig: GlobalConfig) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>(() => {
    if (typeof window === 'undefined') return DEFAULT_GLOBAL_CONFIG;
    try {
      const saved = localStorage.getItem('fm_global_config');
      return saved ? JSON.parse(saved) : DEFAULT_GLOBAL_CONFIG;
    } catch {
      return DEFAULT_GLOBAL_CONFIG;
    }
  });

  const [siteConfig, setSiteConfig] = useState<SiteConfigData>({
    siteName: DEFAULT_GLOBAL_CONFIG.branding.siteName,
    tagline: DEFAULT_GLOBAL_CONFIG.branding.tagline || DEFAULT_GLOBAL_CONFIG.branding.slogan,
    logoUrl: DEFAULT_GLOBAL_CONFIG.branding.logoUrl,
    avatarUrl: DEFAULT_GLOBAL_CONFIG.branding.avatarUrl,
    whatsappNumber: DEFAULT_GLOBAL_CONFIG.branding.whatsappNumber,
    heroBanners: DEFAULT_GLOBAL_CONFIG.heroSliders,
    categories: DEFAULT_GLOBAL_CONFIG.categories,
    footerText: DEFAULT_GLOBAL_CONFIG.footerAndBadges.copyrightNotice,
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Real-time listener for site settings in Firestore settings/global_config
  useEffect(() => {
    const configDocRef = doc(db, 'settings', 'global_config');
    const unsubscribe = onSnapshot(
      configDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const rawData = docSnap.data();
          const mergedGlobalConfig: GlobalConfig = {
            branding: {
              ...DEFAULT_GLOBAL_CONFIG.branding,
              ...(rawData.branding || {}),
              siteName: rawData.siteName || rawData.branding?.siteName || DEFAULT_GLOBAL_CONFIG.branding.siteName,
              tagline: rawData.tagline || rawData.branding?.tagline || DEFAULT_GLOBAL_CONFIG.branding.tagline,
              logoUrl: rawData.logoUrl || rawData.branding?.logoUrl || DEFAULT_GLOBAL_CONFIG.branding.logoUrl,
              avatarUrl: rawData.avatarUrl || rawData.branding?.avatarUrl || DEFAULT_GLOBAL_CONFIG.branding.avatarUrl,
              whatsappNumber: rawData.whatsappNumber || rawData.branding?.whatsappNumber || DEFAULT_GLOBAL_CONFIG.branding.whatsappNumber,
            },
            heroSliders: rawData.heroBanners || rawData.heroSliders || DEFAULT_GLOBAL_CONFIG.heroSliders,
            categories: rawData.categories || DEFAULT_GLOBAL_CONFIG.categories,
            paymentGateways: {
              ...DEFAULT_GLOBAL_CONFIG.paymentGateways,
              ...(rawData.paymentGateways || rawData.gateways || {}),
            },
            gateways: {
              ...DEFAULT_GLOBAL_CONFIG.paymentGateways,
              ...(rawData.paymentGateways || rawData.gateways || {}),
            },
            footerAndBadges: {
              ...DEFAULT_GLOBAL_CONFIG.footerAndBadges,
              ...(rawData.footerAndBadges || {}),
              copyrightNotice: rawData.footerText || rawData.footerAndBadges?.copyrightNotice || DEFAULT_GLOBAL_CONFIG.footerAndBadges.copyrightNotice,
            },
          };

          setGlobalConfig(mergedGlobalConfig);

          setSiteConfig({
            siteName: mergedGlobalConfig.branding.siteName,
            tagline: mergedGlobalConfig.branding.tagline || mergedGlobalConfig.branding.slogan,
            logoUrl: mergedGlobalConfig.branding.logoUrl,
            avatarUrl: mergedGlobalConfig.branding.avatarUrl,
            whatsappNumber: mergedGlobalConfig.branding.whatsappNumber,
            heroBanners: mergedGlobalConfig.heroSliders,
            categories: mergedGlobalConfig.categories,
            footerText: mergedGlobalConfig.footerAndBadges.copyrightNotice,
            ...rawData,
          });

          try {
            localStorage.setItem('fm_global_config', JSON.stringify(mergedGlobalConfig));
          } catch (e) {}
        } else {
          // Initialize doc with default
          setDoc(configDocRef, DEFAULT_GLOBAL_CONFIG, { merge: true }).catch(console.warn);
        }
        setLoading(false);
      },
      (error) => {
        console.warn("Realtime config sync error, using fallback:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Update function used by Admin Panel
  const updateSiteConfig = async (newConfig: any) => {
    const configDocRef = doc(db, 'settings', 'global_config');
    try {
      await setDoc(configDocRef, newConfig, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/global_config');
    }
  };

  const saveGlobalConfig = async (newConfig: GlobalConfig) => {
    await updateSiteConfig(newConfig);
  };

  return (
    <ConfigContext.Provider
      value={{
        siteConfig,
        globalConfig,
        loading,
        updateSiteConfig,
        saveGlobalConfig,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
