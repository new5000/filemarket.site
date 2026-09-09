import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { SeoSettings, DEFAULT_SEO_SETTINGS } from '../types';

/**
 * Extracts raw token if user pasted full <meta ...> tag or extra quotes/whitespace
 * Example inputs supported:
 * - "kgz3onr8A-eDs6B01Y5YiOuqTF3Pw5DXq3kh-PN0BCQ"
 * - '<meta name="google-site-verification" content="kgz3onr8A-eDs6B01Y5YiOuqTF3Pw5DXq3kh-PN0BCQ" />'
 * - "<meta name='google-site-verification' content='kgz3onr8A-eDs6B01Y5YiOuqTF3Pw5DXq3kh-PN0BCQ'>"
 */
export function extractGoogleVerificationToken(rawInput: string): string {
  if (!rawInput) return '';
  const trimmed = rawInput.trim();

  // 1. Check for content="..." or content='...'
  const matchContent = trimmed.match(/content\s*=\s*["']([^"']+)["']/i);
  if (matchContent && matchContent[1]) {
    return matchContent[1].trim();
  }

  // 2. Check for content=value without quotes
  const matchNoQuotes = trimmed.match(/content\s*=\s*([^"'\s>]+)/i);
  if (matchNoQuotes && matchNoQuotes[1]) {
    return matchNoQuotes[1].trim();
  }

  // 3. Strip any accidental leading/trailing HTML tags or quotes
  return trimmed.replace(/^[<"']+|[>"'/]+$/g, '').trim();
}

/**
 * Dynamically creates or updates meta tags in document <head>
 * Non-blocking and safely handles missing elements
 */
export function applySeoSettings(seo: Partial<SeoSettings>): void {
  if (typeof document === 'undefined') return;

  try {
    // 1. Google Site Verification Meta Tag
    const rawToken = seo.googleVerificationToken || '';
    const token = extractGoogleVerificationToken(rawToken);

    let gMeta = document.querySelector('meta[name="google-site-verification"]');
    if (token) {
      if (!gMeta) {
        gMeta = document.createElement('meta');
        gMeta.setAttribute('name', 'google-site-verification');
        document.head.appendChild(gMeta);
      }
      gMeta.setAttribute('content', token);
    } else if (gMeta) {
      // If token cleared, remove existing tag
      gMeta.remove();
    }

    // 2. Dynamic Document Title
    if (seo.metaTitle) {
      document.title = seo.metaTitle;

      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', seo.metaTitle);

      let twitterTitle = document.querySelector('meta[name="twitter:title"]');
      if (!twitterTitle) {
        twitterTitle = document.createElement('meta');
        twitterTitle.setAttribute('name', 'twitter:title');
        document.head.appendChild(twitterTitle);
      }
      twitterTitle.setAttribute('content', seo.metaTitle);
    }

    // 3. Meta Description
    if (seo.metaDescription) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', seo.metaDescription);

      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.setAttribute('content', seo.metaDescription);

      let twDesc = document.querySelector('meta[name="twitter:description"]');
      if (!twDesc) {
        twDesc = document.createElement('meta');
        twDesc.setAttribute('name', 'twitter:description');
        document.head.appendChild(twDesc);
      }
      twDesc.setAttribute('content', seo.metaDescription);
    }

    // 4. Meta Keywords
    if (seo.metaKeywords) {
      let metaKw = document.querySelector('meta[name="keywords"]');
      if (!metaKw) {
        metaKw = document.createElement('meta');
        metaKw.setAttribute('name', 'keywords');
        document.head.appendChild(metaKw);
      }
      metaKw.setAttribute('content', seo.metaKeywords);
    }

    // 5. Canonical Link
    if (seo.canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', seo.canonicalUrl);
    }

    // 6. Robots Tag
    if (seo.robotsIndex !== undefined) {
      let robots = document.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement('meta');
        robots.setAttribute('name', 'robots');
        document.head.appendChild(robots);
      }
      robots.setAttribute('content', seo.robotsIndex ? 'index, follow, max-image-preview:large' : 'noindex, nofollow');
    }

    // 7. Author Tag
    if (seo.author) {
      let author = document.querySelector('meta[name="author"]');
      if (!author) {
        author = document.createElement('meta');
        author.setAttribute('name', 'author');
        document.head.appendChild(author);
      }
      author.setAttribute('content', seo.author);
    }
  } catch (err) {
    console.warn('[SEO] Failed to inject dynamic meta tags:', err);
  }
}

/**
 * Fetch current SEO settings with multi-layer fallback (Firestore -> LocalStorage -> Default)
 */
export async function fetchSeoSettings(): Promise<SeoSettings> {
  try {
    const docRef = doc(db, 'site_settings', 'seo');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as SeoSettings;
      const merged = { ...DEFAULT_SEO_SETTINGS, ...data };
      try {
        localStorage.setItem('fm_seo_settings', JSON.stringify(merged));
      } catch {}
      applySeoSettings(merged);
      return merged;
    }
  } catch (err) {
    console.warn('[SEO] Fetching from Firestore failed, checking cache:', err);
  }

  // Fallback to cache
  try {
    const cached = localStorage.getItem('fm_seo_settings');
    if (cached) {
      const parsed = JSON.parse(cached);
      applySeoSettings(parsed);
      return { ...DEFAULT_SEO_SETTINGS, ...parsed };
    }
  } catch {}

  applySeoSettings(DEFAULT_SEO_SETTINGS);
  return DEFAULT_SEO_SETTINGS;
}

/**
 * Persist SEO Settings to Firestore under site_settings/seo, mirror to cache & apply
 */
export async function saveSeoSettings(settings: Partial<SeoSettings>): Promise<void> {
  const current = await fetchSeoSettings();
  const payload: SeoSettings = {
    ...current,
    ...settings,
    updatedAt: new Date().toISOString()
  };

  // 1. Primary storage in site_settings/seo
  await setDoc(doc(db, 'site_settings', 'seo'), payload, { merge: true });

  // 2. Also mirror to system_settings/seo & update general_config for compatibility
  try {
    await setDoc(doc(db, 'system_settings', 'seo'), payload, { merge: true });
    if (payload.metaTitle || payload.metaDescription) {
      await setDoc(doc(db, 'system_settings', 'general_config'), {
        siteTitle: payload.metaTitle,
        siteDescription: payload.metaDescription,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (e) {
    console.warn('[SEO] Mirroring to system_settings non-critical error:', e);
  }

  // 3. Cache locally for instant 0ms first-load injection
  try {
    localStorage.setItem('fm_seo_settings', JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('fm_seo_updated', { detail: payload }));
  } catch {}

  // 4. Inject dynamically into current page head
  applySeoSettings(payload);
}

/**
 * Real-time subscription to site_settings/seo
 */
export function subscribeSeoSettings(callback: (settings: SeoSettings) => void): () => void {
  try {
    const unsub = onSnapshot(doc(db, 'site_settings', 'seo'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SeoSettings;
        const merged = { ...DEFAULT_SEO_SETTINGS, ...data };
        try {
          localStorage.setItem('fm_seo_settings', JSON.stringify(merged));
        } catch {}
        applySeoSettings(merged);
        callback(merged);
      } else {
        callback(DEFAULT_SEO_SETTINGS);
      }
    }, (err) => {
      console.warn('[SEO] Real-time subscription error, using cached data:', err);
      fetchSeoSettings().then(callback);
    });
    return unsub;
  } catch (err) {
    fetchSeoSettings().then(callback);
    return () => {};
  }
}
