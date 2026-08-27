import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { auth, verifyPasswordResetCode, confirmPasswordReset } from '../lib/firebase';
import { getAuthErrorMessage } from '../lib/authErrorMapper';
import { useGlobalSettings } from '../context/GlobalSettingsContext';

interface ResetPasswordPageProps {
  oobCode?: string | null;
  onNavigateHome?: () => void;
  onOpenLogin?: (view: 'login' | 'forgot') => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ 
  oobCode: propCode,
  onNavigateHome,
  onOpenLogin
}) => {
  const { darkMode } = useGlobalSettings();

  // Extract oobCode from prop or URL search parameters
  const [code, setCode] = useState<string>(() => {
    if (propCode) return propCode;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('oobCode') || '';
    }
    return '';
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<'verifying' | 'valid' | 'invalid' | 'resetting' | 'success'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(3);

  // Sync prop changes
  useEffect(() => {
    if (propCode) {
      setCode(propCode);
    } else if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('oobCode');
      if (urlCode) setCode(urlCode);
    }
  }, [propCode]);

  // Verify Action Code with Firebase Auth
  useEffect(() => {
    let isMounted = true;

    const verifyCode = async () => {
      if (!code) {
        if (isMounted) {
          setStatus('invalid');
          setErrorMessage('No password reset code found in URL. Please request a new reset link.');
        }
        return;
      }

      setStatus('verifying');
      setErrorMessage(null);

      try {
        const userEmail = await verifyPasswordResetCode(auth, code);
        if (isMounted) {
          setEmail(userEmail);
          setStatus('valid');
        }
      } catch (error: any) {
        console.warn("verifyPasswordResetCode error:", error);
        if (isMounted) {
          setStatus('invalid');
          setErrorMessage(getAuthErrorMessage(error));
        }
      }
    };

    verifyCode();

    return () => {
      isMounted = false;
    };
  }, [code]);

  // Auto redirect countdown when success
  useEffect(() => {
    if (status !== 'success') return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onOpenLogin) {
            onOpenLogin('login');
          } else if (onNavigateHome) {
            onNavigateHome();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, onOpenLogin, onNavigateHome]);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setStatus('resetting');

    try {
      await confirmPasswordReset(auth, code, newPassword);
      setStatus('success');
      setCountdown(3);
    } catch (error: any) {
      console.error("confirmPasswordReset error:", error);
      const codeStr = error?.code || '';
      if (codeStr === 'auth/expired-action-code' || codeStr === 'auth/invalid-action-code') {
        setStatus('invalid');
      } else {
        setStatus('valid');
      }
      setErrorMessage(getAuthErrorMessage(error));
    }
  };

  // Password strength helper
  const hasMinLength = newPassword.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className={`min-h-[100dvh] w-full max-w-full overflow-x-hidden flex items-center justify-center p-3 sm:p-6 bg-slate-100 dark:bg-slate-950 transition-colors duration-300 relative ${
      darkMode ? 'text-white' : 'text-slate-900'
    }`}>
      {/* Ambient background glow */}
      <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 ${
        darkMode ? 'bg-emerald-500/10' : 'bg-emerald-500/5'
      } rounded-full blur-3xl pointer-events-none`} />
      <div className={`absolute bottom-1/4 left-1/3 w-80 h-80 ${
        darkMode ? 'bg-teal-500/10' : 'bg-teal-500/5'
      } rounded-full blur-3xl pointer-events-none`} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -10 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`max-w-md w-full mx-auto p-6 sm:p-8 rounded-3xl transition-all duration-200 relative overflow-hidden z-10 ${
          darkMode 
            ? 'bg-slate-900/90 border border-slate-800 text-white shadow-2xl backdrop-blur-xl' 
            : 'bg-white/95 border border-slate-200 text-slate-900 shadow-xl backdrop-blur-xl'
        }`}
      >
        {/* VIEW 1: VERIFYING CODE */}
        {status === 'verifying' && (
          <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 animate-pulse">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className={`font-heading font-bold text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>Verifying Reset Link</h3>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Checking Firebase cryptographic security credentials...</p>
            </div>
          </div>
        )}

        {/* VIEW 2: INVALID / EXPIRED LINK */}
        {status === 'invalid' && (
          <div className="space-y-6 text-center py-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(244,63,94,0.25)]">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className={`font-heading font-black text-xl sm:text-2xl tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Reset Link Expired
              </h2>
              <p className={`text-xs sm:text-sm leading-relaxed max-w-sm mx-auto ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {errorMessage || 'This password reset link is invalid or has already been used. Security links expire after 1 hour.'}
              </p>
            </div>

            <div className={`p-4 rounded-2xl border text-left space-y-2 text-xs ${
              darkMode ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <p className={`font-bold flex items-center gap-1.5 ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Next Step:</span>
              </p>
              <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Click below to request a fresh password reset link sent directly to your registered Gmail address.</p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onOpenLogin) {
                    onOpenLogin('forgot');
                  } else if (onNavigateHome) {
                    onNavigateHome();
                  }
                }}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-extrabold text-sm shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Request New Link</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenLogin) {
                    onOpenLogin('login');
                  } else if (onNavigateHome) {
                    onNavigateHome();
                  }
                }}
                className={`text-xs font-bold hover:underline transition cursor-pointer flex items-center justify-center mx-auto gap-1.5 ${
                  darkMode ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 3: SUCCESS STATE */}
        {status === 'success' && (
          <div className="space-y-6 text-center py-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-500 flex items-center justify-center mx-auto shadow-[0_0_35px_rgba(16,185,129,0.35)]">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h2 className={`font-heading font-black text-2xl tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Password Updated!
              </h2>
              <p className={`text-sm font-semibold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                ✅ Password successfully updated!
              </p>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Redirecting to Sign In in <span className="text-emerald-500 font-bold font-mono">{countdown}s</span>...
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onOpenLogin) {
                    onOpenLogin('login');
                  } else if (onNavigateHome) {
                    onNavigateHome();
                  }
                }}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-extrabold text-sm shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
              >
                Sign In Now →
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: ACTIVE RESET FORM */}
        {(status === 'valid' || status === 'resetting') && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="text-center space-y-1.5 pb-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 text-emerald-500 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.25)] mb-2">
                <KeyRound className="w-7 h-7" />
              </div>
              <h2 className={`font-heading font-black text-xl sm:text-2xl tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Create New Password
              </h2>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Enter your new secure password for{' '}
                <span className="text-emerald-500 font-bold font-mono">{email || 'your account'}</span>
              </p>
            </div>

            {/* Error Message Toast */}
            {errorMessage && (
              <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in duration-200 ${
                darkMode ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* New Password Field */}
            <div className="space-y-1">
              <label className={`text-[11px] font-bold flex items-center justify-between ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <span>New Password</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-medium">
                  Min 6 characters
                </span>
              </label>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  required
                  autoFocus
                  className={`w-full ${
                    darkMode 
                      ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
                  } border rounded-xl pl-10 pr-11 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition p-1 cursor-pointer ${
                    darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1">
              <label className={`text-[11px] font-bold flex items-center justify-between ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <span>Confirm Password</span>
                {confirmPassword && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${
                    passwordsMatch 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  }`}>
                    {passwordsMatch ? 'Passwords Match ✓' : 'Mismatch ✗'}
                  </span>
                )}
              </label>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMessage(null);
                  }}
                  required
                  className={`w-full ${
                    darkMode 
                      ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-600'
                  } border rounded-xl pl-10 pr-11 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition p-1 cursor-pointer ${
                    darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Validation Checklist */}
            <div className={`p-3 rounded-xl border space-y-1.5 text-[11px] ${
              darkMode ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <div className="flex items-center gap-2">
                {hasMinLength ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className={hasMinLength ? (darkMode ? 'text-slate-200 font-medium' : 'text-slate-800 font-medium') : ''}>
                  At least 6 characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasLetter && hasNumber ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className={hasLetter && hasNumber ? (darkMode ? 'text-slate-200 font-medium' : 'text-slate-800 font-medium') : ''}>
                  Contains letters & numbers
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status === 'resetting' || !hasMinLength}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-extrabold text-sm sm:text-base shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {status === 'resetting' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <span>Save New Password & Sign In →</span>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onOpenLogin) {
                    onOpenLogin('login');
                  } else if (onNavigateHome) {
                    onNavigateHome();
                  }
                }}
                className={`text-xs font-bold hover:underline transition cursor-pointer inline-flex items-center gap-1.5 ${
                  darkMode ? 'text-slate-400 hover:text-emerald-400' : 'text-slate-600 hover:text-emerald-600'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
