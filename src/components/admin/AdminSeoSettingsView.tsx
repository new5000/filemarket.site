import React from 'react';
import { Globe, Sparkles, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SeoSettingsCard } from './SeoSettingsCard';

interface AdminSeoSettingsViewProps {
  onRefresh?: () => void;
}

export const AdminSeoSettingsView: React.FC<AdminSeoSettingsViewProps> = ({ onRefresh }) => {
  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-500" />
            <span>SEO & Webmaster Verification</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure Google Search Console tokens, OpenGraph tags, and dynamic metadata without touching source code.
          </p>
        </div>
      </div>

      {/* SEO Settings Card */}
      <SeoSettingsCard onSaved={onRefresh} />
    </div>
  );
};
