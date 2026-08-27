import React, { useState, useEffect } from 'react';
import { ShieldAlert, LogIn, ArrowLeft, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { 
  auth, 
  db,
  googleProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  FirebaseUser,
  syncGoogleUserWithFirestore 
} from '../../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { navigateTo } from '../../router';
import { clearUserSessionCache } from '../../lib/authGuard';

export const DEFAULT_ADMIN_EMAIL = 'new144506@gmail.com';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  onOpenLogin?: () => void;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children, onOpenLogin }) => {
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [authorizedAdminEmail, setAuthorizedAdminEmail] = useState<string>(() => {
    return localStorage.getItem('fm_master_admin_email') || DEFAULT_ADMIN_EMAIL;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // Real-time synchronization of master admin email from Firestore settings/admin_access
  useEffect(() => {
    let unsubAdminEmail = () => {};
    try {
      unsubAdminEmail = onSnapshot(doc(db, 'settings', 'admin_access'), (docSnap) => {
        if (docSnap.exists() && docSnap.data().masterEmail) {
          const email = docSnap.data().masterEmail.trim().toLowerCase();
          setAuthorizedAdminEmail(email);
          localStorage.setItem('fm_master_admin_email', email);
        } else {
          setAuthorizedAdminEmail(DEFAULT_ADMIN_EMAIL);
          localStorage.setItem('fm_master_admin_email', DEFAULT_ADMIN_EMAIL);
        }
      }, (err) => {
        console.warn("Admin access check fallback:", err);
      });
    } catch (err) {
      console.warn("Could not subscribe to admin_access:", err);
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      unsubAdminEmail();
      unsubscribeAuth();
    };
  }, []);

  const handleGoogleAdminLogin = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, googleProvider);
      const signedInUser = result.user;

      const currentMaster = authorizedAdminEmail.trim().toLowerCase();

      // Check dynamic master email matching
      if (!signedInUser.email || signedInUser.email.toLowerCase().trim() !== currentMaster) {
        await fbSignOut(auth);
        clearUserSessionCache();
        setAuthError(`Access Denied: ${signedInUser.email || 'This account'} is not authorized. Admin access is strictly limited.`);
        setIsSigningIn(false);
        return;
      }

      // Check google provider
      const isGoogle = signedInUser.providerData.some((p) => p.providerId === 'google.com');
      if (!isGoogle) {
        await fbSignOut(auth);
        clearUserSessionCache();
        setAuthError(`Access Denied: You must sign in using Google Auth ("Continue with Google").`);
        setIsSigningIn(false);
        return;
      }

      // Sync user profile
      await syncGoogleUserWithFirestore(signedInUser);
      setUser(signedInUser);
      setIsSigningIn(false);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setIsSigningIn(false);
        return;
      }
      console.error("Admin Google Login Error:", err);
      setAuthError(err.message || 'Google Sign-In failed. Please try again.');
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fbSignOut(auth);
      clearUserSessionCache();
      setUser(null);
      setAuthError(null);
    } catch (e) {
      console.warn("Sign out error:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-emerald-400 font-bold p-4 space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-mono tracking-wide">Verifying Security Credentials...</p>
      </div>
    );
  }

  // Strict Condition 1: Must be logged in
  // Strict Condition 2: Must match exact authorized email from Firestore (or fallback)
  // Strict Condition 3: Must be signed in via Google Provider
  const isGoogleProvider = Boolean(user?.providerData?.some(
    (p) => p.providerId === 'google.com'
  ));

  const currentMaster = authorizedAdminEmail.trim().toLowerCase();
  const isEmailMatch = Boolean(user?.email && user.email.toLowerCase().trim() === currentMaster);

  const isAuthorizedAdmin = Boolean(user && isEmailMatch && isGoogleProvider);

  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 antialiased">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight">Restricted Admin Access</h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              The FileMarket Admin Panel is strictly reserved for the single authorized Google administrator account.
            </p>
          </div>

          {/* Active User Status & Warning */}
          {user && (!isEmailMatch || !isGoogleProvider) && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-2 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Unauthorized Account Detected</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Signed in as <strong className="text-white font-mono">{user.email || 'Unknown User'}</strong> via <strong className="text-slate-300">{isGoogleProvider ? 'Google' : 'Email/Password'}</strong>. Email/Password logins and unauthorized accounts are blocked from accessing admin controls.
              </p>
              <button
                onClick={handleSignOut}
                className="w-full mt-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Sign Out Current Account
              </button>
            </div>
          )}

          {authError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Single Google Sign-In Action */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleGoogleAdminLogin}
              disabled={isSigningIn}
              className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xl hover:scale-[1.01] active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  <span>Signing In with Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google (Admin Only)</span>
                </>
              )}
            </button>

            <button
              onClick={() => navigateTo('/')}
              className="w-full py-3 px-4 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to FileMarket Store
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[10px] text-slate-500 font-mono text-center">
            🔒 Secured by Google Identity Services & Firebase Auth
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;

