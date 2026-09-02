import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  CheckCircle2, 
  MapPin, 
  Phone, 
  Building, 
  Hash, 
  Loader2, 
  Send, 
  AlertCircle,
  X
} from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { navigateTo } from '../router';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { 
  auth, 
  googleProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  saveUserProfileToFirestore, 
  triggerPasswordReset
} from '../lib/firebase';
import { getAuthErrorMessage } from '../lib/authErrorMapper';

export interface LoginPageProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialView?: 'login' | 'signup' | 'reset' | 'forgot';
  checkoutBlockedMessage?: string | null;
  onVerificationSuccess?: () => void;
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onClose,
  initialView = 'login',
  checkoutBlockedMessage = null,
  onVerificationSuccess,
  onLoginSuccess
}) => {
  const { generalConfig } = useGlobalSettings();

  const [currentView, setCurrentView] = useState<'login' | 'signup' | 'forgot'>(() => {
    if (initialView === 'signup') return 'signup';
    if (initialView === 'reset' || initialView === 'forgot') return 'forgot';
    return 'login';
  });

  useEffect(() => {
    if (initialView === 'signup') setCurrentView('signup');
    else if (initialView === 'reset' || initialView === 'forgot') setCurrentView('forgot');
    else setCurrentView('login');
  }, [initialView]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const brandTitle = generalConfig?.siteTitle || 'FileMarket';

  // Email format validator
  const isValidEmail = (emailStr: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(emailStr);
  };

  // Switch view helper with routing sync
  const setView = (view: 'login' | 'signup' | 'forgot') => {
    setErrorMessage(null);
    setSuccessInfo(null);
    setCurrentView(view);
    if (view === 'login') {
      navigateTo('/login', { replace: true, title: `Sign In — ${brandTitle}` });
    } else if (view === 'signup') {
      navigateTo('/signup', { replace: true, title: `Create Free Account — ${brandTitle}` });
    }
  };

  const handleBackToStore = () => {
    if (onClose) {
      onClose();
    } else {
      navigateTo('/');
    }
  };

  // Sync user state to localStorage and trigger global listeners
  const notifyUserAuthChange = (userData: any) => {
    try {
      localStorage.setItem('filemarket_user', JSON.stringify(userData));
      localStorage.setItem('isLoggedIn', 'true');
      if (userData.userId || userData.uid) localStorage.setItem('fm_user_uid', userData.userId || userData.uid);
      if (userData.email) localStorage.setItem('fm_user_email', userData.email);
      if (userData.name || userData.fullName) {
        localStorage.setItem('fm_user_name', userData.name || userData.fullName);
      }
      if (userData.picture || userData.avatar) {
        localStorage.setItem('fm_user_photo', userData.picture || userData.avatar);
      }
      if (userData.emailVerified !== undefined) {
        localStorage.setItem('fm_email_verified', userData.emailVerified ? 'true' : 'false');
      }
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('filemarket:auth-change'));
      window.dispatchEvent(new CustomEvent('auth:state-changed'));
    } catch (e) {
      console.warn("Storage sync notice:", e);
    }
  };

  const handlePostAuthSuccess = (localUserData: { name: string; email: string; userId: string }) => {
    onLoginSuccess?.();
    onVerificationSuccess?.();

    const returnUrl = sessionStorage.getItem('auth_redirect_url');
    if (returnUrl) {
      setToastMessage('Logged in successfully! Resuming checkout...');
    } else {
      setToastMessage(`✓ Welcome, ${localUserData.name}!`);
    }

    setTimeout(() => {
      setToastMessage(null);
      setIsLoading(false);
      if (returnUrl) {
        sessionStorage.removeItem('auth_redirect_url');
        if (onClose) onClose();
        setTimeout(() => {
          navigateTo(returnUrl, { replace: true });
        }, 50);
      } else if (onClose) {
        onClose();
      } else {
        navigateTo('/');
      }
    }, 1000);
  };

  // Google Sign-In Flow
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessInfo(null);
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const profilePayload = {
        userId: user.uid,
        uid: user.uid,
        fullName: user.displayName || 'Google User',
        name: user.displayName || 'Google User',
        email: user.email || '',
        phone: user.phoneNumber || '',
        address: '',
        fullAddress: '',
        deliveryAddress: '',
        city: '',
        zipCode: '',
        role: 'user' as const,
        status: 'active' as const,
        emailVerified: true,
        photoURL: user.photoURL || '',
        avatar: user.photoURL || '',
        createdAt: new Date().toISOString(),
        authProvider: 'google'
      };

      try {
        await saveUserProfileToFirestore(profilePayload);
      } catch (dbErr) {
        console.warn("Firestore saveUserProfile warning:", dbErr);
      }

      const localUserData = {
        userId: user.uid,
        uid: user.uid,
        name: user.displayName || 'Google User',
        fullName: user.displayName || 'Google User',
        email: user.email || '',
        picture: user.photoURL || '',
        avatar: user.photoURL || '',
        role: 'user',
        status: 'active',
        emailVerified: true
      };

      notifyUserAuthChange(localUserData);
      handlePostAuthSuccess(localUserData);
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setErrorMessage(getAuthErrorMessage(err?.code || 'auth/popup-closed-by-user'));
      setIsLoading(false);
    }
  };

  // Email / Password Login Flow
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    const cleanEmail = email.trim();
    if (!isValidEmail(cleanEmail)) {
      setErrorMessage("Please enter a valid Gmail / Email address.");
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      const localUserData = {
        userId: user.uid,
        uid: user.uid,
        name: user.displayName || cleanEmail.split('@')[0],
        email: user.email || cleanEmail,
        picture: user.photoURL || '',
        role: 'user',
        status: 'active',
        emailVerified: true
      };

      notifyUserAuthChange(localUserData);
      handlePostAuthSuccess(localUserData);
    } catch (err: any) {
      const friendlyMessage = getAuthErrorMessage(err?.code || err);
      setErrorMessage(friendlyMessage);
      setIsLoading(false);
    }
  };

  // Email / Password Signup Flow
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    const cleanEmail = email.trim();
    const cleanFullName = fullName.trim();
    const cleanAddress = fullAddress.trim();

    if (!cleanFullName) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setErrorMessage("Please enter a valid Gmail / Email address.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (!cleanAddress) {
      setErrorMessage("Please enter your full address.");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("You must agree to the Terms & Privacy Policy.");
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // Set display name in Firebase Auth
      try {
        await updateProfile(user, { displayName: cleanFullName });
      } catch (profileErr) {
        console.warn("Update displayName warning:", profileErr);
      }

      const formattedAddress = `${cleanAddress}${city.trim() ? ', ' + city.trim() : ''}${zipCode.trim() ? ' ' + zipCode.trim() : ''}`.trim();

      const newProfile = {
        userId: user.uid,
        uid: user.uid,
        fullName: cleanFullName,
        name: cleanFullName,
        email: cleanEmail,
        phone: phone.trim(),
        address: formattedAddress || cleanAddress,
        fullAddress: cleanAddress,
        deliveryAddress: formattedAddress || cleanAddress || 'Bangladesh',
        city: city.trim(),
        zipCode: zipCode.trim(),
        role: 'user' as const,
        status: 'active' as const,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        authProvider: 'password'
      };

      try {
        await saveUserProfileToFirestore(newProfile);
      } catch (dbErr) {
        console.warn("Firestore saveUserProfile warning:", dbErr);
      }

      const localUserData = {
        userId: user.uid,
        uid: user.uid,
        name: cleanFullName,
        fullName: cleanFullName,
        email: cleanEmail,
        phone: phone.trim(),
        address: formattedAddress || cleanAddress,
        city: city.trim(),
        zipCode: zipCode.trim(),
        role: 'user',
        status: 'active',
        emailVerified: true
      };

      notifyUserAuthChange(localUserData);
      handlePostAuthSuccess(localUserData);
    } catch (err: any) {
      console.error("Sign-up exception handled:", err);
      setErrorMessage(getAuthErrorMessage(err?.code || err));
      setIsLoading(false);
    }
  };

  // Password Reset Flow
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessInfo(null);

    const cleanEmail = email.trim();
    if (!isValidEmail(cleanEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      await triggerPasswordReset(cleanEmail);
      setSuccessInfo(`Password reset instructions sent to ${cleanEmail}. Please check your inbox and spam folder.`);
      setIsLoading(false);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setErrorMessage(getAuthErrorMessage(err?.code || 'auth/user-not-found'));
      setIsLoading(false);
    }
  };

  const isSignUp = currentView === 'signup';
  const isForgot = currentView === 'forgot';

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col justify-center items-center px-4 py-8 sm:py-12 transition-colors">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[1000] px-5 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce text-sm">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Brand & Back Navigation */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <button 
          type="button"
          onClick={handleBackToStore} 
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
        >
          <span>←</span> Back to Store
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black tracking-tight text-emerald-600 dark:text-emerald-400">{brandTitle}</span>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 dark:border-slate-800 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {isSignUp ? 'Create Free Account' : isForgot ? 'Reset Password' : 'Welcome to FileMarket'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isSignUp 
              ? 'Join FileMarket for lifetime cloud access to digital downloads & verified licenses.' 
              : isForgot
              ? "Enter your email address and we'll send recovery instructions."
              : 'Access your purchased digital assets, instant downloads & lifetime licenses.'}
          </p>
        </div>

        {/* Checkout Blocked Warning Notice */}
        {checkoutBlockedMessage && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-2.5 text-amber-700 dark:text-amber-300 text-xs sm:text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>{checkoutBlockedMessage}</span>
          </div>
        )}

        {/* Error Message Box */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-1.5 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-medium">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{errorMessage}</div>
            </div>
            {errorMessage.includes('already registered') && isSignUp && (
              <div className="pl-6 pt-1">
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Click here to Sign In with this email →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success Message Box */}
        {successInfo && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-2.5 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <span>{successInfo}</span>
          </div>
        )}

        {/* 1. Google OAuth Button */}
        {!isForgot && (
          <div className="space-y-4">
            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.18 21.32 7.27 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.12 0 9.87 0 11.7c0 1.83.43 3.58 1.19 5.12l4.09-2.55z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.27 0 3.18 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[10px] font-bold text-slate-400 tracking-wider uppercase absolute">
                OR CONTINUE WITH EMAIL
              </span>
            </div>
          </div>
        )}

        {/* 2. Form Fields */}
        {currentView === 'login' && (
          <form onSubmit={handleEmailSignIn} className="space-y-3.5">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-xs sm:text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm">
                  Password <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setView('forgot')}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer text-xs"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2 cursor-pointer pt-0.5">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                className="w-3.5 h-3.5 rounded text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Remember Me</span>
            </label>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:scale-95 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all mt-2 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {currentView === 'signup' && (
          <form onSubmit={handleEmailSignUp} className="space-y-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Joy Barmon"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs mb-1">
                Phone / WhatsApp <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs mb-1">
                Full Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                placeholder="e.g. House 12, Road 4, Agrabad"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Chattogram"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs mb-1">
                  Zip Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="e.g. 4000"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs mb-1">
                Password <span className="text-rose-500">*</span> (min 6 chars)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-9 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer pt-0.5">
              <input 
                type="checkbox" 
                checked={agreeTerms} 
                onChange={(e) => setAgreeTerms(e.target.checked)} 
                className="w-3.5 h-3.5 rounded text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">I agree to Terms &amp; Privacy Policy</span>
            </label>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:scale-95 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all mt-2 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Free Account</span>
              )}
            </button>
          </form>
        )}

        {/* Forgot Password View */}
        {currentView === 'forgot' && (
          <form onSubmit={handlePasswordReset} className="space-y-3.5">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm mb-1">
                Account Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-xs sm:text-sm"
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:scale-95 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 transition-all mt-2 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Password Reset Email</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setView('login')}
              className="w-full py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer text-center"
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* Switch Between Login and Signup */}
        <div className="text-center pt-2">
          {isSignUp ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <button 
                type="button"
                onClick={() => setView('login')} 
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : !isForgot ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <button 
                type="button"
                onClick={() => setView('signup')} 
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                Create Free Account
              </button>
            </p>
          ) : null}
        </div>

        {/* Security Badges */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-3 text-[10px] text-slate-400 font-semibold flex-wrap">
          <span>🔒 256-Bit SSL</span>
          <span>⚡ Instant Cloud Delivery</span>
          <span>🛡️ Firebase Secured</span>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;

