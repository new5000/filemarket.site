import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Star, 
  Sparkles, 
  Smartphone, 
  Globe, 
  Code2, 
  CreditCard, 
  ArrowRight,
  ShieldCheck,
  MessageSquareShare,
  Check
} from 'lucide-react';
import { DigitalService } from '../data/services';
import { Currency } from '../types';

interface ServiceCardProps {
  service: DigitalService;
  currency: Currency;
  onOpenDetailsModal?: (service: DigitalService) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  currency,
  onOpenDetailsModal
}) => {
  const [copiedMsg, setCopiedMsg] = useState(false);
  const founderWhatsApp = '8801673833783';

  const getServiceIcon = (iconName: DigitalService['iconName']) => {
    switch (iconName) {
      case 'PlayStore':
        return <Smartphone className="w-6 h-6 text-emerald-400" />;
      case 'Website':
        return <Globe className="w-6 h-6 text-cyan-400" />;
      case 'MobileApp':
        return <Code2 className="w-6 h-6 text-indigo-400" />;
      case 'Gateway':
        return <CreditCard className="w-6 h-6 text-amber-400" />;
      default:
        return <Sparkles className="w-6 h-6 text-emerald-400" />;
    }
  };

  const formattedPrice = currency === 'BDT'
    ? `৳${service.priceStartingBDT.toLocaleString('en-BD')}`
    : `$${service.priceStartingUSD}`;

  const generatedMessage = `🚀 *New Service Inquiry / Order - FileMarket*
━━━━━━━━━━━━━━━━━━━━
📌 *Service:* ${service.title}
💰 *Price:* ৳${service.priceStartingBDT.toLocaleString('en-BD')} BDT (Reg: ৳${(service.priceStartingBDT * 1.5).toLocaleString('en-BD')} BDT)
⚡ *Delivery Time:* ${service.deliveryTime || "24-48 Hours"}
🏷️ *License/Format:* Professional Service

✨ *Included Features:*
${service.features.map(f => `• ${f}`).join('\n')}

🔗 *Service Link:* ${typeof window !== 'undefined' ? window.location.href : 'https://filemarket.com'}
━━━━━━━━━━━━━━━━━━━━
Hello Admin, I want to order/discuss this service. Please let me know the next steps!`;

  const whatsappUrl = `https://wa.me/${founderWhatsApp}?text=${encodeURIComponent(generatedMessage)}`;

  const handleCopyRequirements = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(generatedMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/90 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/15 hover:border-emerald-500/40 dark:hover:border-emerald-500/50 transition-all duration-300 ease-out flex-1">
      
      {/* Top Ambient Glow Banner */}
      <div className="relative p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-br from-slate-50 via-white to-slate-100/50 dark:from-slate-900/90 dark:via-[#111827] dark:to-slate-900/60">
        <div className="flex items-start justify-between gap-3 mb-3">
          
          {/* Service Icon Box */}
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 shadow-md flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
            {getServiceIcon(service.iconName)}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {service.badge && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-heading font-extrabold uppercase tracking-wide bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-xs">
                <Sparkles className="w-3 h-3 fill-current" />
                <span>{service.badge}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25">
              <Star className="w-3 h-3 fill-current text-amber-400" />
              <span>{service.rating}</span>
              <span className="text-slate-400 text-[9.5px]">({service.completedOrders}+)</span>
            </span>
          </div>
        </div>

        {/* Title & Tagline */}
        <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
          {service.title}
        </h3>
        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
          {service.tagline}
        </p>
      </div>

      {/* Body Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-5">
        
        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {service.description}
        </p>

        {/* Pricing & Delivery Strip */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pricing Scope
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Starting at</span>
              <span className="font-heading font-black text-base sm:text-lg text-emerald-600 dark:text-emerald-400">
                {formattedPrice}
              </span>
            </div>
          </div>

          <div className="border-l border-slate-200 dark:border-slate-800 pl-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Estimated Delivery
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 text-slate-900 dark:text-white font-bold text-xs sm:text-sm">
              <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{service.deliveryTime}</span>
            </div>
          </div>
        </div>

        {/* Key Highlights Checklist */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-heading font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Key Highlights &amp; Scope:
            </span>
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> 100% Guaranteed
            </span>
          </div>

          <ul className="space-y-1.5">
            {service.features.slice(0, 4).map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-snug">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tech Stack Pills */}
        {service.techStack && service.techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {service.techStack.map((tech, idx) => (
              <span 
                key={idx} 
                className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* 100% SATISFACTION GUARANTEE BADGE (SERVICES) */}
        <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 my-3 border border-cyan-500/40 bg-gradient-to-br from-[#091522] via-[#0d1f33] to-[#08121e] animate-[breatheNeonCyan_3s_ease-in-out_infinite] group">
          <div className="absolute inset-0 w-[200%] -translate-x-full animate-[lightSweep_3s_linear_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none skew-x-12" />
          <div className="relative flex items-start sm:items-center gap-4">
            <div className="relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-[levitate_3s_ease-in-out_infinite]">
              <div className="absolute inset-0 rounded-xl bg-cyan-400/20 animate-pulse" />
              <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 relative z-10 animate-[textGlowCyan_3s_ease-in-out_infinite]" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-cyan-400 font-bold text-sm sm:text-base lg:text-lg tracking-wide mb-1 animate-[textGlowCyan_3s_ease-in-out_infinite]">
                🤝 ১০০% স্যাটিসফ্যাকশন গ্যারান্টি • Satisfaction Guaranteed
              </h4>
              <p className="text-white font-medium text-xs sm:text-sm leading-relaxed">
                প্রজেক্টে সন্তুষ্ট না হলে বা রিকোয়ারমেন্ট অনুযায়ী ডেলিভারি না পেলে ফুল রিফান্ড সাপোর্ট!
              </p>
              <p className="text-slate-300 text-[11px] sm:text-xs mt-1 leading-snug">
                Full refund protection if milestone delivery requirements are not met.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 backdrop-blur-sm">
                  🎯 Milestone Protected
                </span>
                <span className="bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 backdrop-blur-sm">
                  💬 24/7 Support
                </span>
                <span className="bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 backdrop-blur-sm">
                  ⭐ Verified Quality
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}

        <div className="pt-2 space-y-2">
          {/* Primary CTA Button: Order via WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <img
              src="https://lh3.googleusercontent.com/d/1941nw0eU_JIhKT_4QLuglzwuyDieb-jW"
              alt="WhatsApp"
              className="w-4 h-4 object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://drive.google.com/uc?export=view&id=1941nw0eU_JIhKT_4QLuglzwuyDieb-jW';
              }}
            />
            <span>Order via WhatsApp</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </a>

          {/* Quick Helper Button / Copy Quote Request */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Direct Developer Contact
            </span>
            <button
              type="button"
              onClick={handleCopyRequirements}
              className="hover:text-emerald-500 transition-colors flex items-center gap-1 cursor-pointer"
              title="Copy message draft to clipboard"
            >
              {copiedMsg ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <MessageSquareShare className="w-3 h-3" />
                  <span>Copy Request Text</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
