import React, { useState, useEffect, useMemo } from 'react';
import { ALL_SUPPORTED_LANGUAGES, setGoogleTranslateLanguage, getStoredLanguage, SupportedLanguage } from '../utils/googleTranslate';
import { useGlobalSettings } from '../context/GlobalSettingsContext';

export interface LanguageSelectorProps {
  variant?: 'drawer' | 'modal' | 'compact';
  onLanguageSelect?: (code: string) => void;
}

export function LanguageSelector({ variant = 'drawer', onLanguageSelect }: LanguageSelectorProps) {
  const { language, changeLanguage } = useGlobalSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string>(() => getStoredLanguage() || language || 'en');
  const [searchQuery, setSearchQuery] = useState('');

  // Detect saved translation on mount and listen to changes
  useEffect(() => {
    const syncCurrentLang = () => {
      const match = document.cookie.match(/googtrans=\/en\/([a-zA-Z-]+)/);
      if (match && match[1]) {
        setSelectedLang(match[1]);
      } else {
        const stored = getStoredLanguage();
        if (stored) setSelectedLang(stored);
      }
    };

    syncCurrentLang();

    const handleEvent = (e: any) => {
      if (e?.detail?.language) {
        setSelectedLang(e.detail.language);
      } else {
        syncCurrentLang();
      }
    };

    window.addEventListener('filemarket:language-change', handleEvent);
    window.addEventListener('storage', handleEvent);

    return () => {
      window.removeEventListener('filemarket:language-change', handleEvent);
      window.removeEventListener('storage', handleEvent);
    };
  }, []);

  const activeLanguageObj: SupportedLanguage = useMemo(() => {
    return ALL_SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
    };
  }, [selectedLang]);

  const handleSelectLanguage = (langCode: string) => {
    setSelectedLang(langCode);
    setIsOpen(false);
    setSearchQuery('');

    // Trigger Google Translate engine, persist cookies & localStorage
    setGoogleTranslateLanguage(langCode);
    if (changeLanguage) {
      changeLanguage(langCode as any);
    }
    if (onLanguageSelect) {
      onLanguageSelect(langCode);
    }
  };

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return ALL_SUPPORTED_LANGUAGES;
    const q = searchQuery.toLowerCase().trim();
    return ALL_SUPPORTED_LANGUAGES.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.nativeName.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Website Language</p>
        <span className="text-[9px] font-bold text-emerald-500">Auto Translate</span>
      </div>

      {/* Single Sleek Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex items-center justify-between transition-all active:scale-98 shadow-xs group cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-lg shrink-0">{activeLanguageObj.flag}</span>
          <div className="text-left min-w-0 truncate">
            <span className="text-xs font-black text-slate-900 dark:text-white block leading-tight truncate">
              {activeLanguageObj.nativeName}
            </span>
            <span className="text-[10px] text-slate-400 font-medium truncate block">
              {activeLanguageObj.name}
            </span>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl group-hover:bg-emerald-500 group-hover:text-slate-950 transition shrink-0">
          Change ▾
        </span>
      </button>

      {/* Professional Full Modal for 100+ Languages */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌐</span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Select Language</h3>
                  <p className="text-[10px] text-slate-400">100+ Global Languages supported</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search language (e.g. Arabic, বাংলা, Español)..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-9 pr-8 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                autoFocus
              />
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs pointer-events-none">🔍</span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Languages Grid List */}
            <div className="overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 pr-1 custom-scrollbar max-h-[50vh]">
              {filteredLanguages.length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                  No languages found for "{searchQuery}"
                </div>
              ) : (
                filteredLanguages.map((lang) => {
                  const isSelected = selectedLang === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black shadow-xs'
                          : 'bg-white dark:bg-slate-950/60 border-slate-100 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="text-xl shrink-0">{lang.flag}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate leading-tight">{lang.nativeName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{lang.name}</p>
                      </div>
                      {isSelected && <span className="text-xs text-emerald-500 font-bold shrink-0">✓</span>}
                    </button>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Instant Google Translate Engine</span>
              <span>{filteredLanguages.length} Languages</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
