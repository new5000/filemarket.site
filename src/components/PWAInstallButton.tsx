import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-4 py-2 text-sm font-black text-white shadow-sm transition-all active:scale-95 ${className}`}
      >
        <Download className="w-4 h-4" />
        Install App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-2 rounded-xl border-2 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-600 dark:text-emerald-400 shadow-sm transition-all hover:border-emerald-500/50 active:scale-95 ${className}`}
        >
          <Download className="w-4 h-4" />
          Install iOS App
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-xl font-black text-slate-900 dark:text-white pr-8">Install on iPhone</h3>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                1. Tap the <strong className="text-slate-800 dark:text-slate-200">Share</strong> button in the Safari toolbar.<br />
                2. Scroll down and tap <strong className="text-slate-800 dark:text-slate-200">Add to Home Screen</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-slate-100 dark:bg-slate-800 py-3 text-sm font-black text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Close Guide
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
