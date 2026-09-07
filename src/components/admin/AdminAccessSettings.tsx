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

    let confirmChange = true;
    try {
      if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
        confirmChange = window.confirm(
          `⚠️ WARNING: If you change this to "${sanitizedEmail}", only this specific email will be able to access the Admin Panel in the future. Do you want to proceed?`
        );
      }
    } catch {
      confirmChange = true;
    }

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
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl shadow-slate-900/5 space-y-4">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <Shield className="w-4 h-4" />
          </span>
          <span>Admin Access</span>
        </h3>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 max-w-[180px] sm:max-w-none truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="truncate">{currentMasterEmail}</span>
        </span>
      </div>

      <form onSubmit={handleUpdateAdminEmail} className="space-y-3">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
            Admin Gmail
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@gmail.com"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 h-[42px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
            statusMsg.startsWith('✅') 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
          }`}>
            {statusMsg.startsWith('✅') ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="text-[11px]">{statusMsg}</span>
          </div>
        )}
      </form>
    </div>
  );
}
