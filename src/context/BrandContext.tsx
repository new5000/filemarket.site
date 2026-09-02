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

const DEFAULT_LOGO = "https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10";
const DEFAULT_BRAND_NAME = "FileMarket";
export { DEFAULT_FOUNDER_AVATAR, DEFAULT_USER_AVATAR };

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logoUrl, setLogoUrl] = useState<string>(DEFAULT_LOGO);
  const [brandName, setBrandName] = useState<string>(DEFAULT_BRAND_NAME);
  
  const [founderAvatarUrl, setFounderAvatarUrl] = useState<string>(DEFAULT_FOUNDER_AVATAR);
  const [founderName, setFounderName] = useState<string>("Joy Barmon");
  const [founderBio, setFounderBio] = useState<string>("Founder & Lead Digital Architect");
  const [founderMessageEn, setFounderMessageEn] = useState<string>("Every asset on FileMarket is 100% verified, virus-free, and tested before upload. Direct personal WhatsApp assistance for any download or usage issue.");
  const [founderMessageBn, setFounderMessageBn] = useState<string>("FileMarket-এর প্রতিটি ফাইল, সফটওয়্যার ও কোর্স আপলোড করার আগে সম্পূর্ণ ভাইরাস-মুক্ত ও কোয়ালিটি যাচাই করা হয়। যেকোনো ডাউনলোড বা ফাইল ব্যবহারের সমস্যায় সরাসরি আমার সাথে হোয়াটসঅ্যাপে যোগাযোগ করতে পারবেন।");

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubBrand = onSnapshot(doc(db, 'system_settings', 'branding'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.headerLogoUrl) setLogoUrl(data.headerLogoUrl);
        if (data.brandName) setBrandName(data.brandName);
        if (data.siteTitle) setBrandName(data.siteTitle);
        if (data.siteName) setBrandName(data.siteName);
        if (data.founderAvatarUrl) setFounderAvatarUrl(data.founderAvatarUrl);
      }
      setIsLoading(false);
    }, (err) => {
      console.error("BrandContext branding listener error:", err);
      setIsLoading(false);
    });

    const unsubGeneral = onSnapshot(doc(db, 'system_settings', 'general_config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.headerLogoUrl) setLogoUrl(data.headerLogoUrl);
        else if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.siteTitle) setBrandName(data.siteTitle);
        else if (data.brandName) setBrandName(data.brandName);
        else if (data.siteName) setBrandName(data.siteName);
      }
    }, (err) => {
      console.error("BrandContext general_config listener error:", err);
    });

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
      console.error("Founder listener error:", err);
    });

    return () => {
      unsubBrand();
      unsubGeneral();
      unsubFounder();
    };
  }, []);

  const updateBrand = useCallback(async (newLogoUrl: string, newBrandName: string) => {
    try {
      await setDoc(doc(db, 'system_settings', 'branding'), {
        logoUrl: newLogoUrl,
        brandName: newBrandName,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error("Failed to update brand:", err);
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
