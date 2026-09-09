import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure aclib is always defined to avoid "aclib is not defined" when third-party ad networks execute
if (typeof window !== 'undefined') {
  // Purge any stale demo/dummy product caches from mobile or previous sessions
  try {
    ['products', 'demo_products', 'mock_products', 'sample_products', 'dummy_products', 'fm_products', 'fm_deleted_product_ids', 'fm_custom_products'].forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
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
