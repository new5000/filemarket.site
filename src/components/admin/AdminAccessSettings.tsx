import React, { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { Shield, ShieldAlert, CheckCircle2, AlertCircle, Loader2, Sparkles, Mail, Lock } from 'lucide-react';

export const FALLBACK_ADMIN_EMAIL = 'new144506@gmail.com';

interface AdminAccessSettingsProps {
  onUpdated?: (newEmail: string) => void;
}

export default function AdminAccessSettings({ onUpdated }: AdminAccessSettingsProps) {
  const [adminEmail, setAdminEmail] = useState<string>(() => {
    return localStorage.getItem('fm_master_admin_email') || FALLBACK_ADMIN_EMAIL;
  });
  const [currentMasterEmail, setCurrentMasterEmail] = useState<string>(FALLBACK_ADMIN_EMAIL);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('');

  // 1. Fetch & real-time subscribe to current Admin Email from Firestore
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, 'settings', 'admin_access'), (docSnap) => {
        if (docSnap.exists() && docSnap.data().masterEmail) {
          const fetchedEmail = docSnap.data().masterEmail.trim().toLowerCase();
          setAdminEmail(fetchedEmail);
          setCurrentMasterEmail(fetchedEmail);
          localStorage.setItem('fm_master_admin_email', fetchedEmail);
        } else {
          // Fallback default
          setAdminEmail(FALLBACK_ADMIN_EMAIL);
          setCurrentMasterEmail(FALLBACK_ADMIN_EMAIL);
          localStorage.setItem('fm_master_admin_email', FALLBACK_ADMIN_EMAIL);
        }
      }, (err) => {
        console.warn('Admin access settings snapshot warning:', err);
        const cached = localStorage.getItem('fm_master_admin_email') || FALLBACK_ADMIN_EMAIL;
        setAdminEmail(cached);
        setCurrentMasterEmail(cached);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Failed to subscribe to admin_access:', e);
      return () => {};
    }
  }, []);

  // 2. Save New Admin Email
  const handleUpdateAdminEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedEmail = adminEmail.trim().toLowerCase();

    if (!sanitizedEmail || !sanitizedEmail.includes('@') || sanitizedEmail.length < 5) {
      setStatusMsg('❌ Please enter a valid email address.');
      return;
    }

    const confirmChange = window.confirm(
      `⚠️ WARNING: If you change this to "${sanitizedEmail}", only this specific email will be able to access the Admin Panel in the future. Do you want to proceed?`
    );

    if (!confirmChange) return;

    setIsSaving(true);
    setStatusMsg('');

    try {
      const currentUser = auth.currentUser;
      const payload = {
        masterEmail: sanitizedEmail,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || 'master'
      };

      await setDoc(doc(db, 'settings', 'admin_access'), payload, { merge: true });
      localStorage.setItem('fm_master_admin_email', sanitizedEmail);
      setCurrentMasterEmail(sanitizedEmail);
      setStatusMsg('✅ Master Admin Email updated successfully!');

      if (onUpdated) {
        onUpdated(sanitizedEmail);
      }

      // Broadcast storage event for other components
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('admin:email-updated', { detail: { email: sanitizedEmail } }));
    } catch (err: any) {
      console.error('Failed to update admin email:', err);
      setStatusMsg('❌ Failed to update. Check Firestore database permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-900/5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Shield className="w-4 h-4" />
            </span>
            <span>Master Admin Access Control</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Only the account matching this specific Gmail address will have access to the Admin Portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active: <span className="font-mono">{currentMasterEmail}</span>
          </span>
        </div>
      </div>

      <form onSubmit={handleUpdateAdminEmail} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
            Authorized Master Admin Gmail
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="e.g. yourname@gmail.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition font-mono"
            />
          </div>
        </div>

        {statusMsg && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            statusMsg.startsWith('✅') 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
          }`}>
            {statusMsg.startsWith('✅') ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Stored in Firestore <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px]">settings/admin_access</code></span>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold rounded-2xl text-xs transition shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <span>Save & Update Admin Gmail</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
