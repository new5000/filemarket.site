import { formatDirectImageUrl } from '../utils/formatImageUrl';
import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, ShieldCheck, Check, Lock, Save, Phone, Mail, MapPin, Sparkles, Loader2, AlertCircle, RefreshCw, Send, ExternalLink, X } from 'lucide-react';
import { Currency } from '../types';
import { 
  auth, 
  saveUserProfileToFirestore, 
  getUserProfileFromFirestore,
  triggerEmailVerification
} from '../lib/firebase';
import { updatePassword } from 'firebase/auth';
import { 
  isKeyboardMashOrSpam, 
  checkAddressAuthenticity, 
  checkPhoneAuthenticity 
} from '../lib/profileValidation';
import { getAuthStatus, syncAndCheckVerification } from '../lib/authGuard';
import { isProfileComplete } from '../lib/profileValidation';

interface UserProfilePageProps {
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  darkMode: boolean;
  setDarkMode: (d: boolean) => void;
  onOpenVerificationModal?: () => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  isOpen,
  onClose,
  onOpenVerificationModal
}) => {
  // Current active user states
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [zipCode, setZipCode] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(true);
  const [isGoogleUser, setIsGoogleUser] = useState<boolean>(false);

  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCheckingVerify, setIsCheckingVerify] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Load real active user data on open and whenever storage updates
  useEffect(() => {
    if (!isOpen) return;

    const loadActiveUserData = async () => {
      try {
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

        // Fetch fresh data from Firestore if user has a uid
        let firestoreProfile: any = null;
        if (activeUid) {
          try {
            firestoreProfile = await getUserProfileFromFirestore(activeUid);
          } catch (e) {
            console.warn('Firestore fetch failed:', e);
          }
        }

        const isSameUser = Boolean(activeUid && savedUid === activeUid);

        const nameVal = firestoreProfile?.fullName || 
                        (isSameUser ? savedUser?.name || localStorage.getItem('fm_user_name') : '') || 
                        currentFbUser?.displayName || 
                        '';

        const emailVal = firestoreProfile?.email || 
                         (isSameUser ? savedUser?.email || localStorage.getItem('fm_user_email') : '') || 
                         currentFbUser?.email || 
                         '';

        const phoneVal = firestoreProfile?.phone || 
                         (isSameUser ? savedUser?.phone || localStorage.getItem('fm_user_phone') : '') || 
                         '';

        const addressVal = firestoreProfile?.address || 
                           firestoreProfile?.deliveryAddress || 
                           (isSameUser ? savedUser?.address || localStorage.getItem('fm_user_address') : '') || 
                           '';

        const cityVal = firestoreProfile?.city || 
                        (isSameUser ? savedUser?.city || localStorage.getItem('fm_user_city') : '') || 
                        '';

        const zipCodeVal = firestoreProfile?.zipCode || 
                           (isSameUser ? savedUser?.zipCode || localStorage.getItem('fm_user_zipcode') : '') || 
                           '';

        const photoVal = firestoreProfile?.picture || 
                         (isSameUser ? savedUser?.picture || savedUser?.photo || localStorage.getItem('fm_user_photo') : '') || 
                         currentFbUser?.photoURL || 
                         '';

        const authStatus = getAuthStatus();
        setIsEmailVerified(authStatus.isEmailVerified);
        setIsGoogleUser(authStatus.isGoogleUser);

        setFullName(nameVal);
        setEmail(emailVal);
        setPhone(phoneVal);
        setAddress(addressVal);
        setCity(cityVal);
        setZipCode(zipCodeVal);
        setPhotoUrl(photoVal);
      } catch (err) {
        console.error('Error populating user profile:', err);
      }
    };

    loadActiveUserData();
  }, [isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    setErrorMessage(null);
    try {
      const sent = await triggerEmailVerification();
      if (sent) {
        setResendCooldown(30);
        setToastMessage('✓ Verification email resent! Please check your Gmail inbox.');
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        setErrorMessage('Could not resend email right now. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send verification email.');
    }
  };

  const handleCheckVerification = async () => {
    setIsCheckingVerify(true);
    setErrorMessage(null);
    try {
      const verified = await syncAndCheckVerification();
      setIsEmailVerified(verified);
      if (verified) {
        setToastMessage('🎉 Email verified successfully! Full cloud access unlocked.');
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        setErrorMessage('⚠️ Email not verified yet. Please click the link sent to your Gmail inbox.');
      }
    } catch {
      setErrorMessage('Verification check failed. Please check your network.');
    } finally {
      setIsCheckingVerify(false);
    }
  };

  if (!isOpen) return null;

  // Compute initials dynamically from real user name
  const initials = fullName
    ? fullName
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : email
    ? email.substring(0, 2).toUpperCase()
    : 'FM';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Full Name must be at least 2 characters.');
      return;
    }

    if (isKeyboardMashOrSpam(fullName)) {
      setErrorMessage('Please enter a genuine Full Name (avoid repetitive random keys).');
      return;
    }

    if (phone && phone.trim().length > 0) {
      const phoneCheck = checkPhoneAuthenticity(phone);
      if (!phoneCheck.valid) {
        setErrorMessage(phoneCheck.message || 'Invalid Bangladesh phone format (e.g. 017XXXXXXXX).');
        return;
      }
    }

    if (!address || !address.trim()) {
      setErrorMessage('Full Address is required.');
      return;
    }

    if (!city || !city.trim()) {
      setErrorMessage('City is required.');
      return;
    }

    if (!zipCode || !zipCode.trim()) {
      setErrorMessage('Zip Code is required.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Email Address cannot be empty.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match!');
      return;
    }

    setIsSaving(true);

    try {
      // 1. Update localStorage
      localStorage.setItem('fm_user_name', fullName.trim());
      localStorage.setItem('fm_user_email', email.trim());
      localStorage.setItem('fm_user_phone', phone.trim());
      localStorage.setItem('fm_user_address', address.trim());
      localStorage.setItem('fm_user_city', city.trim());
      localStorage.setItem('fm_user_zipcode', zipCode.trim());
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
        name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        zipCode: zipCode.trim(),
        picture: photoUrl || savedUser.picture || '',
        sub: userId || savedUser.sub || '',
        isLoggedIn: true,
      };

      localStorage.setItem('filemarket_user', JSON.stringify(updatedUser));

      // 2. Update Firestore if user is authenticated
      const currentFbUser = auth.currentUser;
      const effectiveUid = currentFbUser?.uid || userId || savedUser?.sub || savedUser?.userId;

      if (effectiveUid) {
        const fullDeliveryAddress = `${address.trim()}, ${city.trim()} ${zipCode.trim()}`;
        const profileData = {
          userId: effectiveUid,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          zipCode: zipCode.trim(),
          deliveryAddress: fullDeliveryAddress,
          createdAt: savedUser.createdAt || new Date().toISOString(),
          authProvider: savedUser.authProvider || 'password',
          picture: photoUrl || currentFbUser?.photoURL || '',
        };

        await saveUserProfileToFirestore(profileData);
      }

      // 3. Update Password if requested
      if (newPassword && newPassword.length >= 6 && currentFbUser) {
        try {
          await updatePassword(currentFbUser, newPassword);
        } catch (passErr: any) {
          if (passErr.code === 'auth/requires-recent-login') {
            throw new Error('Please sign out and sign in again to change your password.');
          }
          throw passErr;
        }
      }

      // 4. Notify app components (SlideDrawer, Header, etc.)
      window.dispatchEvent(new Event('storage'));

      setToastMessage('✅ Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setErrorMessage(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const profileComplete = isProfileComplete({ fullName, address, city, zipCode });

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-white backdrop-blur-2xl flex flex-col overflow-y-auto animate-in fade-in zoom-in-95 duration-200 transition-colors">
      
      {/* Main Content Container */}
      <div className="max-w-3xl w-full mx-auto px-4 py-6 sm:p-8 space-y-6 my-auto">
        
        {/* User Overview Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/40 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {photoUrl ? (
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-xl shrink-0">
                <img 
                  src={formatDirectImageUrl(photoUrl) || 'https://i.ibb.co/vzR0h2M/default-avatar.png'} 
                  alt={fullName} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {isEmailVerified && (
                  <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-slate-900" />
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-2xl sm:text-3xl shadow-xl shrink-0">
                <span>{initials}</span>
                {isEmailVerified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-3 h-3 text-slate-900" />
                  </div>
                )}
              </div>
            )}

            <div className="text-center sm:text-left flex-1 min-w-0">
              {isEmailVerified ? (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-2 transition-all">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Verified Member</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold mb-2 transition-all">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Unverified Email (Pending)</span>
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white truncate">
                {fullName || 'User Profile'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">
                {email || 'No email connected'} • {isEmailVerified ? 'Verified Member' : 'Unverified Email (Pending)'}
              </p>
            </div>
          </div>
        </div>

        {/* Incomplete Profile Alert (Warning UX) */}
        {!profileComplete && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 shadow-sm flex items-start gap-3.5 transition-all duration-300 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
              <span className="font-bold text-amber-800 dark:text-amber-300 mr-1.5">Profile Incomplete:</span>
              <span>Please fill in your address, city, and zip code to get verified.</span>
            </div>
          </div>
        )}

        {/* Unverified Email Alert & Action Banner */}
        {!isEmailVerified && !isGoogleUser && (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/40 shadow-xl space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 mt-0.5">
                  <Mail className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm text-white flex items-center gap-2">
                    <span>Email Verification Required</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Pending
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Please verify your Gmail (<span className="text-amber-300 font-mono font-bold">{email}</span>) by clicking the link sent to your inbox to unlock purchases and digital locker downloads.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCheckVerification}
                disabled={isCheckingVerify}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition cursor-pointer flex items-center gap-1.5"
              >
                {isCheckingVerify ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>✓ Check Status (যাচাই করুন)</span>
                  </>
                )}
              </button>

              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <span>Open Gmail</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendCooldown > 0}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                <span>{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Link'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-sm font-bold shadow-lg animate-in fade-in duration-200">
            <span className="text-base shrink-0">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-sm font-bold shadow-lg animate-in fade-in duration-200">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Personal Info & Password Form */}
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          
          {/* Section 1: Personal Information */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-bold text-base text-slate-900 dark:text-white">Personal Information (ব্যক্তিগত তথ্য)</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Joy Barmon"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-slate-400 text-xs font-normal flex items-center gap-1">
                    <Lock className="w-3 h-3 text-slate-400" /> 🔒 Locked
                  </span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    readOnly
                    disabled
                    placeholder="name@gmail.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-500 dark:text-slate-400 opacity-80 cursor-not-allowed select-none focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Address <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. House 12, Road 4, Agrabad"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    City <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Chattogram"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Zip Code <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="e.g. 4000"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Security & Password Management */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="font-bold text-base text-slate-900 dark:text-white">Security & Password Management (পাসওয়ার্ড পরিবর্তন)</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Current Password (যদি পরিবর্তন করতে চান)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">New Password (নতুন পাসওয়ার্ড)</label>
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center gap-2.5 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving to Cloud...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default UserProfilePage;
