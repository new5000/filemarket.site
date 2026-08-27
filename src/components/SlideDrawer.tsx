import React, { useState, useEffect } from 'react';
import { X, User, Download, Sun, Moon, Sparkles, LogIn, UserPlus, LogOut, ShieldCheck, AlertCircle, CheckCircle2, Heart } from 'lucide-react';
import { Currency } from '../types';
import { formatDirectImageUrl } from '../utils/formatImageUrl';
import { getAuthStatus, performOptimisticLogout } from '../lib/authGuard';
import { navigateTo } from '../router';
import { auth, db, getUserProfileFromFirestore } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { isProfileComplete } from '../lib/profileValidation';
import { useBrand } from '../context/BrandContext';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { LanguageSelector } from './LanguageSelector';

interface SlideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  setDarkMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  onOpenProfilePage: () => void;
  onOpenMyProductsPage: () => void;
  onOpenLogin: () => void;
  onOpenSavedProducts: () => void;
  user?: any;
}

export const SlideDrawer: React.FC<SlideDrawerProps> = ({
  isOpen,
  onClose,
  darkMode,
  setDarkMode,
  currency,
  setCurrency,
  onOpenProfilePage,
  onOpenMyProductsPage,
  onOpenLogin,
  onOpenSavedProducts,
  user: externalUser,
}) => {
  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('filemarket_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [firestoreProfile, setFirestoreProfile] = useState<any>(null);
  const [masterAdminEmail, setMasterAdminEmail] = useState<string>(() => {
    return localStorage.getItem('fm_master_admin_email') || 'new144506@gmail.com';
  });
  const { globalConfig, language, changeLanguage, i18n, supportLinks } = useGlobalSettings();
  const { logoUrl, brandName } = useBrand();
  const rawWhatsapp = supportLinks?.whatsappNumber || globalConfig?.branding?.whatsappNumber || '8801673833783';
  const siteName = globalConfig?.branding?.siteName || 'FileMarket';
  const cleanWhatsappNumber = rawWhatsapp.replace(/[^0-9]/g, '') || '8801673833783';

  useEffect(() => {
    if (externalUser !== undefined) {
      setUser(externalUser);
      setIsLoggedIn(Boolean(externalUser));
    }
  }, [externalUser]);

  useEffect(() => {
    let unsubUserDoc = () => {};

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      unsubUserDoc();
      if (fbUser) {
        setIsLoggedIn(true);
        try {
          unsubUserDoc = onSnapshot(doc(db, 'users', fbUser.uid), (snap) => {
            if (snap.exists()) {
              setFirestoreProfile(snap.data());
              setUser((prev: any) => ({ ...prev, ...snap.data() }));
            }
          }, (err) => {
            console.warn('SlideDrawer user sync notice:', err);
          });
        } catch (e) {
          console.warn('SlideDrawer snapshot setup:', e);
        }
      } else {
        const isLogged = localStorage.getItem('isLoggedIn') === 'true';
        setIsLoggedIn(isLogged);
        try {
          const saved = localStorage.getItem('filemarket_user');
          setUser(saved ? JSON.parse(saved) : null);
        } catch {
          setUser(null);
        }
        setFirestoreProfile(null);
      }
    });

    const handleStorage = async () => {
      const fbUser = auth.currentUser;
      if (fbUser) {
        setIsLoggedIn(true);
        try {
          const fp = await getUserProfileFromFirestore(fbUser.uid);
          setFirestoreProfile(fp);
        } catch {
          setFirestoreProfile(null);
        }
      } else {
        const isLogged = localStorage.getItem('isLoggedIn') === 'true';
        setIsLoggedIn(isLogged);
        try {
          const saved = localStorage.getItem('filemarket_user');
          setUser(saved ? JSON.parse(saved) : null);
        } catch {
          setUser(null);
        }
        setFirestoreProfile(null);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('auth:state-changed', handleStorage);

    if (isOpen) {
      handleStorage();
    }

    return () => {
      unsubAuth();
      unsubUserDoc();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auth:state-changed', handleStorage);
    };
  }, [isOpen]);

  const handleLogout = () => {
    // Instant optimistic logout
    performOptimisticLogout();
    setIsLoggedIn(false);
    setUser(null);
    setFirestoreProfile(null);
    setShowLogoutModal(false);
    onClose();
    setToastMessage('Logged out successfully!');
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  useEffect(() => {
    let unsubAdmin = () => {};
    try {
      unsubAdmin = onSnapshot(doc(db, 'settings', 'admin_access'), (snap) => {
        if (snap.exists() && snap.data().masterEmail) {
          const email = snap.data().masterEmail.trim().toLowerCase();
          setMasterAdminEmail(email);
          localStorage.setItem('fm_master_admin_email', email);
        }
      }, (err) => {
        console.warn('SlideDrawer admin email listener fallback:', err);
      });
    } catch {}

    return () => unsubAdmin();
  }, []);

  const fbUser = auth.currentUser;
  const displayName = firestoreProfile?.fullName || fbUser?.displayName || user?.fullName || user?.name || (fbUser?.email ? fbUser.email.split('@')[0] : 'User');
  const displayEmail = fbUser?.email || firestoreProfile?.email || user?.email || '';
  const displayPhoto = fbUser?.photoURL || firestoreProfile?.picture || user?.picture || '';
  const initials = displayName ? displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'FM' : 'FM';

  const currentEmail = (fbUser?.email || displayEmail).toLowerCase().trim();
  const isAdmin = Boolean(fbUser && currentEmail === masterAdminEmail.toLowerCase().trim());
  const isGoogleUser = Boolean(
    fbUser?.providerData?.some((p: any) => p.providerId === 'google.com') ||
    user?.authProvider === 'google.com' ||
    user?.authProvider === 'google'
  );
  const isEmailVerified = Boolean(
    isGoogleUser || 
    (fbUser?.emailVerified === true) || 
    (firestoreProfile?.emailVerified === true && fbUser?.emailVerified !== false)
  );

  const profileComplete = isProfileComplete({
    fullName: displayName === 'User' ? '' : displayName,
    address: firestoreProfile?.address || firestoreProfile?.deliveryAddress || user?.address || user?.deliveryAddress || user?.fullAddress || localStorage.getItem('fm_user_address') || '',
    city: firestoreProfile?.city || user?.city || localStorage.getItem('fm_user_city') || '',
    zipCode: firestoreProfile?.zipCode || firestoreProfile?.zipcode || user?.zipCode || user?.zipcode || localStorage.getItem('fm_user_zipcode') || ''
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[99998] bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-Out Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-xs z-[99999] bg-white/98 dark:bg-[#0B0F19]/98 backdrop-blur-2xl border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800/80">
          {isLoggedIn ? (
            <div className="flex items-center gap-3 overflow-hidden">
              {displayPhoto ? (
                <img 
                  src={formatDirectImageUrl(displayPhoto)} 
                  alt={displayName} 
                  className="w-10 h-10 rounded-xl object-cover border border-emerald-500/40 shadow-xs shrink-0" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{displayName}</h3>
                  {isEmailVerified ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                      <AlertCircle className="w-2.5 h-2.5 text-amber-500" />
                      <span>Unverified</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate">
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span className="truncate">{displayEmail}</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <img 
                src={formatDirectImageUrl(logoUrl) || "https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10"} 
                alt={`${brandName} Logo`} 
                className="w-10 h-10 rounded-xl object-contain bg-slate-900 border border-emerald-500/40 shadow-xs shrink-0" 
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Guest User</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{brandName} Auth Center</p>
              </div>
            </div>
          )}

          <button type="button" 
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body Links */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* DYNAMIC AUTH SECTION */}
          {!isLoggedIn ? (
            /* Guest View: Clean Full-Width Auth Buttons */
            <div className="space-y-3 bg-slate-100 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Account Access
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                Log in or sign up to access your purchased files, licenses and Google Drive lockers.
              </p>
              
              {/* Login Button (Secondary) */}
              <button type="button"
                onClick={() => {
                  onClose();
                  const currentPath = window.location.pathname + window.location.search;
                  if (currentPath && currentPath !== '/login' && currentPath !== '/signup') {
                    sessionStorage.setItem('auth_redirect_url', currentPath);
                  }
                  navigateTo('/login', { state: { from: currentPath } });
                }}
                className="w-full py-3 px-4 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <LogIn className="w-4 h-4 text-slate-500 dark:text-slate-300" />
                <span>Log In</span>
              </button>

              {/* Sign Up Button (Primary Rose-Crimson Gradient) */}
              <button type="button"
                onClick={() => {
                  onClose();
                  const currentPath = window.location.pathname + window.location.search;
                  if (currentPath && currentPath !== '/login' && currentPath !== '/signup') {
                    sessionStorage.setItem('auth_redirect_url', currentPath);
                  }
                  navigateTo('/signup', { state: { from: currentPath } });
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-rose-600 to-rose-500 hover:from-rose-400 hover:to-rose-500 text-white font-heading font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 transition cursor-pointer pointer-events-auto active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Sign Up Free</span>
              </button>

              {/* WhatsApp Support for Guests */}
              <a
                href={`https://wa.me/${cleanWhatsappNumber}?text=Hello%20FileMarket%20Support%2C%20I%20need%20assistance.`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-slate-100 hover:bg-emerald-500/10 dark:bg-slate-900/60 dark:hover:bg-emerald-500/10 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 text-left transition-all group mt-3 cursor-pointer"
              >
                {/* WhatsApp Custom Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-105 transition-transform overflow-hidden">
                  <img
                    src="https://lh3.googleusercontent.com/d/1941nw0eU_JIhKT_4QLuglzwuyDieb-jW"
                    alt="WhatsApp Support"
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      // Fallback to official high-res SVG if drive link restricts direct hotlink
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg";
                    }}
                  />
                </div>

                {/* Text Info */}
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                    WhatsApp Support
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Direct 24/7 instant chat & help
                  </span>
                </div>
              </a>

              {/* Saved Products for Guests */}
              <button type="button"
                onClick={() => {
                  onClose();
                  onOpenSavedProducts();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition text-sm font-medium text-left cursor-pointer"
              >
                <Heart className="w-5 h-5 text-rose-500 shrink-0" />
                <div className="flex-1">
                  <span className="block text-slate-900 dark:text-white font-semibold">Saved Products / Wishlist</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">View your favorite saved assets</span>
                </div>
              </button>
            </div>
          ) : (
            /* Authenticated View: User Profile, Downloads, AI SEO & WhatsApp */
            <div className="space-y-2">
              <button type="button"
                onClick={() => {
                  onClose();
                  onOpenProfilePage();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition text-sm font-medium text-left cursor-pointer"
              >
                <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <span className="block text-slate-900 dark:text-white font-semibold">User Profile</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Manage account & details</span>
                </div>
              </button>

              {/* 2. My Products / Downloads */}
              <button type="button"
                onClick={() => {
                  onClose();
                  onOpenMyProductsPage();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition text-sm font-medium text-left cursor-pointer"
              >
                <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <span className="block text-slate-900 dark:text-white font-semibold">My Products / Downloads</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">Access purchased assets</span>
                </div>
              </button>

              {/* 3. WhatsApp Support */}
              <a
                href={`https://wa.me/${cleanWhatsappNumber}?text=Hello%20FileMarket%20Support%2C%20I%20need%20assistance.`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-slate-100 hover:bg-emerald-500/10 dark:bg-slate-900/60 dark:hover:bg-emerald-500/10 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 text-left transition-all group cursor-pointer"
              >
                {/* WhatsApp Custom Icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:scale-105 transition-transform overflow-hidden">
                  <img
                    src="https://lh3.googleusercontent.com/d/1941nw0eU_JIhKT_4QLuglzwuyDieb-jW"
                    alt="WhatsApp Support"
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      // Fallback to official high-res SVG if drive link restricts direct hotlink
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg";
                    }}
                  />
                </div>

                {/* Text Info */}
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                    WhatsApp Support
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Direct 24/7 instant chat & help
                  </span>
                </div>
              </a>

              {/* 4. Saved Products / Wishlist */}
              <button type="button"
                onClick={() => {
                  onClose();
                  onOpenSavedProducts();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition text-sm font-medium text-left cursor-pointer"
              >
                <Heart className="w-5 h-5 text-rose-500 shrink-0" />
                <div className="flex-1">
                  <span className="block text-slate-900 dark:text-white font-semibold">Saved Products / Wishlist</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">View your favorite saved assets</span>
                </div>
              </button>

              {isAdmin && (
                <button type="button"
                  onClick={() => {
                    onClose();
                    navigateTo('/admin');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition text-sm font-medium text-left cursor-pointer"
                >
                  <ShieldCheck className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="flex-1">
                    <span className="block text-slate-900 dark:text-white font-semibold">Admin Panel</span>
                    <span className="block text-xs text-amber-600 dark:text-amber-400 font-medium">Manage products, orders & store</span>
                  </div>
                </button>
              )}

              {/* Logout Option */}
              <button type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowLogoutModal(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all text-sm font-medium text-left cursor-pointer text-rose-600 dark:text-rose-400 mt-2 pointer-events-auto relative z-50"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span className="font-semibold">Log Out</span>
              </button>
            </div>
          )}

          {/* FIXED BOTTOM SECTION: Language Switcher, Currency & Dual-Pill Theme Switcher */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
            
            {/* 1. LANGUAGE SWITCHER (Google Translate Integrated with 100+ Global Languages) */}
            <LanguageSelector variant="drawer" />

            {/* 2. CURRENCY SWITCHER */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Currency Switcher</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button"
                  onClick={(e) => { e.preventDefault(); setCurrency('BDT'); localStorage.setItem('filemarket_currency', 'BDT'); }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    currency === 'BDT'
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-md'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  BDT (৳)
                </button>
                <button type="button"
                  onClick={(e) => { e.preventDefault(); setCurrency('USD'); localStorage.setItem('filemarket_currency', 'USD'); }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    currency === 'USD'
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-md'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>

            {/* 3. THEME MODE */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Theme Mode</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    setDarkMode(false); 
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border flex items-center justify-center gap-1.5 cursor-pointer ${
                    !darkMode
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-md'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Day</span>
                </button>
                <button type="button"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    setDarkMode(true); 
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition border flex items-center justify-center gap-1.5 cursor-pointer ${
                    darkMode
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-md'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Night</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-800/80 text-center text-xs text-slate-500">
          {siteName} • Secure Delivery
        </div>

      </div>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl transform scale-95 animate-[scale-in_0.2s_ease-out_forwards] flex flex-col items-center text-center relative z-[100000] pointer-events-auto">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
              <LogOut className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Confirm Logout?</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to log out of your {siteName} account?
            </p>
            <div className="flex gap-3 w-full">
              <button type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowLogoutModal(false);
                }}
                className="flex-1 py-3 rounded-xl font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer pointer-events-auto"
              >
                Cancel / No
              </button>
              <button type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleLogout();
                }}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20 transition-all cursor-pointer pointer-events-auto"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-emerald-500 text-white px-5 py-3 rounded-full shadow-lg shadow-emerald-500/20 flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300 font-medium text-sm whitespace-nowrap">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};
