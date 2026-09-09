import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_FOUNDER_AVATAR, DEFAULT_USER_AVATAR } from '../utils/formatImageUrl';

export interface BrandContextType {
  logoUrl: string;
  brandName: string;
  isLoading: boolean;
  updateBrand: (logoUrl: string, brandName: string) => Promise<void>;
  
  founderAvatarUrl: string;
  founderName: string;
  founderBio: string;
  founderMessageEn: string;
  founderMessageBn: string;
  updateFounder: (founderAvatarUrl: string, founderName: string, founderBio: string, founderMessageEn?: string, founderMessageBn?: string) => Promise<void>;
}

export const DEFAULT_LOGO = "https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10";
export const DEFAULT_BRAND_NAME = "FileMarket";
export { DEFAULT_FOUNDER_AVATAR, DEFAULT_USER_AVATAR };

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('fm_logo') || localStorage.getItem('fm_header_logo') || DEFAULT_LOGO;
    } catch {
      return DEFAULT_LOGO;
    }
  });
  const [brandName, setBrandName] = useState<string>(() => {
    try {
      return localStorage.getItem('fm_brandName') || DEFAULT_BRAND_NAME;
    } catch {
      return DEFAULT_BRAND_NAME;
    }
  });
  
  const [founderAvatarUrl, setFounderAvatarUrl] = useState<string>(DEFAULT_FOUNDER_AVATAR);
  const [founderName, setFounderName] = useState<string>("Joy Barmon");
  const [founderBio, setFounderBio] = useState<string>("Founder & Lead Digital Architect");
  const [founderMessageEn, setFounderMessageEn] = useState<string>("Every asset on FileMarket is 100% verified, virus-free, and tested before upload. Direct personal WhatsApp assistance for any download or usage issue.");
  const [founderMessageBn, setFounderMessageBn] = useState<string>("FileMarket-এর প্রতিটি ফাইল, সফটওয়্যার ও কোর্স আপলোড করার আগে সম্পূর্ণ ভাইরাস-মুক্ত ও কোয়ালিটি যাচাই করা হয়। যেকোনো ডাউনলোড বা ফাইল ব্যবহারের সমস্যায় সরাসরি আমার সাথে হোয়াটসঅ্যাপে যোগাযোগ করতে পারবেন।");

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync with DOM element for direct binding
  const syncDomLogo = (url: string) => {
    if (typeof document !== 'undefined') {
      const siteLogo = document.getElementById('siteLogo') as HTMLImageElement;
      if (siteLogo) {
        siteLogo.src = url || DEFAULT_LOGO;
      }
    }
  };

  useEffect(() => {
    // 1. Initial cached values
    try {
      const cachedLogo = localStorage.getItem('fm_logo') || localStorage.getItem('fm_header_logo');
      const cachedBrand = localStorage.getItem('fm_brandName');
      if (cachedLogo) {
        setLogoUrl(cachedLogo);
        syncDomLogo(cachedLogo);
      }
      if (cachedBrand) setBrandName(cachedBrand);
    } catch (e) {}

    // 2. Real-time Firestore snapshot on system_settings/branding
    const unsubBrand = onSnapshot(doc(db, 'system_settings', 'branding'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const incomingLogo = data.headerLogoUrl || data.logoUrl;
        const incomingBrand = data.brandName || data.siteTitle || data.siteName;

        if (incomingLogo) {
          setLogoUrl(incomingLogo);
          syncDomLogo(incomingLogo);
          try {
            localStorage.setItem('fm_logo', incomingLogo);
            localStorage.setItem('fm_header_logo', incomingLogo);
          } catch {}
        }
        if (incomingBrand) {
          setBrandName(incomingBrand);
          try {
            localStorage.setItem('fm_brandName', incomingBrand);
          } catch {}
        }
        if (data.founderAvatarUrl) setFounderAvatarUrl(data.founderAvatarUrl);
      }
      setIsLoading(false);
    }, (err) => {
      console.warn("BrandContext branding listener warning:", err);
      setIsLoading(false);
    });

    // 3. Real-time Firestore snapshot on system_settings/general_config
    const unsubGeneral = onSnapshot(doc(db, 'system_settings', 'general_config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const incomingLogo = data.headerLogoUrl || data.logoUrl;
        const incomingBrand = data.siteTitle || data.brandName || data.siteName;

        if (incomingLogo) {
          setLogoUrl(incomingLogo);
          syncDomLogo(incomingLogo);
          try {
            localStorage.setItem('fm_logo', incomingLogo);
            localStorage.setItem('fm_header_logo', incomingLogo);
          } catch {}
        }
        if (incomingBrand) {
          setBrandName(incomingBrand);
          try {
            localStorage.setItem('fm_brandName', incomingBrand);
          } catch {}
        }
        if (data.founderAvatarUrl) setFounderAvatarUrl(data.founderAvatarUrl);
      }
    }, (err) => {
      console.warn("BrandContext general_config listener warning:", err);
    });

    // 4. Real-time Firestore snapshot on settings/global_config
    const unsubGlobal = onSnapshot(doc(db, 'settings', 'global_config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const incomingLogo = data.branding?.logoUrl || data.branding?.headerLogoUrl || data.logoUrl;
        const incomingBrand = data.branding?.siteName || data.siteTitle;

        if (incomingLogo) {
          setLogoUrl(incomingLogo);
          syncDomLogo(incomingLogo);
          try {
            localStorage.setItem('fm_logo', incomingLogo);
            localStorage.setItem('fm_header_logo', incomingLogo);
          } catch {}
        }
        if (incomingBrand) {
          setBrandName(incomingBrand);
        }
      }
    }, (err) => {
      console.warn("BrandContext global_config listener warning:", err);
    });

    // 5. Real-time founder profile listener
    const unsubFounder = onSnapshot(doc(db, 'system_settings', 'founder_profile'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.founderAvatarUrl) setFounderAvatarUrl(data.founderAvatarUrl);
        if (data.founderName) setFounderName(data.founderName);
        if (data.founderBio) setFounderBio(data.founderBio);
        if (data.founderMessageEn) setFounderMessageEn(data.founderMessageEn);
        if (data.founderMessageBn) setFounderMessageBn(data.founderMessageBn);
      }
    }, (err) => {
      console.warn("Founder listener warning:", err);
    });

    // 6. Window event listeners for immediate zero-latency local dispatch
    const handleLogoUpdatedEvent = (e: any) => {
      const url = e?.detail;
      if (url && typeof url === 'string') {
        setLogoUrl(url);
        syncDomLogo(url);
      }
    };
    const handleSettingsUpdatedEvent = (e: any) => {
      const data = e?.detail;
      if (data) {
        const url = data.headerLogoUrl || data.logoUrl;
        if (url) {
          setLogoUrl(url);
          syncDomLogo(url);
        }
        if (data.siteTitle) setBrandName(data.siteTitle);
      }
    };

    window.addEventListener('fm_logo_updated', handleLogoUpdatedEvent);
    window.addEventListener('fm_settings_updated', handleSettingsUpdatedEvent);

    return () => {
      unsubBrand();
      unsubGeneral();
      unsubGlobal();
      unsubFounder();
      window.removeEventListener('fm_logo_updated', handleLogoUpdatedEvent);
      window.removeEventListener('fm_settings_updated', handleSettingsUpdatedEvent);
    };
  }, []);

  const updateBrand = useCallback(async (newLogoUrl: string, newBrandName: string) => {
    const cleanLogo = (newLogoUrl || '').trim() || DEFAULT_LOGO;
    const cleanBrand = (newBrandName || '').trim() || DEFAULT_BRAND_NAME;

    // Instant local state & DOM reflection
    setLogoUrl(cleanLogo);
    setBrandName(cleanBrand);
    syncDomLogo(cleanLogo);

    try {
      localStorage.setItem('fm_logo', cleanLogo);
      localStorage.setItem('fm_header_logo', cleanLogo);
      localStorage.setItem('fm_brandName', cleanBrand);
      window.dispatchEvent(new CustomEvent('fm_logo_updated', { detail: cleanLogo }));
    } catch {}

    try {
      // Sync across all 3 central settings documents simultaneously
      await Promise.allSettled([
        setDoc(doc(db, 'system_settings', 'branding'), {
          logoUrl: cleanLogo,
          headerLogoUrl: cleanLogo,
          brandName: cleanBrand,
          siteTitle: cleanBrand,
          updatedAt: new Date().toISOString()
        }, { merge: true }),

        setDoc(doc(db, 'system_settings', 'general_config'), {
          headerLogoUrl: cleanLogo,
          logoUrl: cleanLogo,
          siteTitle: cleanBrand,
          brandName: cleanBrand,
          updatedAt: new Date().toISOString()
        }, { merge: true }),

        setDoc(doc(db, 'settings', 'global_config'), {
          branding: {
            logoUrl: cleanLogo,
            darkLogoUrl: cleanLogo,
            siteName: cleanBrand
          },
          updatedAt: new Date().toISOString()
        }, { merge: true })
      ]);
    } catch (err) {
      console.error("Failed to update brand in Firestore:", err);
      throw err;
    }
  }, []);

  const updateFounder = useCallback(async (newFounderAvatarUrl: string, newFounderName: string, newFounderBio: string, newFounderMessageEn?: string, newFounderMessageBn?: string) => {
    try {
      await setDoc(doc(db, 'system_settings', 'founder_profile'), {
        founderAvatarUrl: newFounderAvatarUrl,
        founderName: newFounderName,
        founderBio: newFounderBio,
        ...(newFounderMessageEn !== undefined && { founderMessageEn: newFounderMessageEn }),
        ...(newFounderMessageBn !== undefined && { founderMessageBn: newFounderMessageBn }),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to update founder profile:", err);
      throw err;
    }
  }, []);

  return (
    <BrandContext.Provider value={{ 
      logoUrl, brandName, isLoading, updateBrand,
      founderAvatarUrl, founderName, founderBio, founderMessageEn, founderMessageBn, updateFounder
    }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = (): BrandContextType => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};
