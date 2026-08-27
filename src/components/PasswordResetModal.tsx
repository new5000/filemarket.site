import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { auth, verifyPasswordResetCode, confirmPasswordReset } from '../lib/firebase';

interface PasswordResetModalProps {
  oobCode: string;
  onClose: () => void;
  onOpenLogin: (view: 'login' | 'forgot') => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ oobCode, onClose, onOpenLogin }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<'verifying' | 'valid' | 'invalid' | 'resetting' | 'success'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';
    
    // Verify the password reset code
    const verifyCode = async () => {
      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setStatus('valid');
      } catch (error: any) {
        console.error("Action code error:", error);
        setStatus('invalid');
        const codeStr = error?.code || '';
        if (codeStr === 'auth/expired-action-code') {
          setErrorMessage('This password reset link has expired. Request a new one.');
        } else if (codeStr === 'auth/invalid-action-code') {
          setErrorMessage('This password reset link is invalid or has already been used.');
        } else {
          setErrorMessage(error?.message || 'The password reset link is invalid or has expired.');
        }
      }
    };

    verifyCode();

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [oobCode]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setStatus('resetting');

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setStatus('success');
    } catch (error: any) {
      console.error("Confirm reset error:", error);
      setStatus('valid');
      setErrorMessage(error.message || 'Failed to reset password. Please try again.');
    }
  };

  // Password strength helper
  const hasMinLength = newPassword.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const renderContent = () => {
    if (status === 'verifying') {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
          <p className="text-slate-300 font-medium">Verifying reset link...</p>
        </div>
      );
    }

    if (status === 'invalid') {
      return (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(244,63,94,0.2)]">
            <AlertCircle className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-heading font-black text-white">Reset Link Expired</h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
              {errorMessage || 'This password reset link is invalid or has already been used. Security links expire after 1 hour.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLogin('forgot');
            }}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-extrabold text-sm shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.6)] hover:scale-[1.01] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Request New Link</span>
          </button>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-heading font-black text-white">Password Updated!</h2>
            <p className="text-sm text-emerald-300 font-semibold">
              ✅ Password successfully updated!
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenLogin('login');
            }}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-extrabold text-sm shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.6)] transition-all cursor-pointer"
          >
            Sign In Now →
          </button>
        </div>
      );
    }

    return (
      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="text-center space-y-2 pb-1">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.25)]">
            <KeyRound className="w-8 h-8" />
          </div>
          <h2 className="font-heading font-black text-xl text-white tracking-tight">
            Create New Password
          </h2>
          <p className="text-xs text-slate-400">
            For <strong className="text-emerald-400 font-mono">{email}</strong>
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2 shadow-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* New Password */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
            <span>New Password</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 font-medium">Min 6 chars</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full bg-[#07111e]/90 border border-slate-700/80 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 focus:outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
            <span>Confirm Password</span>
            {confirmPassword && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${
                passwordsMatch 
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
              }`}>
                {passwordsMatch ? 'Match ✓' : 'Mismatch ✗'}
              </span>
            )}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-[#07111e]/90 border border-slate-700/80 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 focus:outline-none transition"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1 cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Checklist */}
        <div className="p-2.5 rounded-xl bg-[#07111e]/70 border border-slate-800 space-y-1 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5">
            {hasMinLength ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <X className="w-3 h-3 text-slate-600" />
            )}
            <span className={hasMinLength ? 'text-slate-200' : 'text-slate-500'}>
              At least 6 characters
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={status === 'resetting' || !hasMinLength}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-extrabold text-sm shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.6)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {status === 'resetting' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Updating...</span>
            </>
          ) : (
            <span>Save Password</span>
          )}
        </button>
      </form>
    );
  };

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full mx-auto p-6 sm:p-8 rounded-3xl bg-[#0F172A]/90 border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.15)] backdrop-blur-2xl relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
