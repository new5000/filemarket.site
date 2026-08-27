import React from 'react';
import { formatDirectImageUrl } from '../utils/formatImageUrl';
import { 
  ShieldAlert, 
  Wrench, 
  Clock, 
  MessageCircle, 
  CheckCircle2, 
  Sun, 
  Moon, 
  ShieldCheck 
} from 'lucide-react';
import { GlobalConfig } from '../types';
import AnimatedBrandTitle from './AnimatedBrandTitle';

interface MaintenanceScreenProps {
  globalConfig: GlobalConfig;
  darkMode: boolean;
  onToggleTheme: () => void;
  onNavigateAdmin?: () => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  globalConfig,
  darkMode,
  onToggleTheme,
  onNavigateAdmin,
}) => {
  const siteName = globalConfig.branding?.siteName || 'FileMarket';
  const logoUrl = globalConfig.branding?.logoUrl || 'https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10';
  const whatsappNumber = globalConfig.branding?.whatsappNumber || '8801673833783';

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Hi ${siteName} Support team, I am visiting the site during the maintenance window.`);
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-300 relative overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-amber-500/10 via-emerald-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <img 
            src={formatDirectImageUrl(logoUrl) || 'https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10'} 
            alt={siteName} 
            className="w-9 h-9 rounded-xl object-contain shadow-md shadow-slate-900/10 ring-1 ring-slate-200 dark:ring-slate-800"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="font-heading font-black text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <AnimatedBrandTitle text={siteName} />
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Maintenance Mode
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition shadow-sm cursor-pointer"
            title={darkMode ? "Switch to Day Mode" : "Switch to Night Mode"}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>
        </div>
      </header>

      {/* Center Maintenance Hero */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12 sm:py-20 flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-emerald-500/20 to-teal-500/20 border border-amber-500/30 dark:border-amber-500/40 flex items-center justify-center shadow-2xl shadow-amber-500/10 animate-pulse">
            <Wrench className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-emerald-500 text-slate-950 shadow-lg ring-4 ring-white dark:ring-[#0B0F19]">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-black tracking-wide uppercase mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          Scheduled System Upgrade in Progress
        </div>

        {/* Main Headings */}
        <h1 className="text-3xl sm:text-5xl font-black text-slate-950 dark:text-white font-heading tracking-tight max-w-2xl leading-tight sm:leading-tight mb-4">
          We&apos;re Upgrading <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">{siteName}</span> for Higher Speed & Security
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed mb-8">
          Our engineering team is currently performing scheduled database optimization, payment gateway enhancements, and cloud locker infrastructure upgrades. Storefront browsing and checkouts are temporarily paused.
        </p>

        {/* Feature & Security Assurance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mb-10 text-left">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2 text-emerald-500 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" /> Cloud Locker Safe
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All previously purchased download drive links remain 100% active and accessible.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2 text-amber-500 font-bold text-xs">
              <Clock className="w-4 h-4" /> Fast Return
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Platform upgrades are progressing smoothly and we will be live again very shortly.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2.5 mb-2 text-cyan-500 font-bold text-xs">
              <ShieldAlert className="w-4 h-4" /> 24/7 Support
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Our direct WhatsApp desk is available for urgent customer queries.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          <button
            onClick={handleWhatsApp}
            className="w-full py-3.5 px-8 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            Contact WhatsApp Support
          </button>

          {onNavigateAdmin && (
            <button
              onClick={onNavigateAdmin}
              className="text-xs font-bold text-slate-400 hover:text-emerald-500 hover:underline transition flex items-center gap-1 cursor-pointer bg-transparent border-none outline-none mt-2"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Portal Login
            </button>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-6 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 text-center">
        <p>© {new Date().getFullYear()} {siteName}. All Rights Reserved.</p>
      </footer>
    </div>
  );
};
export default MaintenanceScreen;
