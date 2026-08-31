import React, { useState, useRef } from 'react';
import { 
  Video, 
  Link as LinkIcon, 
  Upload, 
  Trash2, 
  Plus, 
  Play, 
  Loader2, 
  Sparkles, 
  Smartphone, 
  Monitor, 
  Code, 
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { PreviewBlock, AdSizePreset } from '../../types';
import { UniversalVideoPlayer } from '../DynamicPreviewRenderer';
import { uploadMediaFile } from '../../lib/storageService';

interface AdminVideoAdManagerProps {
  previewBlocks: PreviewBlock[];
  onChange: (blocks: PreviewBlock[]) => void;
  enableVideo?: boolean;
  onToggleEnableVideo?: (enabled: boolean) => void;
}

export const AdminVideoAdManager: React.FC<AdminVideoAdManagerProps> = ({
  previewBlocks = [],
  onChange,
  enableVideo = true,
  onToggleEnableVideo,
}) => {
  // Extract video players & ad blocks
  const videoBlocks = previewBlocks.filter(b => b.type === 'player');
  const adBlocks = previewBlocks.filter(b => b.type === 'ad');

  // Active video index state (or default to 0 if exists)
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Mode tracker for each video block ('link' | 'upload')
  const [sourceModes, setSourceModes] = useState<{ [blockId: string]: 'link' | 'upload' }>({});

  const getSourceMode = (blockId: string, url?: string): 'link' | 'upload' => {
    if (sourceModes[blockId]) return sourceModes[blockId];
    if (url && (url.startsWith('data:video') || url.startsWith('blob:') || url.includes('firebasestorage') || url.includes('storage.googleapis'))) {
      return 'upload';
    }
    return 'link';
  };

  const setBlockSourceMode = (blockId: string, mode: 'link' | 'upload') => {
    setSourceModes(prev => ({ ...prev, [blockId]: mode }));
  };

  // Add new video block
  const handleAddVideo = () => {
    const newId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newBlock: PreviewBlock = {
      id: newId,
      type: 'player',
      url: '',
      aspectRatio: '9:16',
      enabled: true,
      title: 'Product Walkthrough',
    };
    onChange([...previewBlocks, newBlock]);
    setBlockSourceMode(newId, 'link');
    if (onToggleEnableVideo) onToggleEnableVideo(true);
  };

  // Add new ad block
  const handleAddAdBlock = () => {
    const newId = `ad_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newBlock: PreviewBlock = {
      id: newId,
      type: 'ad',
      code: '',
      adSizePreset: 'responsive',
      title: 'Sponsored Banner',
      enabled: true,
    };
    onChange([...previewBlocks, newBlock]);
  };

  // Update specific block
  const handleUpdateBlock = (blockId: string, updates: Partial<PreviewBlock>) => {
    const updated = previewBlocks.map(b => (b.id === blockId ? { ...b, ...updates } : b));
    onChange(updated);
  };

  // Remove block
  const handleRemoveBlock = (blockId: string) => {
    const updated = previewBlocks.filter(b => b.id !== blockId);
    onChange(updated);
  };

  // Dedicated Bug-Free Video File Upload Handler
  const handleVideoFileSelected = async (blockId: string, file: File) => {
    if (!file) return;

    // Validate video mime type
    if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|webm|mov|m4v|mkv)$/i)) {
      alert('Please select a valid MP4, WebM, or MOV video file.');
      return;
    }

    setUploadingBlockId(blockId);
    setUploadProgressText('Processing video file...');

    // 1. Instant instant zero-lag local preview
    try {
      const instantLocalUrl = URL.createObjectURL(file);
      handleUpdateBlock(blockId, { url: instantLocalUrl });
    } catch {}

    // 2. Read as permanent Base64 Data URL or Firebase Storage upload
    try {
      setUploadProgressText('Generating permanent video stream...');
      
      // Attempt Firebase Storage or Base64
      let permanentUrl = '';
      if (file.size < 25 * 1024 * 1024) { // < 25MB
        permanentUrl = await uploadMediaFile(file, 'preview_videos');
      } else {
        // Fallback for large files
        permanentUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      if (permanentUrl) {
        handleUpdateBlock(blockId, { url: permanentUrl });
      }
    } catch (err: any) {
      console.error('Video upload error:', err);
      // If upload failed, fallback to FileReader
      try {
        const reader = new FileReader();
        reader.onload = () => {
          handleUpdateBlock(blockId, { url: reader.result as string });
        };
        reader.readAsDataURL(file);
      } catch (innerErr) {
        alert('Could not process video file. Please use a YouTube or Google Drive link.');
      }
    } finally {
      setUploadingBlockId(null);
      setUploadProgressText('');
      if (fileInputRefs.current[blockId]) {
        fileInputRefs.current[blockId]!.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Video Section Header & Control */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Video className="w-5 h-5 text-rose-500" />
                <span>Video Walkthrough &amp; Previews</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                {videoBlocks.length} {videoBlocks.length === 1 ? 'Video' : 'Videos'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Supports YouTube Shorts, Google Drive direct view links, or uploaded MP4 files.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onToggleEnableVideo && (
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={enableVideo}
                  onChange={(e) => onToggleEnableVideo(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 cursor-pointer"
                />
                <span>Show in Modal</span>
              </label>
            )}
            <button
              type="button"
              onClick={handleAddVideo}
              className="px-3.5 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> + Add Video
            </button>
          </div>
        </div>

        {/* Video Player Cards List */}
        {videoBlocks.length === 0 ? (
          <div className="p-6 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No Preview Video Added</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                Add a short demo video, TikTok/Reel clip, or YouTube walkthrough to boost buyer conversion.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddVideo}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Video Player
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {videoBlocks.map((block, vIdx) => {
              const currentMode = getSourceMode(block.id, block.url);
              const isUploading = uploadingBlockId === block.id;
              const hasValidUrl = Boolean(block.url && block.url.trim().length > 0);

              return (
                <div
                  key={block.id}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70 space-y-4 shadow-xs"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-rose-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {vIdx + 1}
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        🎬 Preview Video #{vIdx + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Active Toggle */}
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={block.enabled !== false}
                          onChange={(e) => handleUpdateBlock(block.id, { enabled: e.target.checked })}
                          className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 cursor-pointer"
                        />
                        <span>{block.enabled !== false ? 'Active' : 'Hidden'}</span>
                      </label>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(block.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-lg transition cursor-pointer"
                        title="Remove Video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Segmented Source Selector: Paste Link vs Upload File */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setBlockSourceMode(block.id, 'link')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        currentMode === 'link'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>🔗 Paste Link (Default)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBlockSourceMode(block.id, 'upload')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                        currentMode === 'upload'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>📁 Upload File (MP4)</span>
                    </button>
                  </div>

                  {/* Form Inputs based on Source Mode */}
                  {currentMode === 'link' ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Video Web Link (YouTube, Google Drive, or Direct MP4)
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          value={block.url || ''}
                          onChange={(e) => handleUpdateBlock(block.id, { url: e.target.value })}
                          placeholder="Paste YouTube, Google Drive, or MP4 link (e.g. https://youtu.be/... or https://drive.google.com/file/d/...)"
                          className="w-full pl-3 pr-9 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
                        />
                        {block.url && (
                          <button
                            type="button"
                            onClick={() => handleUpdateBlock(block.id, { url: '' })}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-500 rounded-md"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Supports YouTube Shorts, Google Drive view links, or direct .mp4 URLs</span>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Upload Video from Computer / Phone
                      </label>

                      {/* Hidden File Input */}
                      <input
                        ref={(el) => {
                          fileInputRefs.current[block.id] = el;
                        }}
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime,video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleVideoFileSelected(block.id, file);
                        }}
                        className="hidden"
                      />

                      {/* Drag & Drop / Click Upload Box */}
                      <div
                        onClick={() => fileInputRefs.current[block.id]?.click()}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                          isUploading
                            ? 'border-rose-400 bg-rose-50/40 dark:bg-rose-950/20'
                            : 'border-slate-300 dark:border-slate-700 hover:border-rose-500 bg-white dark:bg-slate-950 hover:bg-rose-50/20'
                        }`}
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2 py-2 text-rose-500">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-xs font-bold">{uploadProgressText || 'Uploading Video...'}</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center">
                              <Upload className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                                Tap to select MP4 video from device
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                MP4, WebM, MOV supported (up to 50MB)
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Aspect Ratio Selector (Pill buttons) */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Player Aspect Ratio
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateBlock(block.id, { aspectRatio: '9:16' })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                          block.aspectRatio === '9:16' || !block.aspectRatio
                            ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-500 text-rose-600 dark:text-rose-400 shadow-xs'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>📱 Vertical (9:16 Reels/Shorts)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateBlock(block.id, { aspectRatio: '16:9' })}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition cursor-pointer ${
                          block.aspectRatio === '16:9'
                            ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-500 text-rose-600 dark:text-rose-400 shadow-xs'
                            : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Monitor className="w-4 h-4" />
                        <span>🖥️ Horizontal (16:9 Widescreen)</span>
                      </button>
                    </div>
                  </div>

                  {/* Live Instant Mini-Player Preview */}
                  {hasValidUrl && (
                    <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <Eye className="w-3.5 h-3.5" /> Live Admin Preview
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {block.aspectRatio === '16:9' ? '16:9 Landscape' : '9:16 Portrait'}
                        </span>
                      </div>
                      <div className="rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800 flex items-center justify-center p-2">
                        <UniversalVideoPlayer
                          videoUrl={block.url || ''}
                          aspectRatio={block.aspectRatio || '9:16'}
                          title="Admin Preview"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
export default AdminVideoAdManager;
