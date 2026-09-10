import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure aclib is always defined to avoid "aclib is not defined" when third-party ad networks execute
if (typeof window !== 'undefined') {
  // Comprehensive purge of stale mock data, test records, and temporary development keys
  try {
    const obsoleteKeys = [
      'products', 'demo_products', 'mock_products', 'sample_products', 
      'dummy_products', 'fm_products', 'fm_deleted_product_ids', 
      'fm_custom_products', 'temp_order', 'mock_user', 'fm_test_data', 
      'test_key', 'fm_cache_version', 'firebase:previous_websocket_failure'
    ];
    obsoleteKeys.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    // Scan for and purge any stray mock / demo / temporary keys without touching real user or admin data
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (/^(mock_|dummy_|temp_dev_|test_item_)/i.test(k) || (k.startsWith('demo_') && !k.startsWith('fm_')))) {
        localStorage.removeItem(k);
      }
    }
  } catch {}

  if (!(window as any).aclib) {
    const queue: any[] = [];
    const stubFn = (...args: any[]) => { queue.push(args); };
    (window as any).aclib = new Proxy({
      runAutoTag: stubFn,
      runPop: stubFn,
      runBanner: stubFn,
      runInPagePush: stubFn,
      init: stubFn,
      _queue: queue
    }, {
      get: (target: any, prop: string) => target[prop] || stubFn
    });
  }

  // Intercept uncaught ad network script errors so they never break the application
  window.addEventListener('error', (event) => {
    if (event?.message && event.message.includes('aclib is not defined')) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Force immediate update check on every page visit to prevent stale code caching
      registration.update().catch(() => {});
    }).catch((err) => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
