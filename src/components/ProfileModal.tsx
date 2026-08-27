import { formatDirectImageUrl } from '../utils/formatImageUrl';
import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, ShoppingBag, Download, ShieldCheck, MessageSquare, Sparkles, Check, Edit2, AlertCircle, RefreshCw, Send, ExternalLink, Loader2 } from 'lucide-react';
import { Currency } from '../types';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { auth, saveUserProfileToFirestore, getUserProfileFromFirestore, triggerEmailVerification } from '../lib/firebase';
import { isKeyboardMashOrSpam, checkAddressAuthenticity, checkPhoneAuthenticity } from '../lib/profileValidation';
import { getAuthStatus, syncAndCheckVerification } from '../lib/authGuard';
import { isProfileComplete } from '../lib/profileValidation';
import { LanguageSelector } from './LanguageSelector';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currency,
  setCurrency,
  darkMode,
  setDarkMode,
}) => {
  const { language, changeLanguage, i18n } = useGlobalSettings();
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [userAddress, setUserAddress] = useState<string>('');
  const [userCity, setUserCity] = useState<string>('');
  const [userZipCode, setUserZipCode] = useState<string>('');
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(true);
  const [isGoogleUser, setIsGoogleUser] = useState<boolean>(false);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [zipCodeInput, setZipCodeInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCheckingVerify, setIsCheckingVerify] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      let savedUser: any = null;
      const savedUserStr = localStorage.getItem('filemarket_user');
      if (savedUserStr) {
        try {
          savedUser = JSON.parse(savedUserStr);
        } catch {
          savedUser = null;
        }
      }

      const currentFbUser = auth.currentUser;
      const savedUid = savedUser?.sub || savedUser?.userId || savedUser?.uid || localStorage.getItem('fm_user_uid');
      const activeUid = currentFbUser?.uid || savedUid || '';
      setUserId(activeUid);

      let firestoreProfile: any = null;
      if (activeUid) {
        try {
          firestoreProfile = await getUserProfileFromFirestore(activeUid);
        } catch (e) {
          console.warn(e);
        }
      }

      const isSameUser = Boolean(activeUid && savedUid === activeUid);

      const name = firestoreProfile?.fullName || (isSameUser ? savedUser?.name || localStorage.getItem('fm_user_name') : '') || currentFbUser?.displayName || 'User';
      const email = firestoreProfile?.email || (isSameUser ? savedUser?.email || localStorage.getItem('fm_user_email') : '') || currentFbUser?.email || '';
      const phone = firestoreProfile?.phone || (isSameUser ? savedUser?.phone || localStorage.getItem('fm_user_phone') : '') || '';
      const address = firestoreProfile?.address || firestoreProfile?.deliveryAddress || (isSameUser ? savedUser?.address || localStorage.getItem('fm_user_address') : '') || '';
      const city = firestoreProfile?.city || (isSameUser ? savedUser?.city || localStorage.getItem('fm_user_city') : '') || '';
      const zipCode = firestoreProfile?.zipCode || (isSameUser ? savedUser?.zipCode || localStorage.getItem('fm_user_zipcode') : '') || '';
      const photo = firestoreProfile?.picture || (isSameUser ? savedUser?.picture || localStorage.getItem('fm_user_photo') : '') || currentFbUser?.photoURL || '';

      const authStatus = getAuthStatus();
      setIsEmailVerified(authStatus.isEmailVerified);
      setIsGoogleUser(authStatus.isGoogleUser);

      setUserName(name);
      setUserEmail(email);
      setUserPhone(phone);
      setUserAddress(address);
      setUserCity(city);
      setUserZipCode(zipCode);
      setUserPhoto(photo);

      setNameInput(name);
      setEmailInput(email);
      setPhoneInput(phone);
      setAddressInput(address);
      setCityInput(city);
      setZipCodeInput(zipCode);
    };

    loadData();
  }, [isOpen]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      const sent = await triggerEmailVerification();
      if (sent) {
        setResendCooldown(30);
        setToastMessage('Verification email resent to your inbox!');
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend email.');
    }
  };

  const handleCheckVerify = async () => {
    setIsCheckingVerify(true);
    try {
      const ok = await syncAndCheckVerification();
      setIsEmailVerified(ok);
      if (ok) {
        setToastMessage('🎉 Email verified successfully!');
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        setErrorMessage('⚠️ Email not verified yet. Please check your Gmail link.');
      }
    } catch {
      setErrorMessage('Check failed. Please click the link in your email.');
    } finally {
      setIsCheckingVerify(false);
    }
  };

  if (!isOpen) return null;

  const initials = userName
    ? userName.trim().split(/\s+/).map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'FM';

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nameInput.trim() || nameInput.trim().length < 2) {
      setErrorMessage('Full Name must be at least 2 characters.');
      return;
    }

    if (isKeyboardMashOrSpam(nameInput)) {
      setErrorMessage('Please enter a genuine Full Name (avoid repetitive random keys).');
      return;
    }

    if (phoneInput && phoneInput.trim().length > 0) {
      const phoneCheck = checkPhoneAuthenticity(phoneInput);
      if (!phoneCheck.valid) {
        setErrorMessage(phoneCheck.message || 'Invalid Bangladesh phone format.');
        return;
      }
    }

    if (addressInput && addressInput.trim().length > 0) {
      const addressCheck = checkAddressAuthenticity(addressInput);
      if (!addressCheck.valid) {
        setErrorMessage(addressCheck.message || 'Please provide a genuine Delivery Address (minimum 8 characters).');
        return;
      }
    }

    setUserName(nameInput);
    setUserEmail(emailInput);
    setUserPhone(phoneInput);
    setUserAddress(addressInput);
    setUserCity(cityInput);
    setUserZipCode(zipCodeInput);

    localStorage.setItem('fm_user_name', nameInput.trim());
    localStorage.setItem('fm_user_email', emailInput.trim());
    localStorage.setItem('fm_user_phone', phoneInput.trim());
    localStorage.setItem('fm_user_address', addressInput.trim());
    localStorage.setItem('fm_user_city', cityInput.trim());
    localStorage.setItem('fm_user_zipcode', zipCodeInput.trim());
    localStorage.setItem('isLoggedIn', 'true');

    let savedUser: any = {};
    const savedUserStr = localStorage.getItem('filemarket_user');
    if (savedUserStr) {
      try {
        savedUser = JSON.parse(savedUserStr);
      } catch {
        savedUser = {};
      }
    }

    const updatedUser = {
      ...savedUser,
      name: nameInput.trim(),
      email: emailInput.trim(),
      phone: phoneInput.trim(),
      address: addressInput.trim(),
      city: cityInput.trim(),
      zipCode: zipCodeInput.trim(),
      picture: userPhoto || savedUser.picture || '',
      sub: userId || savedUser.sub || '',
      isLoggedIn: true
    };
    localStorage.setItem('filemarket_user', JSON.stringify(updatedUser));

    const effectiveUid = auth.currentUser?.uid || userId || savedUser?.sub || savedUser?.userId;
    if (effectiveUid) {
      try {
        const fullDelivery = `${addressInput.trim()}, ${cityInput.trim()} ${zipCodeInput.trim()}`;
        await saveUserProfileToFirestore({
          userId: effectiveUid,
          fullName: nameInput.trim(),
          email: emailInput.trim(),
          phone: phoneInput.trim(),
          address: addressInput.trim(),
          city: cityInput.trim(),
          zipCode: zipCodeInput.trim(),
          deliveryAddress: fullDelivery,
          createdAt: savedUser.createdAt || new Date().toISOString(),
          authProvider: savedUser.authProvider || 'password',
          picture: userPhoto || ''
        });
      } catch (err) {
        console.error('Error saving to Firestore:', err);
      }
    }

    window.dispatchEvent(new Event('storage'));

    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  if (!isOpen) return null;

  const profileComplete = isProfileComplete({
    fullName: isEditing ? nameInput : userName,
    address: isEditing ? addressInput : userAddress,
    city: isEditing ? cityInput : userCity,
    zipCode: isEditing ? zipCodeInput : userZipCode
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with avatar cover */}
        <div className="relative bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white">
          <div className="flex items-center gap-4">
            {userPhoto ? (
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white/40 shrink-0">
                <img src={formatDirectImageUrl(userPhoto) || 'https://i.ibb.co/vzR0h2M/default-avatar.png'} alt={userName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                {isEmailVerified && (
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 border-2 border-white dark:border-[#111827] rounded-full" />
                )}
              </div>
            ) : (
              <div className="relative w-16 h-16 rounded-2xl bg-white text-emerald-600 flex items-center justify-center font-black text-xl shadow-lg border-2 border-white/40 shrink-0">
                <span>{initials}</span>
                {isEmailVerified && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white dark:border-[#111827] rounded-full" />
                )}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-xl text-white truncate">{userName || 'User Profile'}</h3>
                {isEmailVerified ? (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shrink-0 flex items-center gap-1 shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verified Member</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 border border-amber-400/40 text-amber-300 shrink-0 flex items-center gap-1 shadow-xs">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Unverified Email</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100 mt-0.5 truncate">
                {userEmail || 'No email connected'} • {isEmailVerified ? 'Verified Member' : 'Unverified Email (Pending)'}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200">
          
          {/* Incomplete Profile Alert (Warning UX) */}
          {!profileComplete && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 shadow-xs flex items-start gap-3 transition-all duration-300">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                <span className="font-bold text-amber-800 dark:text-amber-300 mr-1.5">Profile Incomplete:</span>
                <span>Please fill in your address, city, and zip code to get verified.</span>
              </div>
            </div>
          )}
          {!isEmailVerified && !isGoogleUser && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    Email Verification Pending
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Please verify your Gmail ({userEmail}) to access instant downloads and checkout.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button type="button"

                  onClick={handleCheckVerify}
                  disabled={isCheckingVerify}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition cursor-pointer"
                >
                  {isCheckingVerify ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  <span>Check Status</span>
                </button>
                <button type="button"

                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3 h-3 text-amber-500" />
                  <span>{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Email'}</span>
                </button>
              </div>
            </div>
          )}

          {toastMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold animate-in fade-in duration-200">
              <Check className="w-4 h-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold">
              <Check className="w-4 h-4 shrink-0" />
              <span>Profile Updated Successfully!</span>
            </div>
          )}

          {/* Edit Profile Section */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
              <div className="font-heading font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Edit Profile Details
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                <input 
                  type="text" 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Joy Barmon"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Locked (Read-Only)</span>
                </label>
                <input 
                  type="email" 
                  value={emailInput}
                  readOnly
                  tabIndex={-1}
                  placeholder="name@gmail.com"
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-60 select-none focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number (Optional)</label>
                <input 
                  type="tel" 
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Address <span className="text-rose-500 font-bold">*</span></label>
                <input 
                  type="text" 
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="e.g. House 12, Road 4, Agrabad"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City <span className="text-rose-500 font-bold">*</span></label>
                  <input 
                    type="text" 
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder="e.g. Chattogram"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Zip Code <span className="text-rose-500 font-bold">*</span></label>
                  <input 
                    type="text" 
                    value={zipCodeInput}
                    onChange={(e) => setZipCodeInput(e.target.value)}
                    placeholder="e.g. 4000"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button"

                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Account Type</div>
                <div className="text-sm font-bold flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>FileMarket Verified Buyer</span>
                </div>
              </div>
              <button type="button"
                onClick={() => {
                  setNameInput(userName);
                  setEmailInput(userEmail);
                  setPhoneInput(userPhone);
                  setAddressInput(userAddress);
                  setCityInput(userCity);
                  setZipCodeInput(userZipCode);
                  setIsEditing(true);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          )}

          {/* Quick Preferences */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Preferences &amp; Localization</h4>
            
            {/* Language Switcher */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 mb-3">
              <LanguageSelector variant="modal" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Currency Selection */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mb-2 uppercase tracking-wider">Display Currency</span>
                <div className="flex items-center gap-1.5">
                  <button type="button"
                    onClick={(e) => { e.preventDefault(); setCurrency('BDT'); localStorage.setItem('filemarket_currency', 'BDT'); }}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      currency === 'BDT'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    ৳ BDT
                  </button>
                  <button type="button"
                    onClick={(e) => { e.preventDefault(); setCurrency('USD'); localStorage.setItem('filemarket_currency', 'USD'); }}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      currency === 'USD'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    $ USD
                  </button>
                </div>
              </div>

              {/* Theme Selection */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mb-2 uppercase tracking-wider">Theme Mode</span>
                <div className="flex items-center gap-1.5">
                  <button type="button"
                    onClick={(e) => { e.preventDefault(); setDarkMode(true); localStorage.setItem('preferred_theme', 'dark'); document.documentElement.classList.add('dark'); }}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      darkMode
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Dark
                  </button>
                  <button type="button"
                    onClick={(e) => { e.preventDefault(); setDarkMode(false); localStorage.setItem('preferred_theme', 'light'); document.documentElement.classList.remove('dark'); }}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      !darkMode
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Light
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Purchases & Support Hub */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Order Support &amp; Delivery</h4>
            <div className="space-y-2">
              <a
                href="https://wa.me/8801673833783?text=Hello%20FileMarket%2C%20I%20need%20help%20with%20my%20order"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 rounded-2xl border border-emerald-500/20 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                  <div>
                    <div className="text-xs font-bold">24/7 WhatsApp Instant Support</div>
                    <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/70">+880 1673-833783</div>
                  </div>
                </div>
                <span className="text-xs font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-lg">Chat</span>
              </a>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Google Drive High Speed Direct Delivery</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">All purchased files unlock instant 1-click links</div>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-amber-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">FileMarket ID: #FM-2026</div>
          <button type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
