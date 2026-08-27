import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, X, Image as ImageIcon, Video, Loader2 } from 'lucide-react';
import { uploadImageFile, uploadMediaFile } from '../../lib/storageService';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
  folder?: string;
  helpText?: string;
  aspectRatio?: 'square' | 'wide' | 'banner' | 'auto';
  id?: string;
  acceptVideo?: boolean;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = 'https://...',
  folder = 'brand',
  helpText,
  aspectRatio = 'auto',
  id,
  acceptVideo = false
}) => {
  const [mode, setMode] = useState<'url' | 'upload'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      let uploadedUrl = '';
      if (acceptVideo || !file.type.startsWith('image/')) {
        uploadedUrl = await uploadMediaFile(file, folder);
      } else {
        uploadedUrl = await uploadImageFile(file, folder);
      }
      onChange(uploadedUrl);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setUploadError('Failed to upload file. Please try URL or another file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    onChange('');
    setUploadError(null);
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case 'square': return 'w-16 h-16';
      case 'wide': return 'w-28 h-16';
      case 'banner': return 'w-36 h-16';
      default: return 'w-20 h-20';
    }
  };

  const isVideo = value && (value.includes('.mp4') || value.includes('.webm') || value.includes('youtube.com') || value.includes('vimeo.com'));

  return (
    <div className="space-y-2" id={id}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
              mode === 'upload'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            File Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
              mode === 'url'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Direct URL
          </button>
        </div>
      </div>

      <div className="flex gap-3 items-start">
        {/* Preview Thumbnail */}
        {value ? (
          <div className="relative group shrink-0">
            <div className={`${getAspectClass()} rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center p-1`}>
              {isVideo ? (
                <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center text-emerald-500">
                  <Video className="w-6 h-6" />
                </div>
              ) : (
                <img
                  src={value}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              )}
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md hover:bg-rose-600 transition cursor-pointer"
              title="Remove file"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className={`${getAspectClass()} rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 shrink-0 flex items-center justify-center text-slate-400`}>
            {acceptVideo ? <Video className="w-6 h-6 stroke-1 opacity-60" /> : <ImageIcon className="w-6 h-6 stroke-1 opacity-60" />}
          </div>
        )}

        {/* Input Control */}
        <div className="flex-1 space-y-1.5 min-w-0">
          {mode === 'upload' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptVideo ? "image/png,image/jpeg,image/webp,image/svg+xml,image/gif,video/mp4,video/webm" : "image/png,image/jpeg,image/webp,image/svg+xml,image/gif"}
                onChange={handleFileChange}
                className="hidden"
                id={`file-input-${label.replace(/\s+/g, '-').toLowerCase()}`}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer disabled:opacity-60"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-emerald-500" />
                    <span>{value ? 'Replace File' : acceptVideo ? 'Choose Image or Video File' : 'Choose Image File (PNG, JPG, SVG, WEBP)'}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="relative">
              <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          )}

          {uploadError && (
            <p className="text-[11px] text-rose-500 font-semibold">{uploadError}</p>
          )}

          {helpText && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              {helpText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
