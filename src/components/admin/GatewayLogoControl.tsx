import React, { useRef, useState } from 'react';
import { Upload, Link as LinkIcon, RotateCcw, Image as ImageIcon, Check } from 'lucide-react';

interface GatewayLogoControlProps {
  gatewayId: string;
  gatewayName: string;
  customLogo?: string;
  onChangeCustomLogo: (newLogo: string) => void;
  renderDefaultLogo: () => React.ReactNode;
}

export const GatewayLogoControl: React.FC<GatewayLogoControlProps> = ({
  gatewayId,
  gatewayName,
  customLogo = '',
  onChangeCustomLogo,
  renderDefaultLogo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState(customLogo.startsWith('data:') ? '' : customLogo);
  const [imgError, setImgError] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|svg\+xml|webp|jpeg|jpg|gif)/i)) {
      alert('Please upload a valid image file (.png, .svg, .webp, .jpg)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setImgError(false);
        onChangeCustomLogo(base64);
        setUrlDraft('');
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so user can re-upload if needed
    e.target.value = '';
  };

  const handleApplyUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = urlDraft.trim();
    setImgError(false);
    onChangeCustomLogo(cleanUrl);
  };

  const handleResetToDefault = () => {
    setImgError(false);
    setUrlDraft('');
    onChangeCustomLogo('');
  };

  const isCustomActive = Boolean(customLogo && customLogo.trim() !== '');

  return (
    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 space-y-2">
      {/* Top Row: Thumbnail Preview & Actions */}
      <div className="flex items-center justify-between gap-2">
        {/* Current Active Thumbnail (36x36 px) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center p-1 shadow-xs shrink-0 overflow-hidden relative group"
            title={isCustomActive ? `Custom active logo for ${gatewayName}` : `Default brand logo for ${gatewayName}`}
          >
            {isCustomActive && !imgError ? (
              <img
                src={customLogo}
                alt={`${gatewayName} Logo`}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center scale-90">
                {renderDefaultLogo()}
              </div>
            )}
            {isCustomActive && (
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                Logo Icon
              </span>
              {isCustomActive && (
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Custom
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {isCustomActive ? (customLogo.startsWith('data:') ? 'Base64 Uploaded' : 'External Link') : 'Official Default'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* 1. Upload File Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/svg+xml,image/webp,image/jpeg,image/jpg"
            onChange={handleFileUpload}
            className="hidden"
            id={`logo-upload-${gatewayId}`}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition cursor-pointer active:scale-95"
            title="Upload image from computer (.png, .svg, .webp, .jpg)"
          >
            <Upload className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">Upload</span>
          </button>

          {/* 2. Direct URL Toggle Button */}
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer active:scale-95 ${
              showUrlInput
                ? 'bg-indigo-500 text-white border-indigo-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="Enter Direct Image URL"
          >
            <LinkIcon className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">URL</span>
          </button>

          {/* 3. Reset to Default Button */}
          {isCustomActive && (
            <button
              type="button"
              onClick={handleResetToDefault}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-300 transition cursor-pointer active:scale-95"
              title="Reset to brand original official logo"
            >
              <RotateCcw className="w-3 h-3 shrink-0" />
              <span className="hidden sm:inline">Default</span>
            </button>
          )}
        </div>
      </div>

      {/* Direct URL Input Row (Collapsible or visible if opened/configured) */}
      {showUrlInput && (
        <form onSubmit={handleApplyUrl} className="flex items-center gap-1.5 pt-1">
          <div className="relative flex-1">
            <input
              type="url"
              placeholder="Paste logo image link (https://...)"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              className="w-full pl-2 pr-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shrink-0"
          >
            <Check className="w-3 h-3" />
            Apply
          </button>
        </form>
      )}
    </div>
  );
};
