import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Save, 
  CheckCircle2, 
  ExternalLink, 
  Search, 
  Sparkles, 
  Info, 
  KeyRound, 
  FileText, 
  Tags, 
  ShieldCheck, 
  RefreshCw,
  Eye
} from 'lucide-react';
import { 
  SeoSettings, 
  DEFAULT_SEO_SETTINGS 
} from '../../types';
import { 
  fetchSeoSettings, 
  saveSeoSettings, 
  extractGoogleVerificationToken 
} from '../../lib/adminServices';

interface SeoSettingsCardProps {
  onSaved?: () => void;
}

export const SeoSettingsCard: React.FC<SeoSettingsCardProps> = ({ onSaved }) => {
  const [formData, setFormData] = useState<SeoSettings>(DEFAULT_SEO_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [headMetaStatus, setHeadMetaStatus] = useState<string | null>(null);

  // Load current settings
  useEffect(() => {
    let mounted = true;
    fetchSeoSettings().then((data) => {
      if (mounted) {
        setFormData(data);
        setLoading(false);
        checkCurrentDomTag();
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const checkCurrentDomTag = () => {
    if (typeof document !== 'undefined') {
      const tag = document.querySelector('meta[name="google-site-verification"]');
      if (tag) {
        setHeadMetaStatus(tag.getAttribute('content') || 'Active (empty content)');
      } else {
        setHeadMetaStatus(null);
      }
    }
  };

  const parsedToken = extractGoogleVerificationToken(formData.googleVerificationToken);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setErrorMsg(null);

    try {
      await saveSeoSettings(formData);
      setSaving(false);
      setSavedSuccess(true);
      checkCurrentDomTag();
      if (onSaved) onSaved();
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setSaving(false);
      setErrorMsg(err?.message || 'Failed to save SEO settings to database.');
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset SEO & Webmaster settings to FileMarket defaults?')) {
      setFormData({
        ...DEFAULT_SEO_SETTINGS,
        googleVerificationToken: formData.googleVerificationToken // Keep existing token
      });
    }
  };

  if (loading) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center gap-3 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
        <span className="text-xs font-semibold">Loading SEO & Search Console settings...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-heading">
                SEO & Webmaster Settings
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Manage Google Search Console verification tokens, meta titles, descriptions & search snippets dynamically.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
            title="Open Google Search Console in new tab"
          >
            <span>Search Console</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>SEO Settings successfully saved to Firestore & injected into &lt;head&gt;!</span>
          </div>
          <span className="text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider">Live</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Google Search Console Verification */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-500" />
              <span>Google Search Console Verification Token / Meta Tag</span>
            </label>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              Dynamic &lt;head&gt;
            </span>
          </div>

          <div>
            <textarea
              rows={2}
              value={formData.googleVerificationToken}
              onChange={(e) => setFormData({ ...formData, googleVerificationToken: e.target.value })}
              placeholder='Paste verification token (e.g., kgz3onr8A-eDs6B01Y5YiOuqTF3Pw5DXq3kh-PN0BCQ) or full tag <meta name="google-site-verification" content="..." />'
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition shadow-inner"
            />
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              💡 Supports either your raw token string or the entire <code>&lt;meta name="google-site-verification" content="..." /&gt;</code> HTML code from Google Search Console. We automatically extract and sanitize it.
            </p>
          </div>

          {/* Live Parsing Preview & DOM Status */}
          <div className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                <span>Extracted Token for Injection:</span>
              </span>
              {parsedToken ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[11px] break-all">
                  {parsedToken}
                </span>
              ) : (
                <span className="text-slate-400 italic">No token configured yet</span>
              )}
            </div>

            {parsedToken && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1">
                <span className="text-slate-500 text-[10px]">Generated HTML Tag injected in &lt;head&gt;:</span>
                <code className="p-1.5 rounded bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono text-[10.5px] select-all overflow-x-auto block">
                  &lt;meta name="google-site-verification" content="{parsedToken}" /&gt;
                </code>
              </div>
            )}

            <div className="pt-1.5 flex items-center justify-between text-[10.5px] text-slate-500">
              <span>Active Tag in DOM: {headMetaStatus ? <strong className="text-emerald-500">Verified Active</strong> : <span className="text-amber-500">Pending Save</span>}</span>
              <button
                type="button"
                onClick={checkCurrentDomTag}
                className="text-slate-500 hover:text-emerald-500 inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-check DOM</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Default Meta Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>Default Meta Title</span>
            </label>
            <span className={`text-[10.5px] font-mono ${formData.metaTitle.length > 60 ? 'text-amber-500' : 'text-slate-400'}`}>
              {formData.metaTitle.length} / 60-70 chars
            </span>
          </div>
          <input
            type="text"
            value={formData.metaTitle}
            onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
            placeholder="e.g. FileMarket - Digital Marketplace | Premium Scripts & UI Kits"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition"
          />
        </div>

        {/* Section 3: Default Meta Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>Default Meta Description</span>
            </label>
            <span className={`text-[10.5px] font-mono ${formData.metaDescription.length > 160 ? 'text-amber-500' : 'text-slate-400'}`}>
              {formData.metaDescription.length} / 155-160 chars
            </span>
          </div>
          <textarea
            rows={3}
            value={formData.metaDescription}
            onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
            placeholder="Provide a clear, engaging summary of the store for Google search results..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition"
          />
        </div>

        {/* Section 4: Meta Keywords */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Tags className="w-3.5 h-3.5 text-emerald-500" />
            <span>Meta Keywords (Comma separated)</span>
          </label>
          <input
            type="text"
            value={formData.metaKeywords}
            onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
            placeholder="filemarket, source code, digital assets, templates, flutter, scripts"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition"
          />
        </div>

        {/* Section 5: Canonical & Indexing Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Canonical Site URL
            </label>
            <input
              type="url"
              value={formData.canonicalUrl || ''}
              onChange={(e) => setFormData({ ...formData, canonicalUrl: e.target.value })}
              placeholder="https://filemarket.site"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition"
            />
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-emerald-500 transition">
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-xs">Search Engine Indexing</div>
                <div className="text-[10px] text-slate-500">Allow Google & Bing to index site pages</div>
              </div>
              <input
                type="checkbox"
                checked={formData.robotsIndex !== false}
                onChange={(e) => setFormData({ ...formData, robotsIndex: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0 ml-2"
              />
            </label>
          </div>
        </div>

        {/* Live Google Search Snippet Preview */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
            <Search className="w-3 h-3 text-emerald-500" />
            <span>Google Search Preview Simulation</span>
          </div>
          <div className="text-[12px] text-slate-500 dark:text-slate-400 font-mono truncate">
            {formData.canonicalUrl || 'https://filemarket.site'}
          </div>
          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer line-clamp-1">
            {formData.metaTitle || 'FileMarket - Digital Marketplace'}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {formData.metaDescription || 'Download verified digital assets, scripts, source codes, presets and plugins with direct Google Drive delivery.'}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            Reset Defaults
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer flex items-center gap-2"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? 'Saving to Firestore...' : 'Save SEO Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
