import { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';

export type RouteName =
  | 'home'
  | 'profile'
  | 'auth'
  | 'login'
  | 'signup'
  | 'reset-password'
  | 'product'
  | 'preview'
  | 'checkout'
  | 'locker'
  | 'cart'
  | 'wishlist'
  | 'policy'
  | 'custom-page'
  | 'ai-seo'
  | 'xml-studio'
  | 'admin'
  | '404';

export interface RouteState {
  name: RouteName;
  path: string;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  product?: Product;
}

/**
 * Generate a clean, SEO-friendly URL slug from product title or ID
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-word chars
    .replace(/[\s_-]+/g, '-') // swap spaces and underscores for single -
    .replace(/^-+|-+$/g, '') // trim leading/trailing -
    .substring(0, 65); // limit length
}

/**
 * Get the canonical product slug URL (e.g. /product/ultra-4k-cinematic-reel-motion-graphics)
 */
export function getProductSlug(product: Product): string {
  const clean = slugify(product.title);
  return clean ? `${clean}-${product.id}` : product.id;
}

/**
 * Find a product by its URL slug, ID, or title match
 */
export function findProductBySlugOrId(slugOrId: string, products: Product[]): Product | undefined {
  if (!slugOrId) return undefined;
  const decoded = decodeURIComponent(slugOrId).toLowerCase().trim();

  // 1. Direct ID exact match
  const byId = products.find((p) => p.id.toLowerCase() === decoded);
  if (byId) return byId;

  // 2. ID suffix match (e.g. "cinematic-reel-fm-001" ends with "fm-001")
  const bySuffix = products.find((p) => decoded.endsWith(`-${p.id.toLowerCase()}`));
  if (bySuffix) return bySuffix;

  // 3. Exact slug match
  const bySlug = products.find((p) => slugify(p.title) === decoded);
  if (bySlug) return bySlug;

  // 4. Substring / partial match on slug or title
  const byPartial = products.find((p) => {
    const s = slugify(p.title);
    return s.includes(decoded) || decoded.includes(s) || decoded.includes(p.id.toLowerCase());
  });
  if (byPartial) return byPartial;

  return undefined;
}

/**
 * Resolve current pathname + search to a structured RouteState
 */
export function parseRoute(pathname: string, search: string, products: Product[]): RouteState {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const searchParams = new URLSearchParams(search);

  // 1. Home / Storefront
  if (cleanPath === '/' || cleanPath === '/home' || cleanPath === '/store') {
    return { name: 'home', path: cleanPath, params: {}, searchParams };
  }

  // 2. User Profile & Dashboard
  if (cleanPath === '/profile' || cleanPath === '/dashboard' || cleanPath === '/account') {
    return { name: 'profile', path: cleanPath, params: {}, searchParams };
  }

  // 3. Auth / Sign In / Sign Up
  if (cleanPath === '/login' || cleanPath === '/signin') {
    return { name: 'login', path: cleanPath, params: {}, searchParams };
  }
  if (cleanPath === '/signup' || cleanPath === '/register') {
    return { name: 'signup', path: cleanPath, params: {}, searchParams };
  }
  if (cleanPath === '/auth') {
    return { name: 'login', path: cleanPath, params: {}, searchParams };
  }

  // 3.5 Reset Password In-App Handler (/reset-password or ?mode=resetPassword or ?oobCode=...)
  if (
    cleanPath === '/reset-password' ||
    cleanPath === '/reset' ||
    cleanPath === '/password-reset' ||
    searchParams.get('mode') === 'resetPassword' ||
    (searchParams.has('oobCode') && (searchParams.get('mode') === 'resetPassword' || cleanPath.includes('reset') || cleanPath === '/'))
  ) {
    const oobCode = searchParams.get('oobCode') || '';
    return { name: 'reset-password', path: cleanPath, params: { oobCode }, searchParams };
  }

  // 4. Digital Locker / My Products / Downloads / Orders
  if (
    cleanPath === '/locker' ||
    cleanPath === '/orders' ||
    cleanPath === '/downloads' ||
    cleanPath === '/my-products' ||
    cleanPath === '/purchases'
  ) {
    return { name: 'locker', path: cleanPath, params: {}, searchParams };
  }

  // 5. Cart / Slide Drawer
  if (cleanPath === '/cart' || cleanPath === '/drawer' || cleanPath === '/menu') {
    return { name: 'cart', path: cleanPath, params: {}, searchParams };
  }

  // 5.5 Wishlist / Saved Products (/wishlist, /saved, /saved-products, /favorites)
  if (
    cleanPath === '/wishlist' ||
    cleanPath === '/saved' ||
    cleanPath === '/saved-products' ||
    cleanPath === '/favorites'
  ) {
    return { name: 'wishlist', path: cleanPath, params: {}, searchParams };
  }

  // 6. AI SEO Generator
  if (cleanPath === '/ai-seo' || cleanPath === '/seo' || cleanPath === '/generator') {
    return { name: 'ai-seo', path: cleanPath, params: {}, searchParams };
  }

  // 7. XML Studio
  if (cleanPath === '/studio' || cleanPath === '/xml' || cleanPath === '/blogger-xml') {
    return { name: 'xml-studio', path: cleanPath, params: {}, searchParams };
  }

  // 7.5 Admin Panel (/admin, /admin/dashboard, /admin/products, /admin/orders, /admin/users, /admin/settings, /admin-login)
  if (cleanPath === '/admin' || cleanPath.startsWith('/admin/') || cleanPath === '/admin-login' || cleanPath.startsWith('/admin-login/')) {
    const sub = cleanPath.replace('/admin-login', '').replace('/admin', '').replace(/^\//, '') || 'dashboard';
    return { name: 'admin', path: cleanPath, params: { tab: sub }, searchParams };
  }

  // 8. Policy Routes (/privacy-policy, /refund-policy, /terms-of-service, /about-contact, /privacy, /terms, /refund, /about, /policy/:tab)
  if (cleanPath === '/privacy' || cleanPath === '/privacy-policy') {
    return { name: 'policy', path: cleanPath, params: { tab: 'privacy' }, searchParams };
  }
  if (cleanPath === '/terms' || cleanPath === '/terms-of-service' || cleanPath === '/terms-conditions') {
    return { name: 'policy', path: cleanPath, params: { tab: 'terms' }, searchParams };
  }
  if (cleanPath === '/refund' || cleanPath === '/refund-policy' || cleanPath === '/return-policy') {
    return { name: 'policy', path: cleanPath, params: { tab: 'refund' }, searchParams };
  }
  if (cleanPath === '/about' || cleanPath === '/contact' || cleanPath === '/about-contact' || cleanPath === '/about-us' || cleanPath === '/contact-us') {
    return { name: 'policy', path: cleanPath, params: { tab: 'contact' }, searchParams };
  }
  const policyMatch = cleanPath.match(/^\/policy\/([a-zA-Z0-9_-]+)/);
  if (policyMatch) {
    const raw = policyMatch[1].toLowerCase();
    const tab = (raw === 'refund-policy' || raw === 'refund') ? 'refund'
      : (raw === 'privacy-policy' || raw === 'privacy') ? 'privacy'
      : (raw === 'terms-of-service' || raw === 'terms') ? 'terms'
      : (raw === 'about-contact' || raw === 'about' || raw === 'contact') ? 'contact'
      : raw;
    return { name: 'policy', path: cleanPath, params: { tab }, searchParams };
  }

  // 8.1 Custom Pages (/page/:slug)
  const pageMatch = cleanPath.match(/^\/page\/([a-zA-Z0-9_-]+)/);
  if (pageMatch) {
    return { name: 'custom-page', path: cleanPath, params: { slug: pageMatch[1] }, searchParams };
  }

  // 8.5 Watch Preview Dedicated Route (/preview/:slug, /watch-preview/:slug, /watch/:slug, /preview?id=...)
  const previewMatch = cleanPath.match(/^\/(?:preview|watch-preview|watch)(?:\/([a-zA-Z0-9_-]+))?/);
  if (previewMatch) {
    const slug = previewMatch[1] || searchParams.get('product') || searchParams.get('id') || searchParams.get('slug') || '';
    const product = slug ? findProductBySlugOrId(slug, products) : undefined;
    return {
      name: 'preview',
      path: cleanPath,
      params: slug ? { slug } : {},
      searchParams,
      product,
    };
  }

  // 9. Checkout & Payment Gateway (/checkout, /payment, /checkout/:slug, ?product=...)
  const checkoutMatch = cleanPath.match(/^\/(?:checkout|payment|buy)(?:\/([a-zA-Z0-9_-]+))?/);
  if (checkoutMatch) {
    const slug = checkoutMatch[1] || searchParams.get('product') || searchParams.get('id') || '';
    const product = slug ? findProductBySlugOrId(slug, products) : undefined;
    return {
      name: 'checkout',
      path: cleanPath,
      params: slug ? { slug } : {},
      searchParams,
      product,
    };
  }

  // 10. Product Details (/product/:slug, /p/:slug, or Blogger post URL /2026/08/:slug.html)
  const productMatch =
    cleanPath.match(/^\/(?:product|item|p)\/([a-zA-Z0-9_-]+)/) ||
    cleanPath.match(/^\/\d{4}\/\d{2}\/([a-zA-Z0-9_-]+)(?:\.html)?/);

  if (productMatch) {
    const rawSlug = productMatch[1];
    const product = findProductBySlugOrId(rawSlug, products);
    return {
      name: 'product',
      path: cleanPath,
      params: { slug: rawSlug },
      searchParams,
      product,
    };
  }

  // Check if query param has ?product=... or ?p=...
  const productParam = searchParams.get('product') || searchParams.get('p') || searchParams.get('id');
  if (productParam) {
    const product = findProductBySlugOrId(productParam, products);
    if (product) {
      return {
        name: 'product',
        path: cleanPath,
        params: { slug: productParam },
        searchParams,
        product,
      };
    }
  }

  // Default fallback: treat as Home
  return { name: 'home', path: cleanPath, params: {}, searchParams };
}

/**
 * Programmatic Navigation with HTML5 History API
 */
export function navigateTo(path: string, options?: { replace?: boolean; state?: any; title?: string }) {
  if (typeof window === 'undefined') return;

  const currentPath = window.location.pathname + window.location.search;
  if (currentPath === path && !options?.replace) return;

  if (options?.replace) {
    window.history.replaceState(options.state || {}, options.title || '', path);
  } else {
    window.history.pushState(options?.state || {}, options?.title || '', path);
  }

  if (options?.title) {
    document.title = options.title;
  }

  // Dispatch custom popstate event so all listeners immediately update
  window.dispatchEvent(new PopStateEvent('popstate', { state: options?.state }));
}

/**
 * Custom React Hook for SPA Routing & Deep Linking
 */
export function useAppRouter(products: Product[]) {
  const [currentRoute, setCurrentRoute] = useState<RouteState>(() => {
    if (typeof window === 'undefined') {
      return { name: 'home', path: '/', params: {}, searchParams: new URLSearchParams() };
    }
    return parseRoute(window.location.pathname, window.location.search, products);
  });

  // Listen to popstate (browser back/forward & programmatic pushState)
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseRoute(window.location.pathname, window.location.search, products);
      setCurrentRoute(parsed);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  // Global click interceptor for internal links with automatic SPA routing
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const isInternal =
        href &&
        (href.startsWith('/') || href.startsWith(window.location.origin)) &&
        !target.hasAttribute('download') &&
        target.getAttribute('target') !== '_blank' &&
        !href.startsWith('//') &&
        !href.startsWith('mailto:') &&
        !href.startsWith('tel:') &&
        !href.startsWith('javascript:');

      if (isInternal && href) {
        // Parse pathname from href
        let path = href;
        if (href.startsWith(window.location.origin)) {
          path = href.replace(window.location.origin, '');
        }

        // Prevent standard hard page reload
        e.preventDefault();
        navigateTo(path);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const navigate = useCallback((path: string, options?: { replace?: boolean; state?: any; title?: string }) => {
    navigateTo(path, options);
  }, []);

  return {
    route: currentRoute,
    navigate,
    navigateTo,
  };
}
