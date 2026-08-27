export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction?: 'ltr' | 'rtl';
}

declare global {
  interface Window {
    google?: any;
    googleTranslateElementInit?: () => void;
  }
}

export const POPULAR_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', direction: 'rtl' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', direction: 'rtl' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', direction: 'rtl' },
];

export const ALL_SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  // Popular first
  ...POPULAR_LANGUAGES,
  // Additional worldwide languages (100+ total)
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', flag: '🇦🇲' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', flag: '🇪🇸' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', flag: '🇧🇾' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', flag: '🇪🇸' },
  { code: 'ceb', name: 'Cebuano', nativeName: 'Cebuano', flag: '🇵🇭' },
  { code: 'ny', name: 'Chichewa', nativeName: 'Chinyanja', flag: '🇲🇼' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'co', name: 'Corsican', nativeName: 'Corsu', flag: '🇫🇷' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto', flag: '🌐' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪' },
  { code: 'tl', name: 'Filipino / Tagalog', nativeName: 'Tagalog', flag: '🇵🇭' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'fy', name: 'Frisian', nativeName: 'Frysk', flag: '🇳🇱' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', flag: '🇪🇸' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', flag: '🇬🇪' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl ayisyen', flag: '🇭🇹' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', flag: '🇺🇸' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', direction: 'rtl' },
  { code: 'hmn', name: 'Hmong', nativeName: 'Hmoob', flag: '🌐' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', flag: '🇮🇸' },
  { code: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo', flag: '🇳🇬' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪' },
  { code: 'jw', name: 'Javanese', nativeName: 'Basa Jawa', flag: '🇮🇩' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ тілі', flag: '🇰🇿' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', flag: '🇰🇭' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', flag: '🇷🇼' },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî', flag: '🇹🇷' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча', flag: '🇰🇬' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', flag: '🇱🇦' },
  { code: 'la', name: 'Latin', nativeName: 'Latina', flag: '🇻🇦' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', flag: '🇱🇺' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', flag: '🇲🇰' },
  { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy', flag: '🇲🇬' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', flag: '🇲🇹' },
  { code: 'mi', name: 'Maori', nativeName: 'Te Reo Māori', flag: '🇳🇿' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол', flag: '🇲🇳' },
  { code: 'my', name: 'Myanmar (Burmese)', nativeName: 'မြန်မာ', flag: '🇲🇲' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'or', name: 'Odia (Oriya)', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', flag: '🇦🇫', direction: 'rtl' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Sāmoa', flag: '🇼🇸' },
  { code: 'gd', name: 'Scots Gaelic', nativeName: 'Gàidhlig', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸' },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho', flag: '🇱🇸' },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona', flag: '🇿🇼' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', flag: '🇵🇰', direction: 'rtl' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', flag: '🇸🇴' },
  { code: 'su', name: 'Sundanese', nativeName: 'Basa Sunda', flag: '🇮🇩' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ', flag: '🇹🇯' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'tt', name: 'Tatar', nativeName: 'Татар теле', flag: '🇷🇺' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'tk', name: 'Turkmen', nativeName: 'Türkmençe', flag: '🇹🇲' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'ug', name: 'Uyghur', nativeName: 'ئۇيغۇرچە', flag: '🇨🇳', direction: 'rtl' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbekcha', flag: '🇺🇿' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', flag: '🇿🇦' },
  { code: 'yi', name: 'Yiddish', nativeName: 'ייִדיש', flag: '🇮🇱', direction: 'rtl' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Èdè Yorùbá', flag: '🇳🇬' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' }
];

const GOOGTRANS_COOKIE_KEY = 'googtrans';
const STORAGE_LANG_KEY = 'filemarket_language';

export function getStoredLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  
  try {
    // 1. Check googtrans cookie: format is usually "/en/bn" or "/auto/bn"
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + GOOGTRANS_COOKIE_KEY + '=([^;]+)'));
    if (match && match[2]) {
      const parts = decodeURIComponent(match[2]).split('/');
      const targetLang = parts[parts.length - 1];
      if (targetLang && targetLang !== 'null' && targetLang !== 'undefined') {
        return targetLang;
      }
    }

    // 2. Check local storage
    const saved = localStorage.getItem(STORAGE_LANG_KEY) || localStorage.getItem('app_language');
    if (saved) return saved;
  } catch (e) {
    console.warn('Error reading stored language:', e);
  }

  return 'en';
}

export function setGoogleTranslateLanguage(langCode: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const targetCode = langCode.trim();
    const cookieValue = targetCode === 'en' ? '/en/en' : `/en/${targetCode}`;
    
    // 1. Save to LocalStorage
    localStorage.setItem(STORAGE_LANG_KEY, targetCode);
    localStorage.setItem('app_language', targetCode);

    // 2. Set Cookies for all domain levels
    const hostname = window.location.hostname;
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();

    document.cookie = `${GOOGTRANS_COOKIE_KEY}=${cookieValue}; expires=${expires}; path=/;`;
    
    if (hostname && hostname !== 'localhost' && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      document.cookie = `${GOOGTRANS_COOKIE_KEY}=${cookieValue}; expires=${expires}; path=/; domain=${hostname};`;
      const domainParts = hostname.split('.');
      if (domainParts.length > 1) {
        const rootDomain = domainParts.slice(-2).join('.');
        document.cookie = `${GOOGTRANS_COOKIE_KEY}=${cookieValue}; expires=${expires}; path=/; domain=.${rootDomain};`;
      }
    }

    // 3. Update HTML lang and dir attribute
    document.documentElement.lang = targetCode;
    const langObj = ALL_SUPPORTED_LANGUAGES.find(l => l.code === targetCode);
    if (langObj?.direction === 'rtl') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }

    // 4. Try programmatically triggering Google Translate DOM combo select
    const selectElem = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (selectElem) {
      selectElem.value = targetCode;
      selectElem.dispatchEvent(new Event('change', { bubbles: true }));
      selectElem.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // If combo not ready or reset requested, reload to enforce Google Translate engine
      if (window.google?.translate) {
        setTimeout(() => {
          const delayedSelect = document.querySelector<HTMLSelectElement>('.goog-te-combo');
          if (delayedSelect) {
            delayedSelect.value = targetCode;
            delayedSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, 300);
      }
    }

    // 5. Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('filemarket:language-change', { detail: { language: targetCode } }));
    window.dispatchEvent(new Event('storage'));

    return true;
  } catch (err) {
    console.error('Failed to change Google Translate language:', err);
    return false;
  }
}
