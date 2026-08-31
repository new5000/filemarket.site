import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  CreditCard, 
  Users, 
  Settings, 
  Sun, 
  Moon, 
  Menu, 
  X, 
  Store, 
  ChevronRight,
  Globe,
  Tag,
  Sliders,
  ChevronLeft,
  Tv,
  Bell,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Megaphone
} from 'lucide-react';
import { navigateTo } from '../../router';
import { auth } from '../../lib/firebase';
import { useBrand } from '../../context/BrandContext';

export type AdminTab = 
  | 'dashboard' 
  | 'cms' 
  | 'banners'
  | 'ads'
  | 'products' 
  | 'orders' 
  | 'coupons' 
  | 'payments' 
  | 'users' 
  | 'settings';

interface AdminLayoutProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  children: React.ReactNode;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  activeTab,
  setActiveTab,
  children,
  darkMode,
  setDarkMode
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fm_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('fm_admin_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const { brandName, logoUrl, founderAvatarUrl, founderName, founderBio } = useBrand();
  const currentUser = auth.currentUser;
  const userEmail = currentUser?.email || 'admin@filemarket.site';

  const navItems = [
    { 
      id: 'dashboard' as AdminTab, 
      label: 'Dashboard Overview', 
      shortLabel: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Real-time sales, live traffic & system ledger'
    },
    { 
      id: 'cms' as AdminTab, 
      label: 'Header & Footer Customizer', 
      shortLabel: 'Header & Footer',
      icon: Globe,
      description: 'Brand identity, logos, navigation menus & social links'
    },
    { 
      id: 'banners' as AdminTab, 
      label: 'Hero Banners & Promos', 
      shortLabel: 'Hero Banners',
      icon: Tv,
      description: 'Artwork sliders, promo badges & call-to-action triggers'
    },
    { 
      id: 'ads' as AdminTab, 
      label: '📢 Ads & Monetization', 
      shortLabel: 'Ads Manager',
      icon: Megaphone,
      description: 'Adsterra/AdSense scripts, image banners & 5 global ad slots'
    },
    { 
      id: 'products' as AdminTab, 
      label: 'Product Engine (CRUD)', 
      shortLabel: 'Products',
      icon: Package,
      description: 'Digital assets, physical goods, gallery & stock engine'
    },
    { 
      id: 'orders' as AdminTab, 
      label: 'Orders & Verification', 
      shortLabel: 'Orders',
      icon: CreditCard,
      description: 'TrxID verification, screenshots lightbox & storage quota cleanup'
    },
    { 
      id: 'coupons' as AdminTab, 
      label: 'Coupons & Flash Deals', 
      shortLabel: 'Coupons',
      icon: Tag,
      description: 'Promo codes, percentage/fixed discounts & limits'
    },
    { 
      id: 'payments' as AdminTab, 
      label: 'Payment Gateways Hub', 
      shortLabel: 'Payments',
      icon: CreditCard,
      description: 'Stripe, PayPal, Shurjopay, SSLCommerz & Custom Gateways'
    },
    { 
      id: 'users' as AdminTab, 
      label: 'Users & Permissions', 
      shortLabel: 'Users',
      icon: Users,
      description: 'Customer accounts, roles, ban switches & password reset'
    },
    { 
      id: 'settings' as AdminTab, 
      label: 'Store Settings & SEO', 
      shortLabel: 'Settings',
      icon: Settings,
      description: 'Multi-currency rates, SEO metadata, Maintenance & Custom CSS'
    },
  ];

  const currentNav = navItems.find(item => item.id === activeTab) || navItems[0];

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
    navigateTo(`/admin/${tab}`);
  };

  const handleExitToStore = () => {
    navigateTo('/');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-200 flex flex-col font-sans`}>
      
      {/* Top Mobile Bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <img 
              src={logoUrl || "https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10"} 
              alt={brandName}
              className="w-7 h-7 rounded-lg object-contain bg-slate-900 border border-emerald-500/30"
              referrerPolicy="no-referrer"
            />
            <div className="font-heading font-black text-sm text-slate-900 dark:text-white leading-none">
              {brandName} <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-extrabold tracking-wider">Admin</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
          <button
            onClick={handleExitToStore}
            className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
            title="View Live Store"
          >
            <Store className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar Desktop & Mobile Drawer */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-50 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out
            ${mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
            ${isSidebarCollapsed ? 'lg:w-20 p-3' : 'lg:w-64 p-4'}
          `}
        >
          {/* Top Brand Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pt-1">
              <div className={`flex items-center gap-3 overflow-hidden ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
                <img 
                  src={logoUrl || "https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10"} 
                  alt={brandName}
                  className="w-9 h-9 rounded-xl object-contain shadow-md bg-slate-900 border border-emerald-500/40 shrink-0"
                  referrerPolicy="no-referrer"
                />
                {!isSidebarCollapsed && (
                  <div className="min-w-0">
                    <div className="font-heading font-black text-sm text-slate-900 dark:text-white leading-tight truncate">
                      {brandName}
                    </div>
                    <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Enterprise Hub
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Close Button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Desktop Collapse Toggle */}
            <div className="hidden lg:flex items-center justify-between px-1">
              {!isSidebarCollapsed && (
                <span className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">Navigation</span>
              )}
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition cursor-pointer mx-auto"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            {/* Navigation Menu Links */}
            <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-250px)] pr-0.5 custom-scrollbar">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`
                      w-full flex items-center rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer group relative
                      ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-between px-3 py-2.5'}
                      ${isActive 
                        ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}
                    `}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-emerald-500 transition-colors'}`} />
                      {!isSidebarCollapsed && (
                        <span className="truncate">{item.shortLabel}</span>
                      )}
                    </div>
                    {!isSidebarCollapsed && isActive && (
                      <ChevronRight className="w-3.5 h-3.5 opacity-80 shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer Controls */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            {/* User Profile Badge */}
            {!isSidebarCollapsed ? (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full overflow-hidden border border-emerald-500/40 shrink-0 bg-slate-900">
                  <img src={founderAvatarUrl} alt={founderName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{userEmail}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider">Super Administrator</div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center" title={userEmail}>
                <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/40 bg-slate-900">
                  <img src={founderAvatarUrl} alt={founderName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className={`flex items-center gap-1.5 ${isSidebarCollapsed ? 'flex-col' : ''}`}>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer ${isSidebarCollapsed ? 'w-full' : 'flex-1'}`}
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
                {!isSidebarCollapsed && <span>{darkMode ? 'Light' : 'Dark'}</span>}
              </button>

              <button
                onClick={handleExitToStore}
                className={`py-2 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${isSidebarCollapsed ? 'w-full' : 'flex-1'}`}
                title="View Live Store"
              >
                <Store className="w-3.5 h-3.5" />
                {!isSidebarCollapsed && <span>Live Store</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          ></div>
        )}

        {/* Main Content Area with Header Breadcrumbs */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Breadcrumbs & Header Bar */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 sticky top-0 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              {/* Breadcrumb Path */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer" onClick={() => handleTabChange('dashboard')}>Admin Hub</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                <span className="font-bold text-slate-900 dark:text-white">{currentNav.label}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                {currentNav.description}
              </p>
            </div>

            {/* Quick Status Bar */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Firestore Live Sync</span>
              </div>

              <button
                onClick={handleExitToStore}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
              >
                <span>Store</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </button>
            </div>
          </div>

          {/* Content Wrapper */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
