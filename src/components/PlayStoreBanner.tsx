import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface PlayStoreBannerProps {
  enabled: boolean;
  appUrl: string;
}

export const PlayStoreBanner: React.FC<PlayStoreBannerProps> = ({ enabled, appUrl }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('dismissedPlayBanner') || sessionStorage.getItem('hidePlayBanner');
    if (enabled && appUrl && !isDismissed) {
      // Delay entrance by 1.5s for seamless page load
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [enabled, appUrl]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('dismissedPlayBanner', 'true');
    sessionStorage.setItem('hidePlayBanner', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-5 sm:max-w-sm z-40"
        >
          <div className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 transition-colors">
            
            {/* Play Store Logo / App Icon */}
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700/50">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                <path d="M3.609 1.814L13.792 12 3.61 22.186c-.347-.282-.56-.71-.56-1.186V3c0-.476.213-.904.56-1.186z" fill="#00D3FF"/>
                <path d="M17.186 8.607L13.792 12l3.394 3.393 3.86-2.227c.75-.434.75-1.701 0-2.134l-3.86-2.425z" fill="#FFCE00"/>
                <path d="M3.609 1.814L17.186 8.607 13.792 12 3.61 1.814z" fill="#00F076"/>
                <path d="M13.792 12l3.394 3.393L3.61 22.186 13.792 12z" fill="#FF3A44"/>
              </svg>
            </div>

            {/* Text Details */}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                FileMarket Official App
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Fast, 1-Click Access & Orders
              </p>
            </div>

            {/* CTA Install Button */}
            <a
              href={appUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
            >
              Install
            </a>

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0 cursor-pointer"
              title="Dismiss"
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
