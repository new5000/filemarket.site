import React, { useEffect } from 'react';
import { X, ShieldCheck, Lock, FileText, Phone, CheckCircle2, Mail, MapPin, MessageSquare, ArrowRight, ExternalLink } from 'lucide-react';
import { useBrand } from '../context/BrandContext';

export type PolicyType = 'privacy' | 'refund' | 'terms' | 'contact';

interface PolicyModalProps {
  isOpen: boolean;
  initialTab?: PolicyType;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
}) => {
  const { founderName, founderBio } = useBrand();
  const [activeTab, setActiveTab] = React.useState<PolicyType>(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="policy-modal"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-[#0d1527] border border-slate-700/80 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[90vh] text-slate-200 transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/70 backdrop-blur-md flex items-center justify-between shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              {activeTab === 'privacy' && <Lock className="w-5 h-5" />}
              {activeTab === 'refund' && <ShieldCheck className="w-5 h-5" />}
              {activeTab === 'terms' && <FileText className="w-5 h-5" />}
              {activeTab === 'contact' && <Phone className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-extrabold text-white tracking-tight">
                {activeTab === 'privacy' && 'Privacy Policy (গোপনীয়তা নীতি)'}
                {activeTab === 'refund' && '100% Refund Policy (টাকা ফেরত নীতি)'}
                {activeTab === 'terms' && 'Terms of Service (ব্যবহারের শর্তাবলি)'}
                {activeTab === 'contact' && 'About & Contact Support (আমাদের সম্পর্কে)'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                FileMarket.site Official Legal &amp; Trust Center
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60 transition cursor-pointer active:scale-95"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector Nav (Matching Payment & Policy Pill Bar Style) */}
        <div className="flex items-center gap-1.5 p-2.5 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto no-scrollbar shrink-0 relative z-10">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] font-bold'
                : 'bg-[#0d1527] border border-slate-700/60 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-800/80'
            }`}
          >
            <span>🔒</span>
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('refund')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'refund'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] font-bold'
                : 'bg-[#0d1527] border border-slate-700/60 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-800/80'
            }`}
          >
            <span>🛡️</span>
            <span>100% Refund Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] font-bold'
                : 'bg-[#0d1527] border border-slate-700/60 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-800/80'
            }`}
          >
            <span>📜</span>
            <span>Terms of Service</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)] font-bold'
                : 'bg-[#0d1527] border border-slate-700/60 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-800/80'
            }`}
          >
            <span>📞</span>
            <span>About &amp; Contact</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 sm:p-7 overflow-y-auto max-h-[65vh] leading-relaxed text-sm space-y-5 text-slate-300 relative z-10">
          
          {/* PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-medium leading-relaxed">
                🔒 <strong>FileMarket.site Privacy Protection:</strong> We are committed to safeguarding your personal data, transaction confidentiality, and delivering encrypted digital downloads.
              </div>

              <div className="space-y-3">
                <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1. User Data Collection &amp; Purpose (তথ্য সংগ্রহ)</span>
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  FileMarket.site only collects essential verification information (bKash/Nagad/Binance sender phone number, Transaction ID, and verified email address) solely to authenticate payments and grant instant automated Google Drive download permissions.
                </p>

                <h3 className="font-heading text-base font-bold text-white flex items-center gap-2 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>2. No Third-Party Selling or Sharing (তৃতীয় পক্ষের সাথে তথ্য শেয়ার নিষিদ্ধ)</span>
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  We maintain a strict zero-sharing policy. Your name, email, phone number, and purchase history are 100% private and will never be shared, leased, or sold to external advertisers or telemarketers.
                </p>

                <h3 className="font-heading text-base font-bold text-white flex items-center gap-2 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>3. Cookie &amp; Local Storage Usage</span>
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  We use lightweight browser local storage to preserve your selected currency, wishlist bookmarks, and authentication status. No tracking or intrusive marketing cookies are deployed.
                </p>

                <h3 className="font-heading text-base font-bold text-white flex items-center gap-2 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>4. Digital Asset Delivery &amp; Drive Locker Security</span>
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  Purchased digital assets are hosted on secure, high-speed Google Cloud &amp; Google Drive servers. Every file is scanned for malware, viruses, and integrity prior to publishing.
                </p>
              </div>
            </div>
          )}

          {/* REFUND POLICY */}
          {activeTab === 'refund' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-medium leading-relaxed">
                🛡️ <strong>100% Money-Back Guarantee:</strong> We stand 100% behind the quality of our assets. If your download is defective, broken, or not as described, you get a full refund within 24 hours.
              </div>

              <div className="space-y-3">
                <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1. 24-Hour Refund Guarantee (২৪ ঘণ্টার মধ্যে ১০০% ফুল রিফান্ড)</span>
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  If any digital course, software tool, script, video bundle, or prompt pack is corrupt, inaccessible, or has dead download links that our team cannot resolve within 24 hours, you are entitled to an immediate 100% refund directly back to your bKash or Nagad wallet.
                </p>

                <h3 className="font-heading text-base font-bold text-white flex items-center gap-2 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>2. How to Claim Your Refund (সহজ রিফান্ড প্রসেস)</span>
                </h3>
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs sm:text-sm">
                  <p>1. Send your <strong>Transaction ID (TrxID)</strong> and Product Title to WhatsApp: <a href="https://wa.me/8801673833783" target="_blank" rel="noreferrer" className="text-emerald-400 font-bold hover:underline">+8801673833783</a></p>
                  <p>2. Describe the issue (e.g. broken file, corrupted archive, or access restriction).</p>
                  <p>3. Our Founder &amp; Support Architect will verify and send your refund cash within 2 to 24 hours.</p>
                </div>

                <h3 className="font-heading text-base font-bold text-white flex items-center gap-2 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>3. Instant Replacement &amp; Remote Tech Support</span>
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  You can also opt for a complimentary alternative asset of equal value or receive live technical guidance to get your software or course running smoothly.
                </p>
              </div>
            </div>
          )}

          {/* TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs sm:text-sm font-medium leading-relaxed">
                📜 <strong>FileMarket.site Terms of Service:</strong> By placing an order or downloading files from FileMarket, you agree to these transparent licensing and fair usage guidelines.
              </div>

              <div className="space-y-3">
                <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1. Lifetime Non-Exclusive License (লাইফটাইম ব্যবহারের অধিকার)</span>
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  Purchasing an asset grants you a lifetime personal and commercial license to use the files in client projects, video productions, and personal learning without recurring fees.
                </p>

                <h3 className="font-heading text-base font-bold text-white flex items-center gap-2 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>2. Resale &amp; Mass Public Distribution Prohibition</span>
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  You may not re-upload, re-sell, or publicly distribute the raw Google Drive master folder links to public piracy forums or file-sharing channels.
                </p>

                <h3 className="font-heading text-base font-bold text-white flex items-center gap-2 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>3. Instant Automated Delivery</span>
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  Payments made via bKash or Nagad are matched with their Transaction ID to unlock immediate Google Drive access in your Digital Locker.
                </p>
              </div>
            </div>
          )}

          {/* ABOUT & CONTACT */}
          {activeTab === 'contact' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-medium leading-relaxed">
                📞 <strong>About FileMarket.site &amp; Official Contact:</strong> Bangladesh&apos;s most trusted digital asset marketplace with direct founder support.
              </div>

              <div className="space-y-3">
                <h3 className="font-heading text-base font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Marketplace &amp; Founder Overview</span>
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                  FileMarket.site is founded and actively managed by <strong>{founderName}</strong> ({founderBio}). We curate, verify, and host top-tier digital assets including 4K video editing bundles, web development masterclasses, PC tools, scripts, and Blogger themes.
                </p>

                {/* Contact Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <MapPin className="w-4 h-4" />
                      <span>Registered Office</span>
                    </div>
                    <p className="text-slate-300 font-medium">Bayzid, Chittagong - 4214, Bangladesh</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 text-xs">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold">
                      <Mail className="w-4 h-4" />
                      <span>Official Email</span>
                    </div>
                    <a href="mailto:filemarket.help@gmail.com" className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline block">
                      filemarket.help@gmail.com
                    </a>
                  </div>
                </div>

                {/* Direct WhatsApp Call to Action */}
                <div className="pt-2">
                  <a
                    href="https://wa.me/8801673833783"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-heading font-extrabold text-sm shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-slate-950 shrink-0" />
                      <div>
                        <div className="text-slate-950 font-black">Direct WhatsApp: +8801673833783</div>
                        <div className="text-slate-900/90 text-xs font-semibold">Instant reply for orders, support &amp; refunds</div>
                      </div>
                    </div>
                    <ExternalLink className="w-5 h-5 text-slate-950 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0 relative z-10">
          <span className="text-xs text-slate-400 font-medium">
            FileMarket.site • 100% Verified &amp; Protected
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-heading font-extrabold text-xs transition cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-95"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
};

