import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { navigateTo } from '../router';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackUrl?: string;
  blockedMessage?: string;
}

export function ProtectedRoute({
  children,
  fallbackUrl = '/login',
  blockedMessage = '⚠️ Please sign in or create an account to proceed to checkout!',
}: ProtectedRouteProps) {
  const { currentUser, loading, authStatus } = useAuth();

  const isAuthed = Boolean(currentUser || authStatus.isLoggedIn);
  const currentPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';

  useEffect(() => {
    if (!loading && !isAuthed) {
      // Store intended URL so user returns seamlessly upon login
      if (currentPath && currentPath !== '/login' && currentPath !== '/signup') {
        sessionStorage.setItem('auth_redirect_url', currentPath);
      }
      navigateTo(fallbackUrl, {
        replace: true,
        state: { from: currentPath, message: blockedMessage },
      });
    }
  }, [loading, isAuthed, currentPath, fallbackUrl, blockedMessage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold mt-3">Verifying authentication...</p>
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold mt-3">Redirecting to sign in...</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
