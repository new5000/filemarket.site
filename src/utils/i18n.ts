import { AppLanguage } from '../types';

export const translations = {
  en: {
    language: 'Language',
    currencySwitcher: 'Currency Switcher',
    themeMode: 'Theme Mode',
    day: 'Day',
    night: 'Night',
    light: 'Light',
    dark: 'Dark',
    searchPlaceholder: 'Search 500+ premium digital assets, courses & scripts...',
    myPurchases: 'My Purchased Assets',
    wishlist: 'Saved Products / Wishlist',
    adminDashboard: 'Admin Command Center',
    logout: 'Sign Out / Logout',
    login: 'Sign In / Register',
    profile: 'Profile & Settings',
    instantDelivery: 'Instant Automated Google Drive Delivery',
    lifetimeAccess: 'Lifetime Access Guarantee',
    exploreMore: 'Explore More Products',
    categories: 'Categories',
    digitalServices: 'Custom Digital Services',
    supportWhatsapp: '24/7 WhatsApp Support',
    securePayment: 'Secure bKash, Nagad & Binance Checkout',
  },
  bn: {
    language: 'ভাষা',
    currencySwitcher: 'কারেন্সি সুইচার',
    themeMode: 'থিম মোড',
    day: 'দিন',
    night: 'রাত',
    light: 'লাইট',
    dark: 'ডার্ক',
    searchPlaceholder: '৫০০+ প্রিমিয়াম ডিজিটাল ফাইল, কোর্স ও স্ক্রিপ্ট সার্চ করুন...',
    myPurchases: 'আমার ক্রয়কৃত ফাইলসমূহ',
    wishlist: 'পছন্দের তালিকা / উইশলিস্ট',
    adminDashboard: 'অ্যাডমিন কমান্ড সেন্টার',
    logout: 'লগআউট',
    login: 'লগইন / রেজিস্টার',
    profile: 'প্রোফাইল ও সেটিংস',
    instantDelivery: 'তাত্ক্ষণিক গুগল ড্রাইভ অটোমেটিক ডেলিভারি',
    lifetimeAccess: 'লাইফটাইম অ্যাক্সেস গ্যারান্টি',
    exploreMore: 'আরও প্রোডাক্ট দেখুন',
    categories: 'ক্যাটাগরি',
    digitalServices: 'কাস্টম ডিজিটাল সার্ভিস',
    supportWhatsapp: '২৪/৭ হোয়াটসঅ্যাপ সাপোর্ট',
    securePayment: 'নিরাপদ বিকাশ, নগদ ও বাইন্যান্স পেমেন্ট',
  }
};

export function getTranslation(lang: AppLanguage, key: keyof typeof translations['en']): string {
  return translations[lang]?.[key] || translations['en'][key] || key;
}
