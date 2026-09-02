import React, { useState } from 'react';
import { ShieldCheck, MessageCircle, X, ZoomIn } from 'lucide-react';
import { useBrand, DEFAULT_FOUNDER_AVATAR } from '../context/BrandContext';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { handleDirectWhatsAppChat } from '../utils/whatsapp';

export const FounderSection: React.FC = () => {
  const { founderAvatarUrl, founderName, founderBio, founderMessageEn, founderMessageBn } = useBrand();
  const { globalConfig, generalConfig, supportLinks } = useGlobalSettings();
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const founderWhatsapp = supportLinks?.whatsappNumber || generalConfig?.socialLinks?.whatsapp || globalConfig?.branding?.whatsappNumber || '8801673833783';

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="founder-section">
      <div className="relative rounded-3xl bg-[#0B0F19] border border-slate-800/80 p-6 sm:p-8 shadow-[0_0_35px_rgba(16,185,129,0.12)] overflow-hidden">
        
        {/* Ambient Glow Decorators */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
          
          {/* Founder Squircle Image Container (160px × 160px with Lightbox trigger and Security Shield) */}
          <div className="relative shrink-0 group transform-gpu will-change-transform">
            <div 
              className="absolute -inset-2 rounded-[34px] bg-gradient-to-tr from-emerald-400 via-teal-300 to-cyan-500 opacity-60 blur-2xl group-hover:opacity-90 transition-opacity duration-700 pointer-events-none transform-gpu"
              style={{ animation: 'founderAuraPulse 4s infinite ease-in-out' }}
            />

            <button
              type="button"
              onClick={() => setIsPhotoModalOpen(true)}
              className="relative block w-36 h-36 sm:w-40 sm:h-40 rounded-3xl p-[2px] bg-gradient-to-tr from-emerald-400 via-teal-300 to-cyan-500 shadow-xl group-hover:scale-105 transition-all duration-500 cursor-zoom-in focus:outline-none focus:ring-4 focus:ring-emerald-400/50 transform-gpu overflow-hidden"
              style={{ animation: 'founderBreathe 4s infinite cubic-bezier(0.4, 0, 0.2, 1)' }}
              title="Click to view full high-resolution verified photo"
            >
              <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity duration-500 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              </div>

              <div className="relative w-full h-full rounded-[22px] overflow-hidden bg-slate-900 backface-hidden shadow-[inset_0_4px_10px_rgba(0,0,0,0.4)]">
                <img
                  src={founderAvatarUrl || DEFAULT_FOUNDER_AVATAR}
                  alt={`${founderName} - ${founderBio}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover select-none pointer-events-auto [user-select:none] [-webkit-user-select:none] [-webkit-touch-callout:none] transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_FOUNDER_AVATAR;
                  }}
                />
                {/* Anti-Theft Transparent Layer */}
                <div
                  className="absolute inset-0 z-10 bg-transparent"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                />
                
                {/* Hover Zoom Icon Hint */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white z-20">
                  <ZoomIn className="w-6 h-6 text-emerald-400 drop-shadow" />
                </div>
              </div>
            </button>

            <div 
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-white flex items-center gap-1.5 font-bold text-[10px] sm:text-xs shadow-lg shadow-black/40 pointer-events-none z-20 transform-gpu"
              style={{ animation: 'verifiedPulse 3s infinite ease-in-out' }}
            >
              <span className="text-emerald-400 font-black text-xs">✓</span>
              <span className="tracking-wider uppercase font-black">Verified</span>
            </div>
          </div>

          {/* Founder Details & Bilingual Trust Message */}
          <div className="flex-1 text-center md:text-left space-y-3.5">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {founderName}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/40 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Architect
                </span>
              </div>

              <p className="text-sm font-semibold text-emerald-400">
                {founderBio} | FileMarket.site
              </p>
            </div>

            {/* Bilingual Trust Text (English & Bangla) */}
            <div className="space-y-2 max-w-3xl">
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                &ldquo;{founderMessageEn}&rdquo;
              </p>
              
              <p className="text-xs sm:text-[13px] text-emerald-300/90 leading-relaxed font-sans bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20">
                &ldquo;{founderMessageBn}&rdquo;
              </p>
            </div>

            {/* Direct WhatsApp Action Button */}
            <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                type="button"
                onClick={() => handleDirectWhatsAppChat(founderWhatsapp || '8801673833783')}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-heading font-extrabold text-xs sm:text-sm shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] transition-all transform hover:-translate-y-0.5 cursor-pointer active:scale-95"
              >
                <img
                  src="https://lh3.googleusercontent.com/d/1941nw0eU_JIhKT_4QLuglzwuyDieb-jW"
                  alt="WhatsApp Icon"
                  loading="lazy"
                  decoding="async"
                  className="w-5 h-5 object-contain shrink-0"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://drive.google.com/uc?export=view&id=1941nw0eU_JIhKT_4QLuglzwuyDieb-jW';
                  }}
                />
                <span>Chat Directly with Joy on WhatsApp</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Lightbox / Full Photo Modal */}
      {isPhotoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-fadeIn"
          onClick={() => setIsPhotoModalOpen(false)}
        >
          <div
            className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsPhotoModalOpen(false)}
              className="absolute top-4 right-4 z-30 p-2 rounded-full bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.3)] bg-slate-950 flex items-center justify-center">
                <img
                  src={founderAvatarUrl || DEFAULT_FOUNDER_AVATAR}
                  alt={`${founderName} - Full Resolution Official Photo`}
                  loading="lazy"
                  decoding="async"
                  className="w-full max-h-[70vh] object-contain select-none pointer-events-auto [user-select:none] [-webkit-user-select:none] [-webkit-touch-callout:none]"
                  referrerPolicy="no-referrer"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = DEFAULT_FOUNDER_AVATAR;
                  }}
                />
                {/* Anti-Theft Shield */}
                <div
                  className="absolute inset-0 z-20 bg-transparent"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <div>
                  <h4 className="font-heading text-base font-bold text-white">{founderName}</h4>
                  <p className="text-emerald-400 font-medium">{founderBio}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/40 flex items-center gap-1">
                  ✓ Verified Official
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

