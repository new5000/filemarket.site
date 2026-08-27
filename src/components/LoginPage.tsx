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
import BrandLogoBadge from './BrandLogoBadge';

export interface LoginPageProps {
  isOpen?: boolean;
  onClose: () => void;
  initialView?: 'login' | 'signup' | 'reset' | 'forgot';
  checkoutBlockedMessage?: string | null;
  onVerificationSuccess?: () => void;
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  isOpen = true,
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

  // Email format validator
  const isValidEmail = (emailStr: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(emailStr);
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
        onClose();
        setTimeout(() => {
          navigateTo(returnUrl, { replace: true });
        }, 50);
      } else {
        onClose();
      }
    }, 1200);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[1000] px-5 py-3.5 bg-emerald-600 text-white font-bold rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce text-sm">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container - Enlarged & Polished UI */}
      <div className="relative w-full max-w-xl my-auto bg-white rounded-[2.5rem] p-7 sm:p-10 space-y-6 shadow-2xl text-slate-800 border border-slate-100 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        
        {/* Back / Close Controls */}
        {currentView !== 'login' && (
          <button
            onClick={() => {
              setErrorMessage(null);
              setSuccessInfo(null);
              setCurrentView('login');
            }}
            type="button"
            className="absolute top-6 left-6 text-slate-400 hover:text-slate-700 p-2.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title="Back to Sign In"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <button
          onClick={onClose}
          type="button"
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 p-2.5 rounded-full hover:bg-slate-100 transition-colors text-xl font-bold cursor-pointer"
          title="Close Modal"
        >
          ✕
        </button>

        {/* Header Section */}
        <div className="flex flex-col items-center text-center space-y-2 pt-1">
          {/* Title & Description */}
          <div className="space-y-2 max-w-md">
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {currentView === 'login' && 'Welcome to FileMarket'}
              {currentView === 'signup' && 'Create Free Account'}
              {currentView === 'forgot' && 'Reset Password'}
            </h3>
            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              {currentView === 'login' && 'Access your purchased digital assets, instant downloads & lifetime licenses.'}
              {currentView === 'signup' && 'Join FileMarket for lifetime cloud access to digital downloads & verified licenses.'}
              {currentView === 'forgot' && "Enter your email address and we'll send recovery instructions."}
            </p>
          </div>
        </div>

        {/* Checkout Blocked Warning Notice */}
        {checkoutBlockedMessage && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-800 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            <span>{checkoutBlockedMessage}</span>
          </div>
        )}

        {/* Error Message Box */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2 text-rose-600 text-sm font-medium">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">{errorMessage}</div>
            </div>
            {errorMessage.includes('already registered') && currentView === 'signup' && (
              <div className="pl-7">
                <button
                  type="button"
                  onClick={() => { setCurrentView('login'); setErrorMessage(null); }}
                  className="font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  Click here to Sign In with this email →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success Message Box */}
        {successInfo && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-700 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successInfo}</span>
          </div>
        )}

        {/* Google One-Click Auth Button */}
        {currentView !== 'forgot' && (
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              type="button"
              className="w-full flex items-center justify-center gap-3.5 py-3.5 px-5 rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-bold text-sm sm:text-base text-slate-700 transition-all shadow-xs active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.18 21.32 7.27 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.12 0 9.87 0 11.7c0 1.83.43 3.58 1.19 5.12l4.09-2.55z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.27 0 3.18 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 text-slate-400 text-xs font-bold tracking-wider">
              <div className="flex-1 border-t border-slate-200" />
              <span>OR CONTINUE WITH EMAIL</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>
          </div>
        )}

        {/* VIEW: LOGIN */}
        {currentView === 'login' && (
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label className="block text-slate-700 font-bold text-sm mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm sm:text-base shadow-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-slate-700 font-bold text-sm">
                  Password <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessInfo(null);
                    setCurrentView('forgot');
                  }}
                  className="text-emerald-600 font-bold hover:underline cursor-pointer text-xs sm:text-sm"
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
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl pl-4 pr-12 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm sm:text-base shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 text-base cursor-pointer"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                className="w-4 h-4 rounded text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-slate-600 font-medium">Remember Me</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base sm:text-lg transition-all shadow-lg shadow-emerald-500/30 mt-2 active:scale-98 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>

            {/* Toggle to Sign Up */}
            <div className="text-center text-sm text-slate-600 pt-3 border-t border-slate-100">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessInfo(null);
                  setCurrentView('signup');
                }}
                className="text-emerald-600 font-bold hover:underline cursor-pointer ml-1"
              >
                Create Free Account
              </button>
            </div>
          </form>
        )}

        {/* VIEW: SIGN UP */}
        {currentView === 'signup' && (
          <form onSubmit={handleEmailSignUp} className="space-y-3.5 text-xs sm:text-sm">
            <div>
              <label className="block text-slate-700 font-bold text-sm mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Joy Barmon"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-sm mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-sm mb-1">
                Phone / WhatsApp <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-sm mb-1">
                Full Address <span className="text-rose-500">*</span>
              </label>
              <div>
                <input
                  type="text"
                  required
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="e.g. House 12, Road 4, Agrabad"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm shadow-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold text-sm mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Chattogram"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm shadow-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-sm mb-1">
                  Zip Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="e.g. 4000"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-sm mb-1">
                Password <span className="text-rose-500">*</span> (min 6 chars)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl pl-4 pr-12 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-2.5 text-slate-400 hover:text-slate-600 text-base cursor-pointer"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input 
                type="checkbox" 
                checked={agreeTerms} 
                onChange={(e) => setAgreeTerms(e.target.checked)} 
                className="w-4 h-4 rounded text-emerald-500 focus:ring-0 cursor-pointer"
              />
              <span className="text-xs sm:text-sm text-slate-600 font-medium">I agree to Terms & Privacy Policy</span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base sm:text-lg transition-all shadow-lg shadow-emerald-500/30 mt-2 active:scale-98 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Free Account</span>
              )}
            </button>

            {/* Toggle to Sign In */}
            <div className="text-center text-sm text-slate-600 pt-3 border-t border-slate-100">
              Already registered on FileMarket?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessInfo(null);
                  setCurrentView('login');
                }}
                className="text-emerald-600 font-bold hover:underline cursor-pointer ml-1"
              >
                Sign In Instead
              </button>
            </div>
          </form>
        )}

        {/* VIEW: FORGOT PASSWORD */}
        {currentView === 'forgot' && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label className="block text-slate-700 font-bold text-sm mb-1.5">
                Account Email Address <span className="text-rose-500">*</span>
              </label>
              <div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm sm:text-base shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base sm:text-lg transition-all shadow-lg shadow-emerald-500/30 active:scale-98 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send Password Reset Email</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setSuccessInfo(null);
                setCurrentView('login');
              }}
              className="w-full py-3 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer text-center"
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* Footer Badges */}
        <div className="flex items-center justify-center gap-5 text-xs text-slate-400 font-medium pt-2 border-t border-slate-100">
          <span>🔒 256-Bit SSL</span>
          <span>⚡ Instant Cloud Delivery</span>
          <span>🛡️ Firebase Secured</span>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
