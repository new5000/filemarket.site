import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export default function AuthModal({ isOpen, onClose, initialIsLogin = false, siteSettings, setUser }) {
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationNotice, setVerificationNotice] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  if (!isOpen) return null;

  // Local storage state sync helper
  const syncLocalUserState = (userData) => {
    try {
      localStorage.setItem('filemarket_user', JSON.stringify(userData));
      localStorage.setItem('isLoggedIn', 'true');
      if (userData.name || userData.fullName) {
        localStorage.setItem('fm_user_name', userData.name || userData.fullName);
      }
      if (userData.email) {
        localStorage.setItem('fm_user_email', userData.email);
      }
      if (userData.uid) {
        localStorage.setItem('fm_user_uid', userData.uid);
      }
      if (userData.phone) {
        localStorage.setItem('fm_user_phone', userData.phone);
      }
      if (userData.address || userData.fullAddress) {
        localStorage.setItem('fm_user_address', userData.address || userData.fullAddress);
      }
      if (userData.city) {
        localStorage.setItem('fm_user_city', userData.city);
      }
      if (userData.zipCode) {
        localStorage.setItem('fm_user_zipcode', userData.zipCode);
      }
      localStorage.setItem('fm_email_verified', userData.emailVerified ? 'true' : 'false');

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('auth:state-changed'));
      window.dispatchEvent(new CustomEvent('filemarket:auth-change'));
    } catch (e) {
      console.warn('Error syncing local auth state:', e);
    }
  };

  // Helper for user-friendly error messages
  const parseAuthErrorMessage = (err) => {
    const errCode = err?.code || '';
    const errMsg = err?.message || '';

    if (errCode === 'auth/email-already-in-use' || errMsg.includes('email-already-in-use')) {
      return 'This email is already registered. Please sign in instead.';
    }
    if (errCode === 'auth/invalid-email' || errMsg.includes('invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (
      errCode === 'auth/invalid-credential' || 
      errCode === 'auth/wrong-password' || 
      errCode === 'auth/user-not-found' ||
      errMsg.includes('invalid-credential') ||
      errMsg.includes('wrong-password') ||
      errMsg.includes('user-not-found')
    ) {
      return isLogin 
        ? 'Invalid email or password. If you do not have an account yet, please Create Free Account.' 
        : 'Invalid credentials provided. Please try again.';
    }
    if (errCode === 'auth/weak-password' || errMsg.includes('weak-password')) {
      return 'Password should be at least 6 characters.';
    }
    if (errCode === 'auth/too-many-requests' || errMsg.includes('too-many-requests')) {
      return 'Too many attempts. Please wait a few moments and try again.';
    }
    if (errCode === 'auth/network-request-failed' || errMsg.includes('network')) {
      return 'Network connection error. Please check your internet connection.';
    }
    if (errMsg) {
      return errMsg.replace('Firebase: ', '').replace(/Error \((.+)\)\.?/, '$1');
    }
    return 'Authentication operation failed. Please try again.';
  };

  // Handle Form Submit (Sign Up / Sign In)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setVerificationNotice('');

    if (!isLogin && !agreeTerms) {
      const msg = 'You must agree to Terms & Privacy Policy.';
      setError(msg);
      return;
    }

    if (!email.trim() || !password) {
      const msg = 'Please fill in all required fields.';
      setError(msg);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Sign In
        let userCred;
        try {
          userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
        } catch (signInErr) {
          console.error('Sign-in error:', signInErr);
          const friendlyMsg = parseAuthErrorMessage(signInErr);
          setError(friendlyMsg);
          setLoading(false);
          return;
        }

        const user = userCred.user;

        if (!user.emailVerified) {
          setIsVerifying(true);
          setVerificationNotice('Your Gmail is not verified yet! Please check your email to activate your account.');
          setLoading(false);
          return;
        }

        let fullProfile = {
          uid: user.uid,
          userId: user.uid,
          name: user.displayName || email.split('@')[0],
          fullName: user.displayName || email.split('@')[0],
          email: user.email,
          role: 'user',
          status: 'active',
          emailVerified: true
        };

        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            fullProfile = { uid: user.uid, userId: user.uid, ...userSnap.data(), emailVerified: true };
          }
        } catch (firestoreErr) {
          console.warn('Firestore user fetch note (using Auth profile):', firestoreErr);
        }

        syncLocalUserState(fullProfile);
        if (setUser) setUser(fullProfile);

        setLoading(false);
        onClose();
      } else {
        // Sign Up with Email & Password
        let userCred;
        try {
          userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        } catch (signUpErr) {
          console.error('Signup error:', signUpErr);
          const friendlyMsg = parseAuthErrorMessage(signUpErr);
          setError(friendlyMsg);
          setLoading(false);
          return;
        }

        const user = userCred.user;

        // Send Verification Email (Catch error gracefully without failing registration)
        try {
          await sendEmailVerification(user);
        } catch (verifyErr) {
          console.warn('Verification email send note:', verifyErr);
        }

        // Save User Details in Firestore (Catch error gracefully without freezing signup)
        const combinedAddress = `${fullAddress.trim()}, ${city.trim()} ${zipCode.trim()}`.trim();
        const newUserData = {
          uid: user.uid,
          userId: user.uid,
          name: fullName.trim() || email.split('@')[0] || 'User',
          fullName: fullName.trim() || email.split('@')[0] || 'User',
          email: user.email,
          phone: phone.trim() || '',
          address: combinedAddress,
          fullAddress: fullAddress.trim(),
          deliveryAddress: combinedAddress,
          city: city.trim(),
          zipCode: zipCode.trim(),
          role: 'user',
          status: 'active',
          emailVerified: false,
          createdAt: serverTimestamp()
        };

        try {
          await setDoc(doc(db, 'users', user.uid), newUserData, { merge: true });
        } catch (dbErr) {
          console.warn('Firestore setDoc user profile note (safe fallback):', dbErr);
        }

        // Immediately update global client state so user is recognized
        syncLocalUserState(newUserData);
        if (setUser) setUser(newUserData);

        setVerificationNotice('A new verification link has been sent to your inbox. Please check your email to activate your account.');
        setLoading(false);
        setIsVerifying(true);
      }
    } catch (err) {
      console.error('Unhandled Auth submit error:', err);
      const friendlyMsg = parseAuthErrorMessage(err);
      setError(friendlyMsg);
      setLoading(false);
    }
  };

  // Check Verification Status
  const handleCheckStatus = async () => {
    if (!auth.currentUser) {
      setError('No active session found. Please sign in.');
      return;
    }
    setLoading(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        // Update Firestore
        try {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            emailVerified: true
          });
        } catch (upErr) {
          console.warn('Firestore status update note:', upErr);
        }

        let fullUser = { 
          uid: auth.currentUser.uid, 
          userId: auth.currentUser.uid,
          name: fullName || auth.currentUser.displayName || email.split('@')[0] || 'User',
          email: auth.currentUser.email,
          emailVerified: true 
        };

        try {
          const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userSnap.exists()) {
            fullUser = { uid: auth.currentUser.uid, ...userSnap.data(), emailVerified: true };
          }
        } catch (getErr) {
          console.warn('User profile read notice:', getErr);
        }

        syncLocalUserState(fullUser);
        if (setUser) setUser(fullUser);

        setLoading(false);
        onClose();
      } else {
        setVerificationNotice('Your Gmail is not verified yet! Please click the link sent to your inbox.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Verification status check error:', err);
      const msg = parseAuthErrorMessage(err);
      setError(msg);
      setLoading(false);
    }
  };

  // Resend Email Link
  const handleResend = async () => {
    if (!auth.currentUser) {
      setError('Please sign up or sign in first to send verification email.');
      return;
    }
    try {
      await sendEmailVerification(auth.currentUser);
      setResendSuccess(true);
      setVerificationNotice('A new verification link has been sent to your inbox. Please check your email.');
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err) {
      console.error('Resend verification error:', err);
      const msg = parseAuthErrorMessage(err);
      setError(msg);
    }
  };

  // Google Sign In
  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const googleData = {
        uid: user.uid,
        userId: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Google User',
        fullName: user.displayName || user.email?.split('@')[0] || 'Google User',
        email: user.email,
        phone: user.phoneNumber || '',
        address: '',
        city: '',
        zipCode: '',
        role: 'user',
        status: 'active',
        emailVerified: true,
        avatar: user.photoURL || '',
        picture: user.photoURL || '',
        createdAt: serverTimestamp()
      };

      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, googleData, { merge: true });
        }
      } catch (dbErr) {
        console.warn('Firestore Google user write note:', dbErr);
      }

      const fullUser = { ...user, ...googleData, emailVerified: true };
      syncLocalUserState(fullUser);
      if (setUser) setUser(fullUser);

      setLoading(false);
      onClose();
    } catch (err) {
      console.error('Google Auth error:', err);
      const friendlyMsg = parseAuthErrorMessage(err);
      setError(friendlyMsg);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-7 sm:p-9 space-y-5 shadow-2xl relative text-slate-800 max-h-[95vh] overflow-y-auto border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Back / Close Buttons */}
        {isVerifying ? (
          <button 
            onClick={() => setIsVerifying(false)} 
            type="button" 
            className="absolute top-6 left-6 text-slate-400 hover:text-slate-700 text-lg transition-colors cursor-pointer w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
          >
            ←
          </button>
        ) : null}

        <button 
          onClick={onClose} 
          type="button" 
          aria-label="Close modal"
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 text-lg transition-colors cursor-pointer w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
        >
          ✕
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-1.5 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-xs">
            {siteSettings?.logoUrl ? (
              <img src={siteSettings.logoUrl} alt="Logo" className="h-12 w-12 rounded-xl object-contain bg-black" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-white text-base shadow-sm">FM</div>
            )}
          </div>

          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {isVerifying ? 'Verify Email Address' : (isLogin ? 'Welcome to FileMarket' : 'Create Free Account')}
          </h3>
          <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
            {isVerifying 
              ? 'Check your email inbox to verify your account.' 
              : (isLogin ? 'Access your purchased digital assets, instant downloads & lifetime licenses.' : 'Join FileMarket for lifetime cloud access to digital downloads & verified licenses.')}
          </p>
        </div>

        {/* Visual Error Banner (Always visible if error exists) */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2.5 shadow-xs animate-in fade-in duration-150">
            <span className="text-sm shrink-0">⚠️</span>
            <span className="leading-relaxed flex-1">{error}</span>
          </div>
        )}

        {/* --- SCREEN 1: VERIFICATION SCREEN (Exact match to screenshot) --- */}
        {isVerifying ? (
          <div className="space-y-4 pt-1">
            {verificationNotice && (
              <div className="bg-amber-50 border border-amber-200/80 text-amber-800 px-4 py-3 rounded-2xl text-xs flex items-start gap-2.5">
                <span className="text-sm shrink-0">✉️</span>
                <span className="leading-relaxed">{verificationNotice}</span>
              </div>
            )}

            {resendSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2.5 rounded-2xl text-xs text-center font-semibold">
                Verification link resent successfully!
              </div>
            )}

            {/* Email Info Box */}
            <div className="bg-amber-50/50 border border-amber-200/70 rounded-2xl p-5 text-center space-y-1.5">
              <div className="text-3xl text-amber-500">✉️</div>
              <div className="font-bold text-slate-800 text-xs sm:text-sm break-all">{email || auth.currentUser?.email}</div>
              <div className="text-[11px] font-semibold text-amber-600">Pending Verification</div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={handleCheckStatus}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-500/25 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <span>🔄</span>
                <span>{loading ? 'Checking...' : 'Check Status (যাচাই করুন)'}</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="py-3 px-3 rounded-2xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-700 flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>Open Gmail</span>
                  <span>↗</span>
                </a>

                <button
                  type="button"
                  onClick={handleResend}
                  className="py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 font-bold text-xs text-white flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <span>🚀</span>
                  <span>Resend Link</span>
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setIsVerifying(false); setError(''); }}
                className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
              >
                ← Edit Information
              </button>
            </div>
          </div>
        ) : (
          /* --- SCREEN 2: SIGNUP / LOGIN FORM --- */
          <>
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 font-bold text-xs sm:text-sm text-slate-700 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.18 21.32 7.27 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.12 0 9.87 0 11.7c0 1.83.43 3.58 1.19 5.12l4.09-2.55z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.27 0 3.18 2.68 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold tracking-wider">
              <div className="flex-1 border-t border-slate-200" />
              <span>OR CONTINUE WITH EMAIL</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {!isLogin && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Full Name <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400">👤</span>
                    <input
                      type="text"
                      required
                      placeholder="Joy Barmon"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">✉️</span>
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all text-xs"
                  />
                </div>
              </div>

              {!isLogin && (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Phone / WhatsApp <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400">📞</span>
                      <input
                        type="tel"
                        placeholder="017XXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Full Address <span className="text-rose-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3 text-slate-400">📍</span>
                      <input
                        type="text"
                        required
                        placeholder="House 12, Road 4, Agrabad"
                        value={fullAddress}
                        onChange={(e) => setFullAddress(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">City <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="Chattogram"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Zip Code <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="4000"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all text-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-slate-700 font-bold">Password <span className="text-rose-500">*</span></label>
                  {isLogin && <button type="button" onClick={() => { setIsLogin(false); setError(''); }} className="text-emerald-600 font-bold hover:underline text-[11px] cursor-pointer">Forgot Password?</button>}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <label className="flex items-center gap-2 cursor-pointer pt-1 select-none">
                  <input 
                    type="checkbox" 
                    checked={agreeTerms} 
                    onChange={(e) => setAgreeTerms(e.target.checked)} 
                    className="rounded text-emerald-500 focus:ring-0 cursor-pointer accent-emerald-500"
                  />
                  <span className="text-[11px] text-slate-600 font-medium">I agree to Terms & Privacy Policy</span>
                </label>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm transition-all shadow-md shadow-emerald-500/25 mt-2 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In →' : 'Create Free Account →')}
              </button>
            </form>

            <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
              {isLogin ? (
                <span>Don't have an account? <button type="button" onClick={() => { setIsLogin(false); setError(''); }} className="text-emerald-600 font-bold hover:underline cursor-pointer">Create Free Account</button></span>
              ) : (
                <span>Already registered on FileMarket? <button type="button" onClick={() => { setIsLogin(true); setError(''); }} className="text-emerald-600 font-bold hover:underline cursor-pointer">Sign In Instead</button></span>
              )}
            </div>
          </>
        )}

        {/* Footer Badges */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 font-semibold pt-1 border-t border-slate-100">
          <span>🔒 256-Bit SSL</span>
          <span>⚡ Instant Cloud Delivery</span>
          <span>🛡️ Firebase Secured</span>
        </div>

      </div>
    </div>
  );
}

export { AuthModal };
