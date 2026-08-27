import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useBrand } from '../context/BrandContext';
import { useGlobalSettings } from '../context/GlobalSettingsContext';
import { formatDirectImageUrl } from '../utils/formatImageUrl';
import { getGeneralWhatsAppUrl } from '../utils/whatsapp';
import { 
  ShieldCheck, 
  Lock, 
  FileText, 
  Phone, 
  CheckCircle2, 
  Mail, 
  MapPin, 
  MessageSquare, 
  ExternalLink, 
  Sparkles, 
  Shield, 
  Clock, 
  Check, 
  Zap, 
  CreditCard,
  Award,
  AlertTriangle
} from 'lucide-react';

export type PolicyPageType = 'privacy' | 'refund' | 'terms' | 'contact';

interface PolicyHeroHeaderProps {
  titleEn: string;
  titleBn: string;
  subtitleEn: string;
  subtitleBn: string;
  icon: React.ReactNode;
}

export const PolicyHeroHeader: React.FC<PolicyHeroHeaderProps> = ({
  titleEn,
  titleBn,
  subtitleEn,
  subtitleBn,
  icon
}) => {
  return (
    <div className="w-full mb-6 sm:mb-8 space-y-4">
      {/* Top Status & Verification Badge */}
      <div className="flex items-center justify-between gap-3 pb-1">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/25 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0" />
          <span>🛡️ FileMarket Legal &amp; Trust Center • 2026 Verified</span>
        </div>
      </div>

      {/* Main Title & Hero Banner (High Contrast Day & Night Mode) */}
      <div className="flex items-start gap-4 p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-white dark:bg-gradient-to-r dark:from-[#0c1425] dark:via-[#0f172a] dark:to-[#0c1425] border border-emerald-200/80 dark:border-white/10 shadow-sm dark:shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/5 dark:bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 shadow-sm dark:shadow-[0_0_20px_rgba(16,185,129,0.25)]">
          {icon}
        </div>

        <div className="space-y-1.5 relative z-10">
          <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex flex-wrap items-center gap-2">
            <span>{titleEn}</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold text-base sm:text-lg md:text-xl">({titleBn})</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl">
            {subtitleEn}
          </p>
          <p className="text-xs text-emerald-800 dark:text-slate-400 leading-relaxed font-bangla font-medium">
            {subtitleBn}
          </p>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   1. PRIVACY POLICY PAGE (Isolated Standalone Page)
   ========================================================================= */
export const PrivacyPolicyPage: React.FC = () => {
  const { globalConfig } = useGlobalSettings();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const pp = globalConfig.homeContent?.privacyPolicy || {
    hero: {
      titleEn: 'Privacy Policy & Data Security',
      titleBn: 'প্রাইভেসি পলিসি ও তথ্য নিরাপত্তা',
      subtitleEn: 'Complete transparency on customer data protection, transaction confidentiality, and digital asset security across FileMarket.site.',
      subtitleBn: 'আমাদের ওয়েবসাইটে আপনার সমস্ত তথ্যের ১০০% গোপনীয়তা ও সুরক্ষা নিশ্চিত করা হয়।',
    },
    commitment: {
      titleEn: 'Zero-Knowledge Privacy Commitment',
      titleBn: '১০০% নিরাপদ ডেটা সুরক্ষা',
      descriptionEn: 'At FileMarket.site, we respect your confidentiality. We operate with strict zero-knowledge principles for sensitive payment credentials and guarantee that your personal data is never sold, shared, or rented.',
      descriptionBn: 'আপনার কোনো ব্যক্তিগত তথ্য বা পেমেন্ট হিস্ট্রি কোনো তৃতীয় পক্ষের সাথে শেয়ার করা হয় না।',
    },
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -10 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8"
    >
      <PolicyHeroHeader
        titleEn={pp.hero.titleEn}
        titleBn={pp.hero.titleBn}
        subtitleEn={pp.hero.subtitleEn}
        subtitleBn={pp.hero.subtitleBn}
        icon={<Lock className="w-6 h-6 sm:w-7 sm:h-7" />}
      />

      <div className="space-y-6">
        {/* Highlight Zero-Knowledge Commitment */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c1425] border border-emerald-300/80 dark:border-emerald-500/30 shadow-sm dark:shadow-xl relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/25 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                {pp.commitment.titleEn} ({pp.commitment.titleBn})
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {pp.commitment.descriptionEn}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bangla font-medium">
                {pp.commitment.descriptionBn}
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Information We Collect */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c1425] border border-slate-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-black text-sm border border-slate-300 dark:border-slate-700">
              1
            </div>
            <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Information We Collect (সংগৃহীত তথ্যের তালিকা)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            We only collect information strictly required to authenticate user sessions, fulfill purchases, and unlock verified Google Drive access:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Account Identity (অ্যাকাউন্ট পরিচিতি)</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Full name and verified Gmail address acquired securely via Google OAuth or Firebase Authentication.
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-slate-400 font-bangla">
                অটোমেটিক ড্রাইভ পারমিশন প্রদানের জন্য আপনার জিমেইল অ্যাকাউন্ট সুরক্ষিতভাবে সংরক্ষণ করা হয়।
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                <span>Payment Verification (পেমেন্ট ভেরিফিকেশন)</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Sender bKash/Nagad/Binance phone number, 8-10 digit Transaction ID (TrxID), and optional payment screenshot.
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-slate-400 font-bangla">
                অর্ডার নিশ্চিত করতে শুধু ট্রানজেকশন আইডি ও পেমেন্ট প্রুফ স্ক্রিনশট যাচাই করা হয়।
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Zero-Knowledge & Absolute Security */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c1425] border border-slate-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-black text-sm border border-slate-300 dark:border-slate-700">
              2
            </div>
            <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Zero-Knowledge &amp; Absolute Security (নিরাপত্তা ও এনক্রিপশন)
            </h3>
          </div>
          
          <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-slate-900 dark:text-slate-100">256-Bit SSL End-to-End Encryption:</strong> All communications between your browser and our server are encrypted with TLS 1.3 standards.
                <p className="text-[11px] text-emerald-700 dark:text-slate-400 font-bangla mt-0.5">আপনার প্রতিটি লেনদেন ও ড্রাইভ ডাউনলোড লিংক ব্যাংক-লেভেল ২৫৬-বিট এনক্রিপশন দ্বারা সুরক্ষিত।</p>
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-slate-900 dark:text-slate-100">Strict Non-Disclosure Commitment:</strong> We never share, rent, or sell your personal details or payment proof to third-party ad networks.
                <p className="text-[11px] text-emerald-700 dark:text-slate-400 font-bangla mt-0.5">আমরা কখনোই কোনো গ্রাহকের ফোন নম্বর বা ইমেইল স্প্যাম নেটওয়ার্কের কাছে বিক্রি করি না।</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Section 3: Official Support & Privacy Officer */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c1425] border border-slate-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-black text-sm border border-slate-300 dark:border-slate-700">
              3
            </div>
            <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Official Support &amp; Privacy Officer (যোগাযোগ ও সহায়তা)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            For privacy inquiries, account data deletion, or compliance audits, contact our designated privacy desk:
          </p>
          <a
            href="mailto:filemarket.help@gmail.com"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-slate-900 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm transition-all shadow-sm w-fit cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>filemarket.help@gmail.com</span>
          </a>
        </div>
      </div>
    </motion.div>
  );
};

/* =========================================================================
   2. 100% REFUND POLICY PAGE (Isolated Standalone Page)
   ========================================================================= */
export const RefundPolicyPage: React.FC = () => {
  const { globalConfig } = useGlobalSettings();
  const { founderName } = useBrand();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const rp = globalConfig.homeContent?.refundPolicy || {
    hero: {
      titleEn: '100% Money-Back Refund Guarantee',
      titleBn: '১০০% মানিব্যাক রিফান্ড পলিসি',
      subtitleEn: 'Unmatched buyer protection with our 24-48 hour instant refund policy for any defective, broken, or mismatched digital assets.',
      subtitleBn: 'ফাইলের লিংক কাজ না করলে বা কোনো সমস্যা থাকলে ২৪-৪৮ ঘণ্টার মধ্যে ১০০% টাকা ফেরত।',
    },
    guarantee: {
      badge: '⭐ Zero Risk Buyer Protection',
      titleEn: 'Zero Risk, Guaranteed Buyer Satisfaction',
      titleBn: '১০০% ঝুঁকিমুক্ত কেনাকাটার নিশ্চয়তা',
      descriptionEn: 'If the digital product you purchased from FileMarket does not match the product description, has corrupted archive files, or contains broken Google Drive download links that our team cannot fix within 24 hours, you receive an instant 100% money-back cash refund to your bKash or Nagad wallet.',
      descriptionBn: 'যদি ড্রাইভ লিংক নষ্ট থাকে বা প্রোডাক্টে ত্রুটি থাকে এবং আমরা সমাধান করতে না পারি, তবে সম্পূর্ণ টাকা ফেরত পাবেন।',
    },
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -10 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8"
    >
      <PolicyHeroHeader
        titleEn={rp.hero.titleEn}
        titleBn={rp.hero.titleBn}
        subtitleEn={rp.hero.subtitleEn}
        subtitleBn={rp.hero.subtitleBn}
        icon={<ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />}
      />

      <div className="space-y-6">
        {/* Top Golden Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-amber-50/90 dark:bg-gradient-to-r dark:from-amber-950/40 dark:via-[#0c1425] dark:to-amber-950/30 border border-amber-300 dark:border-amber-500/40 shadow-sm dark:shadow-xl relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-500/30">
                {rp.guarantee.badge}
              </span>
              <h2 className="font-heading text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {rp.guarantee.titleEn} ({rp.guarantee.titleBn})
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {rp.guarantee.descriptionEn}
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200/90 font-bangla font-semibold">
                {rp.guarantee.descriptionBn}
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Eligible Refund Cases */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c1425] border border-slate-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-xl space-y-4">
          <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Eligible Refund Cases (যেসব ক্ষেত্রে রিফান্ড পাবেন)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Dead / Inaccessible Drive Link (ডাউনলোড লিংক কাজ না করলে)</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                If the Google Drive folder returns 404 error or restricted permissions that our support team cannot resolve within 24 hours.
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-slate-400 font-bangla">
                গুগল ড্রাইভ লিংক কাজ না করলে ও ২৪ ঘণ্টার মধ্যে ঠিক করা সম্ভব না হলে রিফান্ড প্রযোজ্য।
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Corrupted Files or Major Mismatch (ফাইলের সমস্যা বা ত্রুটি)</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                If downloaded ZIP/RAR archives fail CRC verification or core features promised in the description are completely absent.
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-slate-400 font-bangla">
                ফাইলের মধ্যে কোনো উপাদান মিসিং থাকলে বা আর্কাইভ নষ্ট থাকলে রিফান্ড পাবেন।
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Instant Refund Process */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c1425] border border-slate-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-xl space-y-4">
          <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Instant Refund Process (কীভাবে রিফান্ড পাবেন)</span>
          </h3>

          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 text-xs font-black flex items-center justify-center shrink-0">
                1
              </span>
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-slate-100">Submit Order TrxID &amp; Screenshot:</strong> Send your bKash/Nagad Transaction ID and a screenshot of the issue to Founder {founderName} on WhatsApp (<strong className="text-emerald-700 dark:text-emerald-400">+8801673833783</strong>) or email <a href="mailto:filemarket.help@gmail.com" className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline">filemarket.help@gmail.com</a>.
                <p className="text-[11px] text-emerald-700 dark:text-slate-400 font-bangla mt-0.5">আপনার লেনদেনের TrxID এবং সমস্যার স্ক্রিনশট আমাদের হোয়াটসঅ্যাপে পাঠান।</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950 text-xs font-black flex items-center justify-center shrink-0">
                2
              </span>
              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <strong className="text-slate-900 dark:text-slate-100">Swift 24-48 Hour Wallet Cash Disbursement:</strong> Following swift verification, we transfer the 100% refund amount directly back to your sender bKash/Nagad wallet.
                <p className="text-[11px] text-emerald-700 dark:text-slate-400 font-bangla mt-0.5">ভেরিফিকেশন শেষে ২৪-৪৮ ঘণ্টার মধ্যে সম্পূর্ণ টাকা আপনার ওয়ালেটে সেন্ড মানি করা হবে।</p>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a
              href="https://wa.me/8801673833783?text=Hi%20Joy%20Barmon,%20I%20need%20assistance/refund%20for%20my%20FileMarket%20order."
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black font-heading font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/20 dark:shadow-lg dark:shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-4 h-4 text-white dark:text-black" />
              <span>Claim on WhatsApp (+8801673833783)</span>
            </a>

            <a
              href="mailto:filemarket.help@gmail.com?subject=FileMarket%20Refund%20Claim"
              className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-heading font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
            >
              <Mail className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Email: filemarket.help@gmail.com</span>
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* =========================================================================
   3. TERMS OF SERVICE PAGE (Isolated Standalone Page)
   ========================================================================= */
export const TermsOfServicePage: React.FC = () => {
  const { globalConfig } = useGlobalSettings();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const tos = globalConfig.homeContent?.termsOfService || {
    hero: {
      titleEn: 'Terms of Service & Licensing',
      titleBn: 'ব্যবহারের শর্তাবলী ও লাইসেন্স',
      subtitleEn: 'Clear digital asset licensing rights, commercial fair usage rules, and buyer responsibilities on FileMarket.site.',
      subtitleBn: 'ফাইলমার্কেট থেকে ডিজিটাল অ্যাসেট ব্যবহারের লাইসেন্স ও নিয়মনীতি।',
    },
    license: {
      titleEn: 'Lifetime Commercial License',
      titleBn: 'লাইফটাইম কমার্শিয়াল অধিকার',
      descriptionEn: 'Every digital asset purchased on FileMarket grants you a perpetual, royalty-free license for commercial and creative outputs:',
    },
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -10 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8"
    >
      <PolicyHeroHeader
        titleEn={tos.hero.titleEn}
        titleBn={tos.hero.titleBn}
        subtitleEn={tos.hero.subtitleEn}
        subtitleBn={tos.hero.subtitleBn}
        icon={<FileText className="w-6 h-6 sm:w-7 sm:h-7" />}
      />

      <div className="space-y-6">
        {/* Section 1: Lifetime Commercial License */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c1425] border border-slate-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-black text-sm border border-slate-300 dark:border-slate-700">
              1
            </div>
            <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {tos.license.titleEn} ({tos.license.titleBn})
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {tos.license.descriptionEn}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Client Work (ক্লায়েন্ট প্রজেক্ট)
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">Unlimited commercial use on Fiverr, Upwork, and local agency client productions.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Social &amp; Video Reels (সোশ্যাল কনটেন্ট)
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">Publish unlimited rendered videos on YouTube, TikTok, Facebook, and Instagram.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Software &amp; Web Apps (সফটওয়্যার কোড)
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">Integrate purchased scripts into personal and commercial web applications.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Strict Resale Prohibition */}
        <div className="p-5 sm:p-6 rounded-2xl bg-red-50/70 dark:bg-[#0c1425] border border-red-200 dark:border-red-500/30 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-700 dark:text-red-400 font-black text-sm border border-red-300 dark:border-red-500/30">
              2
            </div>
            <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Strict Resale &amp; Mass Sharing Prohibition (পুনরায় বিক্রি সম্পূর্ণ নিষিদ্ধ)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            While you have unlimited rights to publish your finished rendered media and applications, you <strong>may not</strong>:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
            <li>Re-upload or distribute the raw Google Drive master folder links to public Telegram channels, Facebook groups, or torrent trackers.</li>
            <li>Re-package and sell the raw assets on a competing digital storefront without significant modifications.</li>
            <li>Attempt to scrape, reverse engineer, or bypass FileMarket automated API delivery endpoints.</li>
          </ul>
          <p className="text-xs text-red-700 dark:text-red-300/90 font-bangla font-semibold">
            র ফোল্ডার বা ড্রাইভ লিংক পাবলিক গ্রুপে শেয়ার করা আইনত দণ্ডনীয় এবং এর ফলে ড্রাইভ এক্সেস স্থায়ীভাবে বাতিল হতে পারে।
          </p>
        </div>

        {/* Section 3: Instant Automated Cloud Access */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c1425] border border-slate-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-black text-sm border border-slate-300 dark:border-slate-700">
              3
            </div>
            <h3 className="font-heading text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              Instant Automated Cloud Access (তাত্ক্ষণিক ডাউনলোড সুবিধা)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            All purchases include automated instant access. Once verified with your bKash or Nagad Transaction ID, the download link is permanently saved into your <strong>My Products / Digital Locker</strong>. You may access your high-speed cloud drive anytime without link expiration.
          </p>
          <p className="text-xs text-emerald-700 dark:text-slate-400 font-bangla">
            পেমেন্ট সম্পন্ন হওয়ার সাথে সাথেই আজীবনের জন্য হাইস্পিড ক্লাউড ড্রাইভ এক্সেস পেয়ে যাবেন।
          </p>
        </div>
      </div>
    </motion.div>
  );
};

/* =========================================================================
   4. ABOUT & CONTACT PAGE (Isolated Standalone Page)
   ========================================================================= */
export const AboutContactPage: React.FC = () => {
  const { founderName, founderAvatarUrl, founderBio } = useBrand();
  const { globalConfig } = useGlobalSettings();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const ac = globalConfig.homeContent?.aboutContact || {
    hero: {
      titleEn: 'About FileMarket & Founder Contact',
      titleBn: 'আমাদের সম্পর্কে ও যোগাযোগ',
      subtitleEn: "Learn about Bangladesh's premier automated digital assets marketplace and get in touch directly with our leadership and support architects.",
      subtitleBn: 'বাংলাদেশের ডিজিটাল মার্কেটের নির্ভরযোগ্য প্ল্যাটফর্ম ও প্রতিষ্ঠাতা পরিচিতি।',
    },
    mission: {
      headingEn: 'Marketplace Mission',
      headingBn: 'আমাদের লক্ষ্য',
      subtextEn: 'Pioneering frictionless digital trade for Bangladeshi creators and coders',
      descriptionEn: 'FileMarket.site was created to break foreign currency barriers for Bangladeshi creators, freelance video editors, software engineers, and digital marketers. We curate high-ticket, virus-free creative and coding tools at affordable BDT prices with instant automated bKash & Nagad delivery.',
      descriptionBn: 'আন্তর্জাতিক মানের প্রিমিয়াম ডিজিটাল টুলস ও ভিডিও রিসোর্স বাংলাদেশি ক্রিয়েটরদের জন্য সাশ্রয়ী মূল্যে সহজলভ্য করাই আমাদের মূল লক্ষ্য।',
    },
    founderDetails: {
      location: '📍 Bayzid, Chittagong, Bangladesh',
      experience: '⚡ 10+ Years Web Experience',
      protection: '🛡️ 100% Refund Protected',
      bioText: 'Full-stack developer, cloud architect, and digital assets curator based in Chittagong, Bangladesh. Committed to 100% authentic digital downloads with direct personalized founder support.',
    },
    contactBadges: {
      addressLabel: 'Registered Headquarters',
      addressValue: 'Bayzid Bostami, Chittagong - 4214, Bangladesh.',
      addressSubtext: 'অফিসিয়াল যোগাযোগ ও পার্টনারশিপ অনুসন্ধানের ঠিকানা।',
      emailLabel: 'Official Support Email (24/7 Response)',
      emailValue: 'filemarket.help@gmail.com',
      emailSubtext: 'যেকোনো অর্ডার সমস্যা বা অনুসন্ধানে দ্রুত রিপ্লাই দেওয়া হয়।',
    },
    whatsappBox: {
      label: 'Instant Founder WhatsApp Line (সরাসরি হোয়াটসঅ্যাপ)',
      descriptionEn: 'Direct one-on-one assistance for custom orders, bKash verification, or instant refunds.',
      descriptionBn: 'যেকোনো প্রয়োজনে সরাসরি আমাদের হোয়াটসঅ্যাপে মেসেজ করুন।',
      buttonText: 'Chat on WhatsApp (+8801673833783)',
    },
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -10 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-8"
    >
      <PolicyHeroHeader
        titleEn={ac.hero.titleEn}
        titleBn={ac.hero.titleBn}
        subtitleEn={ac.hero.subtitleEn}
        subtitleBn={ac.hero.subtitleBn}
        icon={<Phone className="w-6 h-6 sm:w-7 sm:h-7" />}
      />

      <div className="space-y-6">
        {/* Mission Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0c1425] border border-slate-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/25 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                {ac.mission.headingEn} ({ac.mission.headingBn})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{ac.mission.subtextEn}</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {ac.mission.descriptionEn}
          </p>
          <p className="text-xs text-emerald-800 dark:text-slate-400 font-bangla leading-relaxed font-medium">
            {ac.mission.descriptionBn}
          </p>
        </div>

        {/* Founder Profile Section (Seamless, No Outer Border) */}
        <div className="py-8 px-4 bg-transparent relative">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            {/* Avatar with Floating Glow */}
            <div 
              className="relative group shrink-0 mx-auto md:mx-0"
              style={{ animation: 'float-avatar 4s ease-in-out infinite', willChange: 'transform' }}
            >
              <style>{`
                @keyframes float-avatar {
                  0%, 100% { transform: translateY(0px); }
                  50% { transform: translateY(-5px); }
                }
              `}</style>
              
              {/* Dedicated Ambient Blurred Background Layer */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/50 via-teal-400/40 to-cyan-500/50 rounded-[2.5rem] blur-2xl opacity-80 animate-pulse z-0"></div>

              <div className="relative w-32 h-32 mx-auto mb-4 rounded-3xl overflow-hidden border-2 border-emerald-400/60 shadow-[0_0_35px_rgba(16,185,129,0.45)] z-10 bg-[#07111e] transform-gpu">
                <img
                  src={formatDirectImageUrl(founderAvatarUrl)}
                  alt={`${founderName} - ${founderBio}`}
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Joy+Barmon&background=0284c7&color=fff&size=200&bold=true';
                  }}
                />
              </div>
              <div className="absolute bottom-2 -right-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-wider uppercase border border-white dark:border-slate-950 shadow-md z-20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-100 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-200"></span>
                </span>
                Verified
              </div>
            </div>

            {/* Bio Content - Sleek Glassmorphism */}
            <div className="space-y-3 text-center md:text-left flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                  {founderName}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-400 text-xs font-bold w-fit mx-auto md:mx-0">
                  {founderBio}
                </span>
              </div>
              
              <div className="bg-white/60 dark:bg-[#0c1425]/70 border border-slate-200/80 dark:border-slate-800/60 rounded-2xl p-4 my-2.5 backdrop-blur-sm shadow-sm text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed relative">
                <p>
                  {ac.founderDetails.bioText}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-xs">
                <span className="px-2.5 py-1.5 rounded-lg bg-white/80 dark:bg-[#0c1425]/70 border border-slate-200/80 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 shadow-sm">{ac.founderDetails.location}</span>
                <span className="px-2.5 py-1.5 rounded-lg bg-white/80 dark:bg-[#0c1425]/70 border border-slate-200/80 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 shadow-sm">{ac.founderDetails.experience}</span>
                <span className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400 shadow-sm">{ac.founderDetails.protection}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Direct Contact Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1425] border border-slate-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
              <MapPin className="w-5 h-5" />
              <span>{ac.contactBadges.addressLabel}</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
              {ac.contactBadges.addressValue}
            </p>
            <p className="text-slate-500 text-xs font-bangla">{ac.contactBadges.addressSubtext}</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1425] border border-slate-200/90 dark:border-slate-800/80 shadow-sm dark:shadow-xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 font-bold text-sm">
              <Mail className="w-5 h-5" />
              <span>{ac.contactBadges.emailLabel}</span>
            </div>
            <a 
              href={`mailto:${ac.contactBadges.emailValue}`} 
              className="text-emerald-700 dark:text-emerald-400 hover:underline text-xs sm:text-sm font-bold block"
            >
              {ac.contactBadges.emailValue}
            </a>
            <p className="text-slate-500 text-xs font-bangla">{ac.contactBadges.emailSubtext}</p>
          </div>
        </div>

        {/* Live WhatsApp Box */}
        <div className="p-5 sm:p-6 rounded-2xl bg-emerald-50/80 dark:bg-gradient-to-r dark:from-emerald-950/40 dark:via-[#0c1425] dark:to-emerald-950/30 border border-emerald-300 dark:border-emerald-500/40 shadow-sm dark:shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 font-extrabold text-sm">
                <MessageSquare className="w-5 h-5" />
                <span>{ac.whatsappBox.label}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                {ac.whatsappBox.descriptionEn}
              </p>
              <p className="text-xs text-emerald-800 dark:text-slate-400 font-bangla font-medium">{ac.whatsappBox.descriptionBn}</p>
            </div>

            <a
              href={getGeneralWhatsAppUrl(globalConfig?.branding?.whatsappNumber || '8801673833783')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black font-heading font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/20 dark:shadow-lg dark:shadow-emerald-500/25 transition-all shrink-0 cursor-pointer active:scale-95"
            >
              <span>{ac.whatsappBox.buttonText}</span>
              <ExternalLink className="w-4 h-4 text-white dark:text-black" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Aliases for compatibility
export const PrivacyPolicyView = PrivacyPolicyPage;
export const RefundPolicyView = RefundPolicyPage;
export const TermsOfServiceView = TermsOfServicePage;
export const AboutContactView = AboutContactPage;
