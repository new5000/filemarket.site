import React from 'react';
import { Sparkles, ShieldCheck, Clock, Headphones, CheckCircle2, MessageCircle } from 'lucide-react';
import { DIGITAL_SERVICES } from '../data/services';
import { Currency } from '../types';
import { ServiceCard } from './ServiceCard';

interface DigitalServicesSectionProps {
  currency: Currency;
}

export const DigitalServicesSection: React.FC<DigitalServicesSectionProps> = ({ currency }) => {
  const founderWhatsApp = '8801673833783';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      
      {/* Section Header & Subtitle */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-[#0b1320] to-emerald-950/40 border border-emerald-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-heading font-extrabold border border-emerald-500/40 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Premium Custom Development &amp; Publishing</span>
          </div>

          <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            Professional Digital Services by <span className="text-emerald-400">FileMarket</span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Need custom web development, mobile applications, Google Play Store app publishing, or automated payment gateways? Get direct 1-on-1 developer collaboration with fast delivery and guaranteed policy compliance.
          </p>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Money-Back &amp; Policy Guarantee</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Fast 24h–14d Delivery Timelines</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400">
              <Headphones className="w-4 h-4 text-amber-400" />
              <span>Direct WhatsApp Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {DIGITAL_SERVICES.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            currency={currency}
          />
        ))}
      </div>

      {/* Custom Quote & Special Consultation Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white">
            Have a custom requirement or specialized project in mind?
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
            We build tailor-made digital solutions, ERP systems, API integrations, and automation scripts. Chat with us to get a free estimate and timeline.
          </p>
        </div>

        <a
          href={`https://wa.me/${founderWhatsApp}?text=${encodeURIComponent("Hi Joy, I have a custom project requirement that is not listed in the standard services. I'd like to discuss a custom quote.")}`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 px-6 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-heading font-bold text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-2 shadow-md"
        >
          <MessageCircle className="w-4 h-4 text-emerald-400" />
          <span>Contact for Custom Quote</span>
        </a>
      </div>

    </div>
  );
};
