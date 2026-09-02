import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Header } from './components/Header';
import { HeroSlider } from './components/HeroSlider';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductGrid } from './components/ProductGrid';
import { TrustMetricsBar } from './components/TrustMetricsBar';
import { ProductDetailModal } from './components/ProductDetailModal';
import { SmartSearchOverlayModal } from './components/SmartSearchOverlayModal';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import {
  PolicyPageType,
  PrivacyPolicyPage,
  RefundPolicyPage,
  TermsOfServicePage,
  AboutContactPage,
} from './components/PolicyPages';
import { Footer } from './components/Footer';
import { SlideDrawer } from './components/SlideDrawer';
import { CATEGORIES } from './data/products';
import { Product, Currency } from './types';
import { useAppRouter, getProductSlug, navigateTo, findProductBySlugOrId } from './router';
import { getAuthStatus, initAuthStateObserver } from './lib/authGuard';
import { SavedProductsPage } from './components/SavedProductsPage';
import { useSavedProducts } from './hooks/useSavedProducts';
import { useLivePresence } from './hooks/useLivePresence';
import { useScrollDirection } from './hooks/useScrollDirection';
import { PasswordResetModal } from './components/PasswordResetModal';
import { ProfileModal } from './components/ProfileModal';
import { ConfigProvider, useConfig } from './context/ConfigContext';
import { ProductProvider, useProducts } from './context/ProductContext';
import { GlobalSettingsProvider, useGlobalSettings } from './context/GlobalSettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BrandProvider } from './context/BrandContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import GlobalLoader from './components/GlobalLoader';
import CheckoutPage from './components/CheckoutPage';
import AdminPanel from './components/admin/AdminPanel';
import UserProfilePage from './components/UserProfilePage';
import LoginPage from './components/LoginPage';
import SignUpPage from './components/SignUpPage';
import MyProductsPage from './components/MyProductsPage';
import BloggerXmlStudioModal from './components/BloggerXmlStudioModal';
import { WatchPreviewPage } from './components/WatchPreviewPage';
import { CartDrawer } from './components/CartDrawer';
import { CustomPageView } from './components/CustomPageView';

function MainApp() {
  // Real-time live presence tracking across all visitors & tabs
  useLivePresence();

  // Initial App Preloader State
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isFadingOutPreloader, setIsFadingOutPreloader] = useState<boolean>(false);

  useEffect(() => {
    // Smooth initial app mounting & transition
    const timer = setTimeout(() => {
      setIsFadingOutPreloader(true);
      const fadeTimer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 500);
      return () => clearTimeout(fadeTimer);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const { products, loading: isProductsLoading } = useProducts();
  const { route, navigate } = useAppRouter(products);
  const { savedProducts, toggleProduct: handleToggleSave } = useSavedProducts();
  const { currency, setCurrency, darkMode, setDarkMode, toggleTheme, globalConfig } = useGlobalSettings();

  const rawMaintenanceMode = Boolean(
    globalConfig.maintenance || 
    globalConfig.maintenanceMode || 
    globalConfig.footerAndBadges?.maintenanceMode
  );

  // Parse query parameters for emergency maintenance bypass
  const searchParams = route?.searchParams || new URLSearchParams(window.location.search);
  if (
    searchParams.get('admin_bypass') === 'true' || 
    searchParams.get('bypass') === 'filemarket_secret'
  ) {
    sessionStorage.setItem('admin_maintenance_bypass', 'true');
  }

  const hasBypassSession = sessionStorage.getItem('admin_maintenance_bypass') === 'true';
  const isAdminPath = route?.name === 'admin' || window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/admin-login');

  // Dynamic admin check (auth.currentUser?.email matches configured master email)
  const cachedAdminEmail = localStorage.getItem('fm_master_admin_email') || 'new144506@gmail.com';
  const currentEmail = auth.currentUser?.email?.toLowerCase().trim() || '';
  const isUserAdmin = Boolean(auth.currentUser && currentEmail === cachedAdminEmail.toLowerCase().trim());

  // Show maintenance screen only if mode is enabled AND path is NOT admin AND user is NOT admin AND session does not have bypass
  const isMaintenanceMode = rawMaintenanceMode && !isAdminPath && !isUserAdmin && !hasBypassSession;

  // Centralized Firebase User & Firestore Profile Single Source of Truth
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('filemarket_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Global Auth Observer to handle signups, logouts, and user switches seamlessly
  useEffect(() => {
    const unsubscribeGuard = initAuthStateObserver();
    let unsubDoc = () => {};

    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      unsubDoc();
      if (fbUser) {
        try {
          unsubDoc = onSnapshot(doc(db, 'users', fbUser.uid), (snap) => {
            if (snap.exists()) {
              const profile = { 
                uid: fbUser.uid, 
                userId: fbUser.uid,
                ...snap.data(), 
                email: fbUser.email, 
                emailVerified: fbUser.emailVerified 
              };
              setCurrentUser(profile);
              try {
                localStorage.setItem('filemarket_user', JSON.stringify(profile));
                localStorage.setItem('isLoggedIn', 'true');
              } catch (e) {}
            } else {
              const fallback = {
                uid: fbUser.uid,
                userId: fbUser.uid,
                name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
                fullName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
                email: fbUser.email,
                role: 'user',
                status: 'active',
                emailVerified: fbUser.emailVerified,
              };
              setCurrentUser(fallback);
            }
          }, (err) => {
            console.warn('Firestore live user profile sync note:', err);
          });
        } catch (e) {
          console.warn('Snapshot listener init error:', e);
        }
      } else {
        const isLogged = localStorage.getItem('isLoggedIn') === 'true';
        if (isLogged) {
          try {
            const saved = localStorage.getItem('filemarket_user');
            setCurrentUser(saved ? JSON.parse(saved) : null);
          } catch {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
    });

    const handleCustomAuthChange = () => {
      try {
        const saved = localStorage.getItem('filemarket_user');
        if (saved) setCurrentUser(JSON.parse(saved));
      } catch (e) {}
    };

    window.addEventListener('storage', handleCustomAuthChange);
    window.addEventListener('auth:state-changed', handleCustomAuthChange);
    window.addEventListener('filemarket:auth-change', handleCustomAuthChange);

    return () => {
      unsubscribeGuard();
      unsubAuth();
      unsubDoc();
      window.removeEventListener('storage', handleCustomAuthChange);
      window.removeEventListener('auth:state-changed', handleCustomAuthChange);
      window.removeEventListener('filemarket:auth-change', handleCustomAuthChange);
    };
  }, []);

  const [passwordResetOobCode, setPasswordResetOobCode] = useState<string | null>(null);

  // Auth Modal & Checkout Security Guard State
  const [authModalInitialView, setAuthModalInitialView] = useState<'login' | 'signup' | 'forgot' | 'verify'>('login');
  const [authModalBlockedMessage, setAuthModalBlockedMessage] = useState<string | null>(null);
  const [pendingCheckoutProduct, setPendingCheckoutProduct] = useState<Product | null>(null);

  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [isXmlStudioOpen, setIsXmlStudioOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isUserProfilePageOpen, setIsUserProfilePageOpen] = useState<boolean>(false);
  const [isMyProductsPageOpen, setIsMyProductsPageOpen] = useState<boolean>(false);
  const [isSavedProductsPageOpen, setIsSavedProductsPageOpen] = useState<boolean>(false);
  const [policyModalTab, setPolicyModalTab] = useState<PolicyPageType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Products');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [globalToast, setGlobalToast] = useState<{ message: string; id: number } | null>(null);
  const isHeaderVisible = useScrollDirection();

  const handleBackToHome = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    navigate('/', { title: 'FileMarket — Premium Digital Assets Marketplace in Bangladesh' });
  }, [navigate]);

  const handleCloseModal = useCallback(() => {
    // If the user has history (e.g. opened profile while viewing a product)
    if (window.history.length > 1) {
      window.history.back();
    } else if (detailProduct) {
      navigate(`/product/${getProductSlug(detailProduct)}`);
    } else {
      handleBackToHome();
    }
  }, [detailProduct, navigate, handleBackToHome]);

  // Synchronize route state with active modals and persistent views
  useEffect(() => {
    let isProfile = false;
    let isLocker = false;
    let isCart = false;
    let isSaved = false;
    let isXml = false;
    let policyTab: PolicyPageType | null = null;

    switch (route.name) {
      case 'home':
        setDetailProduct(null);
        setCheckoutProduct(null);
        document.title = 'FileMarket — Premium Digital Assets Marketplace in Bangladesh';
        {
          const searchParam = route.searchParams?.get('search') || route.searchParams?.get('q');
          if (searchParam !== null && searchParam !== undefined) {
            setSearchQuery(searchParam);
          }
        }
        break;

      case 'product':
        if (route.product) {
          setDetailProduct(route.product);
          setCheckoutProduct(null);
          document.title = `${route.product.title} — FileMarket`;
        } else {
          setDetailProduct(products?.[0] || null);
          setCheckoutProduct(null);
        }
        break;

      case 'preview': {
        const slug = route.params?.slug || route.params?.id || '';
        const targetProduct = route.product || (slug ? findProductBySlugOrId(slug, products || []) : null) || detailProduct || products?.[0];
        setDetailProduct(null);
        setCheckoutProduct(null);
        if (targetProduct) {
          document.title = `Watch Preview: ${targetProduct.title} — FileMarket`;
        }
        break;
      }

      case 'checkout': {
        const slug = route.params?.slug || route.params?.id || '';
        const targetProduct = route.product || (slug ? findProductBySlugOrId(slug, products || []) : null) || products?.[0];
        
        const authStatus = getAuthStatus();
        const isUserAuthed = authStatus.isLoggedIn || Boolean(auth.currentUser);

        if (!isUserAuthed) {
          const checkoutUrl = targetProduct ? `/checkout/${getProductSlug(targetProduct)}` : (route.path || '/checkout');
          sessionStorage.setItem('auth_redirect_url', checkoutUrl);
          if (targetProduct) {
            setPendingCheckoutProduct(targetProduct);
          }
          setAuthModalBlockedMessage('⚠️ Please sign in or create an account to complete checkout!');
          setCheckoutProduct(null);
          setDetailProduct(null);
          navigate('/login', {
            replace: true,
            state: { from: checkoutUrl, product: targetProduct, message: '⚠️ Please sign in or create an account to complete checkout!' },
          });
          break;
        }

        setCheckoutProduct(targetProduct || null);
        setDetailProduct(null);
        if (targetProduct) {
          document.title = `Checkout: ${targetProduct.title} — FileMarket`;
        }
        break;
      }

      case 'profile':
        isProfile = true;
        document.title = 'User Profile & Dashboard — FileMarket';
        break;

      case 'auth':
        setAuthModalInitialView(route.path === '/signup' ? 'signup' : 'login');
        document.title = route.path === '/signup' ? 'Create Free Account — FileMarket' : 'Sign In — FileMarket';
        break;

      case 'reset-password':
        setDetailProduct(null);
        setCheckoutProduct(null);
        document.title = 'Reset Password — FileMarket Security';
        break;

      case 'locker':
        isLocker = true;
        document.title = 'Digital Locker & Downloads — FileMarket';
        break;

      case 'cart':
        isCart = true;
        document.title = 'Cart & Navigation — FileMarket';
        break;

      case 'wishlist':
        isSaved = true;
        document.title = 'Your Wishlist — FileMarket';
        break;

      case 'xml-studio':
        isXml = true;
        document.title = 'Blogger XML Studio & Theme Exporter — FileMarket';
        break;

      case 'policy':
        policyTab = (route.params?.tab as PolicyPageType) || 'privacy';
        document.title = 'Legal & Policies — FileMarket';
        break;

      case 'admin':
        setDetailProduct(null);
        setCheckoutProduct(null);
        document.title = 'FileMarket Admin Panel — Digital Marketplace Control';
        break;
    }

    setIsUserProfilePageOpen(isProfile);
    setIsMyProductsPageOpen(isLocker);
    setIsDrawerOpen(isCart);
    setIsSavedProductsPageOpen(isSaved);
    setIsXmlStudioOpen(isXml);
    setPolicyModalTab(policyTab);

    // Reset scroll on route change
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [route, products, navigate]);

  // Category counts calculation
  const productsCounts = useMemo(() => {
    const list = Array.isArray(products) 
      ? products.filter(p => p && p.status !== 'draft' && p.status !== 'hidden') 
      : [];
    const counts: Record<string, number> = {
      'All Products': list.length,
    };
    CATEGORIES.forEach((cat) => {
      if (cat !== 'All Products') {
        counts[cat] = list.filter((p) => p?.category === cat).length;
      }
    });
    list.forEach((p) => {
      if (p?.category && counts[p.category] === undefined) {
        counts[p.category] = list.filter((item) => item?.category === p.category).length;
      }
    });
    return counts;
  }, [products]);

  // Filtered products based on category and search query
  const filteredProducts = useMemo(() => {
    const list = Array.isArray(products) 
      ? products.filter(p => p && p.status !== 'draft' && p.status !== 'hidden') 
      : [];
    return list.filter((product) => {
      if (!product) return false;
      const matchesCategory =
        selectedCategory === 'All Products' || product.category === selectedCategory;
      const lowerQuery = (searchQuery || '').toLowerCase().trim();
      if (!lowerQuery) return matchesCategory;

      const matchesSearch =
        (product.title && product.title.toLowerCase().includes(lowerQuery)) ||
        (product.description && product.description.toLowerCase().includes(lowerQuery)) ||
        (product.category && product.category.toLowerCase().includes(lowerQuery)) ||
        (Array.isArray(product.tags) && product.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(lowerQuery))) ||
        (Array.isArray(product.keywords) && product.keywords.some(k => typeof k === 'string' && k.toLowerCase().includes(lowerQuery))) ||
        (typeof product.seoKeywords === 'string' && product.seoKeywords.toLowerCase().includes(lowerQuery)) ||
        (Array.isArray(product.seoKeywords) && product.seoKeywords.some(s => typeof s === 'string' && s.toLowerCase().includes(lowerQuery)));
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleScrollToProducts = useCallback(() => {
    const el = document.getElementById('products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Route-Aware Navigation Handlers
  const handleOpenProductDetail = useCallback((p: Product) => {
    if (!p) return;
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    navigate(`/product/${getProductSlug(p)}`, { title: `${p.title} — FileMarket` });
  }, [navigate]);

  const handleOpenCheckout = useCallback((p: Product) => {
    if (!p) return;
    const authStatus = getAuthStatus();
    const isUserAuthed = authStatus.isLoggedIn || Boolean(auth.currentUser);

    if (!isUserAuthed) {
      const checkoutUrl = `/checkout/${getProductSlug(p)}`;
      sessionStorage.setItem('auth_redirect_url', checkoutUrl);
      setPendingCheckoutProduct(p);
      setAuthModalBlockedMessage('⚠️ Please sign in or create an account to complete checkout!');
      navigate('/login', {
        state: { from: checkoutUrl, product: p, message: '⚠️ Please sign in or create an account to complete checkout!' },
      });
      return;
    }

    setPendingCheckoutProduct(null);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    navigate(`/checkout/${getProductSlug(p)}`, { title: `Checkout: ${p.title} — FileMarket` });
  }, [navigate]);

  if (route.name === 'login' || (route.name === 'auth' && route.path !== '/signup')) {
    return (
      <Suspense fallback={<GlobalLoader />}>
        <LoginPage
          initialView="login"
          checkoutBlockedMessage={authModalBlockedMessage}
          onClose={() => {
            setAuthModalBlockedMessage(null);
            const redirectTarget = sessionStorage.getItem('auth_redirect_url') || (window.history.state && window.history.state.from);
            if (redirectTarget && redirectTarget !== '/login' && redirectTarget !== '/signup') {
              sessionStorage.removeItem('auth_redirect_url');
              navigate(redirectTarget, { replace: true });
            } else if (detailProduct) {
              navigate(`/product/${getProductSlug(detailProduct)}`, { replace: true });
            } else {
              handleBackToHome();
            }
          }}
          onVerificationSuccess={() => {
            setAuthModalBlockedMessage(null);
            const redirectTarget = sessionStorage.getItem('auth_redirect_url') || (window.history.state && window.history.state.from);
            if (pendingCheckoutProduct) {
              const p = pendingCheckoutProduct;
              setPendingCheckoutProduct(null);
              sessionStorage.removeItem('auth_redirect_url');
              navigate(`/checkout/${getProductSlug(p)}`, { title: `Checkout ${p.title} — FileMarket`, replace: true });
            } else if (redirectTarget && redirectTarget !== '/login' && redirectTarget !== '/signup') {
              sessionStorage.removeItem('auth_redirect_url');
              navigate(redirectTarget, { replace: true });
            } else if (detailProduct) {
              navigate(`/product/${getProductSlug(detailProduct)}`, { replace: true });
            } else {
              handleBackToHome();
            }
          }}
        />
      </Suspense>
    );
  }

  if (route.name === 'signup' || (route.name === 'auth' && route.path === '/signup')) {
    return (
      <Suspense fallback={<GlobalLoader />}>
        <SignUpPage
          checkoutBlockedMessage={authModalBlockedMessage}
          onClose={() => {
            setAuthModalBlockedMessage(null);
            const redirectTarget = sessionStorage.getItem('auth_redirect_url') || (window.history.state && window.history.state.from);
            if (redirectTarget && redirectTarget !== '/login' && redirectTarget !== '/signup') {
              sessionStorage.removeItem('auth_redirect_url');
              navigate(redirectTarget, { replace: true });
            } else if (detailProduct) {
              navigate(`/product/${getProductSlug(detailProduct)}`, { replace: true });
            } else {
              handleBackToHome();
            }
          }}
          onVerificationSuccess={() => {
            setAuthModalBlockedMessage(null);
            const redirectTarget = sessionStorage.getItem('auth_redirect_url') || (window.history.state && window.history.state.from);
            if (pendingCheckoutProduct) {
              const p = pendingCheckoutProduct;
              setPendingCheckoutProduct(null);
              sessionStorage.removeItem('auth_redirect_url');
              navigate(`/checkout/${getProductSlug(p)}`, { title: `Checkout ${p.title} — FileMarket`, replace: true });
            } else if (redirectTarget && redirectTarget !== '/login' && redirectTarget !== '/signup') {
              sessionStorage.removeItem('auth_redirect_url');
              navigate(redirectTarget, { replace: true });
            } else if (detailProduct) {
              navigate(`/product/${getProductSlug(detailProduct)}`, { replace: true });
            } else {
              handleBackToHome();
            }
          }}
        />
      </Suspense>
    );
  }

  if (route.name === 'reset-password') {
    return (
      <ResetPasswordPage
        key="reset-password-page"
        oobCode={route.params.oobCode || passwordResetOobCode}
        onNavigateHome={handleBackToHome}
        onOpenLogin={(view) => {
          if (view === 'signup') {
            navigate('/signup');
          } else {
            navigate('/login');
          }
        }}
      />
    );
  }

  return (
    <Suspense fallback={<GlobalLoader />}>
      {/* Initial App Boot Preloader */}
      {isInitialLoading && <GlobalLoader fadeOut={isFadingOutPreloader} />}

      <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-300 antialiased w-full max-w-[100vw] overflow-x-hidden">
        {route.name === 'admin' ? (
          <AdminPanel
            initialTab={(route.params.tab as any) || 'dashboard'}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            onOpenLogin={() => navigate('/login')}
          />
        ) : isMaintenanceMode ? (
          <MaintenanceScreen
            globalConfig={globalConfig}
            darkMode={darkMode}
            onToggleTheme={toggleTheme}
            onNavigateAdmin={() => navigate('/admin')}
          />
        ) : checkoutProduct ? (
          <ProtectedRoute>
            <CheckoutPage
              product={checkoutProduct}
              currency={currency}
              onBack={() => {
                if (checkoutProduct) {
                  handleOpenProductDetail(checkoutProduct);
                } else {
                  handleBackToHome();
                }
              }}
              onExploreStore={() => {
                handleBackToHome();
                setSelectedCategory('All Products');
                handleScrollToProducts();
              }}
              onOpenXmlStudio={() => navigate('/studio')}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              setCurrency={setCurrency}
              onOpenProfile={() => navigate('/profile')}
              onOpenDrawer={() => setIsDrawerOpen(true)}
              onOpenSearch={() => setIsSearchOpen(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isHeaderVisible={isHeaderVisible}
              onOpenAuthModal={(view, msg) => {
                const currentPath = window.location.pathname + window.location.search;
                if (currentPath && currentPath !== '/login' && currentPath !== '/signup') {
                  sessionStorage.setItem('auth_redirect_url', currentPath);
                }
                setAuthModalInitialView(view || 'login');
                setAuthModalBlockedMessage(msg || null);
                navigate(view === 'signup' ? '/signup' : '/login', {
                  state: { from: currentPath, message: msg || null }
                });
              }}
            />
          </ProtectedRoute>
        ) : (
        <>
          {/* Smart Animated Sticky Header */}
          <div
            className={`sticky top-0 z-40 w-full transition-transform duration-300 ease-in-out will-change-transform ${
              isHeaderVisible ? 'translate-y-0 shadow-md pointer-events-auto' : '-translate-y-full shadow-none pointer-events-none'
            }`}
          >
            <Header
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              currency={currency}
              setCurrency={setCurrency}
              onOpenXmlStudio={() => navigate('/studio')}
              onOpenProfile={() => navigate('/profile')}
              onOpenDrawer={() => setIsDrawerOpen(true)}
              onOpenSearch={() => setIsSearchOpen(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>

          {/* Main Content Area */}
          <main id="products-section" className="flex-1 max-w-[1750px] mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-8 w-full">
            <AnimatePresence mode="wait">
              {route.name === 'preview' ? (
                <motion.div
                  key={`preview-page-${route.params?.slug || 'view'}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  <WatchPreviewPage
                    product={route.product || (route.params?.slug ? findProductBySlugOrId(route.params.slug, products || []) : null) || detailProduct || products?.[0] || null}
                    currency={currency}
                    onBack={() => {
                      const p = route.product || (route.params?.slug ? findProductBySlugOrId(route.params.slug, products || []) : null) || detailProduct;
                      if (p) {
                        handleOpenProductDetail(p);
                      } else {
                        handleBackToHome();
                      }
                    }}
                    onInstantBuy={handleOpenCheckout}
                    savedProducts={savedProducts}
                    onToggleSave={handleToggleSave}
                  />
                </motion.div>
              ) : route.name === 'policy' ? (
                <div className="w-full">
                  <AnimatePresence mode="wait">
                    {(route.params.tab === 'privacy' || !route.params.tab) && (
                      <PrivacyPolicyPage key="privacy-page" />
                    )}
                    {route.params.tab === 'refund' && (
                      <RefundPolicyPage key="refund-page" />
                    )}
                    {route.params.tab === 'terms' && (
                      <TermsOfServicePage key="terms-page" />
                    )}
                    {route.params.tab === 'contact' && (
                      <AboutContactPage key="contact-page" />
                    )}
                  </AnimatePresence>
                </div>
              ) : route.name === 'custom-page' ? (
                <CustomPageView slug={route.params.slug} />
              ) : detailProduct ? (
                <motion.div
                  key={`product-detail-${detailProduct.id}`}
                  initial={{ opacity: 0, scale: 0.96, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: 10 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="w-full"
                >
                  <ProductDetailModal
                    product={detailProduct}
                    currency={currency}
                    onBack={handleBackToHome}
                    onInstantBuy={handleOpenCheckout}
                    onSelectProduct={handleOpenProductDetail}
                    isCheckoutOpen={false}
                    savedProducts={savedProducts}
                    onToggleSave={handleToggleSave}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="home-main-view"
                  initial={{ opacity: 0, scale: 1.01 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -10 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="w-full space-y-2 sm:space-y-3"
                >
                  {/* 16:9 Auto-Scrolling Featured Products Hero Slider */}
                  {!searchQuery && (
                    <HeroSlider
                      currency={currency}
                      onSelectCategory={(cat) => setSelectedCategory(cat)}
                    />
                  )}

                  {/* 9 Product Categories Filter Bar (Tightly integrated right below Hero) */}
                  <div className="pt-0 pb-1 sm:pb-2">
                    <CategoryFilter
                      selectedCategory={selectedCategory}
                      onSelectCategory={(cat) => setSelectedCategory(cat)}
                      productsCounts={productsCounts}
                    />
                  </div>


                  <ProductGrid
                    products={filteredProducts}
                    currency={currency}
                    selectedCategory={selectedCategory}
                    searchQuery={searchQuery}
                    onInstantBuy={handleOpenCheckout}
                    onViewDetails={handleOpenProductDetail}
                    savedProducts={savedProducts}
                    onToggleSave={handleToggleSave}
                    isLoading={isProductsLoading || (products.length === 0 && isInitialLoading)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Footer */}
          <Footer
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              handleScrollToProducts();
            }}
            onOpenXmlStudio={() => navigate('/studio')}
            onOpenPolicy={(tab) => navigate(`/policy/${tab}`)}
          />
        </>
      )}

      {/* Slide-Out Navigation Drawer */}
      <SlideDrawer
        isOpen={isDrawerOpen}
        user={currentUser}
        onClose={() => {
          setIsDrawerOpen(false);
          if (route.name === 'cart') {
            handleCloseModal();
          }
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currency={currency}
        setCurrency={setCurrency}
        onOpenProfilePage={() => navigate('/profile')}
        onOpenMyProductsPage={() => navigate('/locker')}
        onOpenSavedProducts={() => navigate('/wishlist')}
        onOpenLogin={() => {
          setIsDrawerOpen(false);
          navigate('/login');
        }}
      />

      {/* Universal Slide-Out Cart & Checkout Drawer */}
      <CartDrawer currency={currency} />

      {/* Dedicated User Profile Page Modal Overlay */}
      <UserProfilePage
        isOpen={isUserProfilePageOpen}
        onClose={handleCloseModal}
        currency={currency}
        setCurrency={setCurrency}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenVerificationModal={() => {
          setIsUserProfilePageOpen(false);
          navigate('/profile');
        }}
      />

      {/* Dedicated My Products / Downloads Page Modal Overlay */}
      <MyProductsPage
        isOpen={isMyProductsPageOpen}
        onClose={handleCloseModal}
        currency={currency}
        onExploreStore={() => {
          handleBackToHome();
          setSelectedCategory('All Products');
          handleScrollToProducts();
        }}
      />

      {/* Dedicated Saved Products / Wishlist Page Modal */}
      <SavedProductsPage
        isOpen={isSavedProductsPageOpen}
        onClose={handleCloseModal}
        currency={currency}
        onExploreStore={() => {
          handleBackToHome();
          setSelectedCategory('All Products');
          handleScrollToProducts();
        }}
        savedProductIds={savedProducts}
        onToggleSave={handleToggleSave}
        onInstantBuy={handleOpenCheckout}
        onViewDetails={handleOpenProductDetail}
      />

      {/* Smart AI-Powered Search Overlay Modal */}
      <SmartSearchOverlayModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={handleOpenProductDetail}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          handleScrollToProducts();
        }}
      />

      {/* User Profile & Account Settings Modal (Backup) */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currency={currency}
        setCurrency={setCurrency}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Full Blogger XML Code Studio & Export Modal */}
      <BloggerXmlStudioModal
        isOpen={isXmlStudioOpen}
        onClose={handleCloseModal}
      />

      {/* Password Reset In-App Flow */}
      {passwordResetOobCode && (
        <PasswordResetModal
          oobCode={passwordResetOobCode}
          onClose={() => setPasswordResetOobCode(null)}
          onOpenLogin={(view) => {
            setPasswordResetOobCode(null);
            navigate(view === 'signup' ? '/signup' : '/login');
          }}
        />
      )}

      {/* Global Toast Notification */}
      {globalToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999999] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white text-sm font-bold shadow-2xl backdrop-blur-xl">
            {globalToast.message}
          </div>
        </div>
      )}
    </div>
    </Suspense>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <BrandProvider>
        <GlobalSettingsProvider>
          <ProductProvider>
            <AuthProvider>
              <CartProvider>
                <MainApp />
              </CartProvider>
            </AuthProvider>
          </ProductProvider>
        </GlobalSettingsProvider>
      </BrandProvider>
    </ConfigProvider>
  );
}
