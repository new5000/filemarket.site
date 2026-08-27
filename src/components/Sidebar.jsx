import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export default function Sidebar({ isOpen, onClose, onOpenAuth, user: propUser }) {
  const [currentUser, setCurrentUser] = useState(propUser || null);

  // Directly observe auth.currentUser & sync Firestore data
  useEffect(() => {
    let unsubFirestore = () => {};

    const syncUserState = () => {
      try {
        const saved = localStorage.getItem('filemarket_user');
        if (saved) {
          setCurrentUser(JSON.parse(saved));
        } else if (!auth.currentUser) {
          setCurrentUser(null);
        }
      } catch (e) {}
    };

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      unsubFirestore();
      if (fbUser) {
        // Fallback immediate data
        const fallbackData = {
          uid: fbUser.uid,
          userId: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          email: fbUser.email,
          emailVerified: fbUser.emailVerified
        };
        setCurrentUser((prev) => ({ ...(prev || {}), ...fallbackData }));

        // Firestore real-time doc sync
        try {
          unsubFirestore = onSnapshot(doc(db, 'users', fbUser.uid), (docSnap) => {
            if (docSnap.exists()) {
              const fullProfile = {
                uid: fbUser.uid,
                userId: fbUser.uid,
                ...docSnap.data(),
                email: fbUser.email,
                emailVerified: fbUser.emailVerified
              };
              setCurrentUser(fullProfile);
            }
          }, (err) => {
            console.warn('Sidebar Firestore profile note:', err);
          });
        } catch (e) {
          console.warn('Sidebar doc listener error:', e);
        }
      } else {
        syncUserState();
      }
    });

    const handleCustomEvents = () => syncUserState();
    window.addEventListener('storage', handleCustomEvents);
    window.addEventListener('auth:state-changed', handleCustomEvents);
    window.addEventListener('filemarket:auth-change', handleCustomEvents);

    return () => {
      unsubAuth();
      unsubFirestore();
      window.removeEventListener('storage', handleCustomEvents);
      window.removeEventListener('auth:state-changed', handleCustomEvents);
      window.removeEventListener('filemarket:auth-change', handleCustomEvents);
    };
  }, []);

  // Sync if prop changes
  useEffect(() => {
    if (propUser !== undefined) {
      setCurrentUser(propUser);
    }
  }, [propUser]);

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('filemarket_user');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('fm_user_name');
      localStorage.removeItem('fm_user_email');
      localStorage.removeItem('fm_user_uid');
      setCurrentUser(null);
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('auth:state-changed'));
      window.dispatchEvent(new CustomEvent('filemarket:auth-change'));
      if (onClose) onClose();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const activeUser = currentUser || propUser;
  const displayName = activeUser?.name || activeUser?.fullName || activeUser?.displayName || (activeUser?.email ? activeUser.email.split('@')[0] : 'User');
  const displayEmail = activeUser?.email || '';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xs sm:max-w-sm bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col justify-between overflow-y-auto text-white shadow-2xl">
        
        <div className="space-y-6">
          {/* Header Profile Info */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
                {activeUser ? (displayName.charAt(0) || 'U').toUpperCase() : '👤'}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-white text-sm truncate">
                  {activeUser ? displayName : 'Guest User'}
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  {activeUser ? displayEmail : 'Joy Bhai Auth Center'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              type="button"
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Account Access Section */}
          {!activeUser ? (
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account Access</h5>
              <p className="text-xs text-slate-400">Log in or sign up to access your purchased files and lockers.</p>
              
              <button
                type="button"
                onClick={() => { if (onClose) onClose(); if (onOpenAuth) onOpenAuth(true); }}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-98"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => { if (onClose) onClose(); if (onOpenAuth) onOpenAuth(false); }}
                className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-all shadow-md shadow-rose-500/20 cursor-pointer active:scale-98"
              >
                Sign Up Free
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Account Status:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                    Active
                  </span>
                </div>
                {activeUser?.phone && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Phone:</span>
                    <span className="text-slate-200">{activeUser.phone}</span>
                  </div>
                )}
                {(activeUser?.city || activeUser?.address) && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Location:</span>
                    <span className="text-slate-200">{activeUser.city || activeUser.address}</span>
                  </div>
                )}
              </div>

              <button 
                type="button"
                onClick={handleLogout}
                className="w-full py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <span>🚪</span>
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export { Sidebar };
