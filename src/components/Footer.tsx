import React, { useState } from 'react';
import { Download, Phone, MapPin, MessageCircle, ShieldCheck, X, ZoomIn } from 'lucide-react';
import { CATEGORIES } from '../data/products';
import { BkashLogo } from './icons/BkashLogo';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import AnimatedBrandTitle from './AnimatedBrandTitle';
import { useBrand } from '../context/BrandContext';
import { handleDirectWhatsAppChat, getGeneralWhatsAppUrl } from '../utils/whatsapp';
import { formatDirectImageUrl } from '../utils/formatImageUrl';

interface FooterProps {
  onSelectCategory: (cat: string) => void;
  onOpenXmlStudio: () => void;
  onOpenPolicy?: (policyTab: 'privacy' | 'refund' | 'terms' | 'contact') => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectCategory, onOpenXmlStudio, onOpenPolicy }) => {
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const { globalConfig, generalConfig, supportLinks } = useGlobalSettings();
  const { siteName, tagline } = globalConfig.branding as any;
  const siteDescription = generalConfig?.siteDescription;
  const physicalAddress = generalConfig?.physicalAddress;
  const founderWhatsapp = supportLinks?.whatsappNumber || generalConfig?.socialLinks?.whatsapp || globalConfig.branding?.whatsappNumber || '8801673833783';
  const { founderAvatarUrl, founderName, founderBio, founderMessageEn, founderMessageBn, logoUrl, brandName } = useBrand();

  return (
    <footer className="mt-auto bg-[#0B0F19] text-slate-400 border-t border-slate-800/80 transition-colors">
      {/* Attached Founder & Lead Digital Architect Trust Section */}
      <div className="border-b border-slate-800/80 py-10 px-4 sm:px-6 lg:px-8" id="founder-section">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl bg-[#0B0F19] border border-slate-800/80 p-6 sm:p-8 shadow-[0_0_35px_rgba(16,185,129,0.12)] overflow-hidden">
            
            {/* Ambient Glow Decorators */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
              
              {/* Founder Squircle Image Container */}
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
                      src={founderAvatarUrl}
                      alt={`${founderName} - ${founderBio}`}
                      className="w-full h-full object-cover select-none pointer-events-auto [user-select:none] [-webkit-user-select:none] [-webkit-touch-callout:none] transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://i.ibb.co/vzR0h2M/default-avatar.png';
                      }}
                    />
                    <div
                      className="absolute inset-0 z-10 bg-transparent"
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                    />
                    
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white z-20">
                      <ZoomIn className="w-6 h-6 text-emerald-400 drop-shadow" />
                    </div>
                  </div>
                </button>

                <div 
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-white flex items-center gap-1.5 font-bold text-[10px] sm:text-xs shadow-lg shadow-black/40 pointer-events-none z-20 transform-gpu"
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
                    {founderBio} | {siteName}
                  </p>
                  {tagline && (
                    <p className="text-xs text-slate-400 italic">
                      "{tagline}"
                    </p>
                  )}
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
        </div>
      </div>

      {/* Lightbox / Full Photo Modal */}
      {isPhotoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
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
              className="absolute top-4 right-4 z-30 p-2 rounded-full bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.3)] bg-slate-950 flex items-center justify-center">
                <img
                  src={founderAvatarUrl}
                  alt={`${founderName} - Full Resolution Official Photo`}
                  className="w-full max-h-[70vh] object-contain select-none pointer-events-auto [user-select:none] [-webkit-user-select:none] [-webkit-touch-callout:none]"
                  referrerPolicy="no-referrer"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://i.ibb.co/vzR0h2M/default-avatar.png';
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

      {/* Main Footer Links & Directory */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 sm:py-8 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Brand & Address Info */}
        <div className="md:col-span-5 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2.5 group/logo cursor-default select-none">
            {/* Animated Logo Container with Rotating Glow Halo */}
            <div className="relative w-9 h-9 shrink-0 transform-gpu">
              {/* Rotating Subtle Glow Halo */}
              <div 
                className="absolute -inset-1 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 opacity-50 blur-sm group-hover/logo:opacity-90 group-hover/logo:blur-md transition-all duration-500 transform-gpu pointer-events-none"
                style={{ animation: 'logoHaloSpin 10s linear infinite' }}
              />
              
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center text-white shadow-md border border-slate-700/50 group-hover/logo:border-emerald-400/80 transition-transform duration-500 ease-out transform-gpu group-hover/logo:scale-110 active:scale-95">
                <img
                  src={formatDirectImageUrl(logoUrl) || "https://lh3.googleusercontent.com/d/1KkNKkG7Y06W8a_d8Efc7PBMiiQkzxG10"}
                  alt={`${brandName || siteName || 'FileMarket'} Logo`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/logo:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <span className="font-heading text-xl font-extrabold text-white transition-colors">
              <AnimatedBrandTitle text={siteName || 'FileMarket'} className="group-hover/logo:brightness-110" />
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
            {siteDescription || "Bangladesh's premier digital marketplace for video bundles, online courses, software, AI prompts, and Blogger templates with instant bKash & Nagad verification."}
          </p>

          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex items-start gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Address:</strong> {physicalAddress || 'Bangladesh Chittagong bayzid 4214'}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <img
                src="https://lh3.googleusercontent.com/d/1941nw0eU_JIhKT_4QLuglzwuyDieb-jW"
                alt="WhatsApp"
                className="w-4 h-4 object-contain shrink-0"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://drive.google.com/uc?export=view&id=1941nw0eU_JIhKT_4QLuglzwuyDieb-jW';
                }}
              />
              <span><strong>Founder WhatsApp:</strong> <a href={getGeneralWhatsAppUrl(founderWhatsapp || '8801673833783')} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors cursor-pointer">+{founderWhatsapp || '8801673833783'}</a></span>
            </div>
          </div>
        </div>

        {/* Categories Directory */}
        <div className="md:col-span-3 space-y-2.5 sm:space-y-3">
          <h4 className="font-heading text-xs font-bold text-white uppercase tracking-wider">
            Product Categories
          </h4>
          <ul className="text-xs space-y-1.5 sm:space-y-2">
            {(globalConfig.categories?.length > 0 ? globalConfig.categories.map(c => c.name) : CATEGORIES).filter((c) => c !== 'All Products').slice(0, 6).map((cat) => (
              <li key={cat}>
                <button
                  onClick={() => onSelectCategory(cat)}
                  className="hover:text-emerald-400 transition text-left"
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Payments & Architecture */}
        <div className="md:col-span-4 space-y-2.5 sm:space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-heading text-xs font-bold text-slate-200 uppercase tracking-wider">
              Payments &amp; Security
            </h4>
          </div>
          
          <p className="text-xs text-slate-400 leading-relaxed">
            Instant automated verification with official payment gateway channels.
          </p>

          {/* Ultra-Modern Glassmorphism Payment Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            
            {/* bKash Pill */}
            <div className="group/pay inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/70 hover:bg-slate-900 backdrop-blur-md border border-pink-500/30 hover:border-pink-500/80 shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_0_16px_rgba(209,32,83,0.35)] transition-all duration-300 hover:-translate-y-0.5 cursor-default">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
                <BkashLogo className="w-full h-full" />
              </div>
              <span className="text-xs font-extrabold text-pink-200 group-hover/pay:text-pink-100 tracking-tight">bKash</span>
            </div>

            {/* Nagad Pill */}
            <div className="group/pay inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/70 hover:bg-slate-900 backdrop-blur-md border border-orange-500/30 hover:border-orange-500/80 shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_0_16px_rgba(247,147,30,0.35)] transition-all duration-300 hover:-translate-y-0.5 cursor-default">
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 shadow-sm shrink-0">
                <img
                  src="https://lh3.googleusercontent.com/d/1B-mR6Tc-KaZGWejKJap3gjN_YrPKPfYm"
                  alt="Nagad"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://drive.google.com/uc?export=view&id=1B-mR6Tc-KaZGWejKJap3gjN_YrPKPfYm';
                  }}
                />
              </div>
              <span className="text-xs font-extrabold text-orange-200 group-hover/pay:text-orange-100 tracking-tight">Nagad</span>
            </div>

            {/* Binance Pay Pill */}
            <div className="group/pay inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/70 hover:bg-slate-900 backdrop-blur-md border border-amber-400/30 hover:border-amber-400/80 shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_0_16px_rgba(240,185,11,0.35)] transition-all duration-300 hover:-translate-y-0.5 cursor-default">
              <div className="w-5 h-5 rounded-full bg-[#181A20] flex items-center justify-center p-0.5 shadow-sm shrink-0">
                <img
                  src="https://lh3.googleusercontent.com/d/1oriM4R9YRo9TSb6btdS3v4gRioeTCBL7"
                  alt="Binance Pay"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://drive.google.com/uc?export=view&id=1oriM4R9YRo9TSb6btdS3v4gRioeTCBL7';
                  }}
                />
              </div>
              <span className="text-xs font-extrabold text-amber-200 group-hover/pay:text-amber-100 tracking-tight">Binance Pay</span>
            </div>

            {/* Visa / Mastercard Pill */}
            <div className="group/pay inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/70 hover:bg-slate-900 backdrop-blur-md border border-blue-400/30 hover:border-blue-400/80 shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_0_16px_rgba(59,130,246,0.35)] transition-all duration-300 hover:-translate-y-0.5 cursor-default">
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center p-0.5 shadow-sm shrink-0">
                <img
                  src="https://lh3.googleusercontent.com/d/15OVBEzt-TQWA-iX1CqZ_wK2laaLazWGW"
                  alt="Visa / Mastercard"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://drive.google.com/uc?export=view&id=15OVBEzt-TQWA-iX1CqZ_wK2laaLazWGW';
                  }}
                />
              </div>
              <span className="text-xs font-extrabold text-blue-200 group-hover/pay:text-blue-100 tracking-tight">Visa / Mastercard</span>
            </div>

          </div>
        </div>

      </div>

      {/* START: Refined Clean Footer Bottom */}
      <div className="mt-2 pt-3 border-t border-slate-800/80 flex flex-col items-center justify-center text-center w-full max-w-5xl mx-auto px-4 pb-6 sm:pb-8">
        
        {/* Interactive Policy Links (Ultra-Compact Single Horizontal Row Matching Payment Gateways) */}
        <div className="flex items-center justify-start md:justify-center gap-1.5 w-full overflow-x-auto no-scrollbar py-1 px-1 flex-nowrap my-1">
          <button 
            type="button" 
            onClick={() => onOpenPolicy?.('privacy')} 
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-700/60 bg-[#0d1527] text-[10.5px] font-medium text-slate-300 shadow-sm flex-shrink-0 whitespace-nowrap hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all cursor-pointer active:scale-95"
          >
            <span className="text-[11px]">🔒</span>
            <span>Privacy Policy</span>
          </button>
          
          <button 
            type="button" 
            onClick={() => onOpenPolicy?.('refund')} 
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-700/60 bg-[#0d1527] text-[10.5px] font-medium text-slate-300 shadow-sm flex-shrink-0 whitespace-nowrap hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all cursor-pointer active:scale-95"
          >
            <span className="text-[11px]">🛡️</span>
            <span>100% Refund</span>
          </button>
          
          <button 
            type="button" 
            onClick={() => onOpenPolicy?.('terms')} 
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-700/60 bg-[#0d1527] text-[10.5px] font-medium text-slate-300 shadow-sm flex-shrink-0 whitespace-nowrap hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all cursor-pointer active:scale-95"
          >
            <span className="text-[11px]">📜</span>
            <span>Terms of Service</span>
          </button>
          
          <button 
            type="button" 
            onClick={() => onOpenPolicy?.('contact')} 
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-700/60 bg-[#0d1527] text-[10.5px] font-medium text-slate-300 shadow-sm flex-shrink-0 whitespace-nowrap hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all cursor-pointer active:scale-95"
          >
            <span className="text-[11px]">📞</span>
            <span>About &amp; Contact</span>
          </button>
        </div>

        {/* Modern Gradient Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent my-2.5 sm:my-3" />

        {/* Premium Copyright & Tagline */}
        <div className="flex flex-col items-center justify-center space-y-1 sm:space-y-1.5">
          <p className="text-xs text-slate-400 font-medium">
            © 2026 <span className="text-slate-200 font-semibold tracking-wide"><span className="font-semibold">{siteName}</span></span> • All Rights Reserved.
          </p>
          <p className="text-[11px] font-medium tracking-wide text-emerald-400/80 max-w-xl leading-relaxed">
            ⚡ Engineered for Ultra-Fast Delivery, Bank-Grade Security &amp; 24/7 Creator Support
          </p>
        </div>

      </div>
      {/* END: Refined Clean Footer Bottom */}

      {/* Ultra-Smooth 60fps Hardware-Accelerated Animations */}
      <style>{`
        @keyframes founderAuraPulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(0.95) rotate(0deg);
            filter: blur(24px);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.05) rotate(180deg);
            filter: blur(32px);
          }
        }
        @keyframes founderBreathe {
          0%, 100% {
            transform: translateY(0px) scale(1);
            box-shadow: 0 10px 30px -10px rgba(16, 185, 129, 0.4);
          }
          50% {
            transform: translateY(-4px) scale(1.02);
            box-shadow: 0 20px 40px -10px rgba(16, 185, 129, 0.6);
          }
        }
        @keyframes verifiedPulse {
          0%, 100% {
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4), 0 0 10px rgba(16, 185, 129, 0.2);
            border-color: rgba(51, 65, 85, 0.8);
          }
          50% {
            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.5);
            border-color: rgba(16, 185, 129, 0.5);
          }
        }
        @keyframes logoHaloSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </footer>
  );
};
