import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
}

export const StripeLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    viewBox="0 0 60 25"
    className={className}
    style={size ? { width: size, height: typeof size === 'number' ? size * 0.42 : size } : undefined}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="60" height="25" rx="4" fill="#635BFF" />
    <path
      d="M16.5 13.5c0-2.3 1.8-3.7 4.5-3.7 1.3 0 2.4.3 3.2.7v2.3c-.8-.4-1.8-.7-2.8-.7-1.3 0-2.1.6-2.1 1.4 0 2.2 6 1.4 6 5.8 0 2.4-1.9 3.8-4.7 3.8-1.5 0-2.8-.4-3.8-1v-2.4c1 .6 2.2 1 3.3 1 1.4 0 2.2-.6 2.2-1.5 0-2.4-5.8-1.6-5.8-5.7zm10.7-3.4h2.7v1.8h-2.7v6.6c0 .8.5 1.1 1.3 1.1.5 0 .9-.1 1.2-.2v2.2c-.5.2-1.2.3-2 .3-2 0-3.3-1.1-3.3-3.2v-6.8h-1.6V10.1h1.6V7.4l2.8-.8v3.5zm5.5 2.1c.7-.6 1.7-1 2.8-1v2.8c-.3 0-.7-.1-1.1-.1-1.3 0-2.1.8-2.1 2.4v6.1h-2.8V10.1h2.5l.5 2.1h.2zm6.2-5.4c0-.9.7-1.6 1.6-1.6.9 0 1.6.7 1.6 1.6 0 .9-.7 1.6-1.6 1.6-.9 0-1.6-.7-1.6-1.6zm.2 3.3h2.8v12.7h-2.8V10.1zm6 0h2.6l.2 1.4h.1c.8-1.1 2-1.7 3.3-1.7 2.3 0 4.1 1.9 4.1 4.7 0 3-1.8 4.9-4.1 4.9-1.3 0-2.4-.6-3.1-1.6h-.1v5.7h-2.8V10.1zm5.9 4.7c0-1.6-1-2.7-2.3-2.7-1.2 0-2.2 1.1-2.2 2.7 0 1.6 1 2.7 2.2 2.7 1.3 0 2.3-1.1 2.3-2.7zm6.7-.4c.1-2.6 1.9-4.3 4.4-4.3 2.6 0 4.2 1.9 4.2 4.6v.7h-6.8c.2 1.4 1.2 2.2 2.6 2.2 1.1 0 2-.4 2.8-1.1v2.1c-.8.7-2 1.1-3.2 1.1-2.8 0-4.8-1.9-4.8-4.7l.8-.6zm6.7-1.4c-.1-1.1-.9-1.9-2.1-1.9-1.1 0-2 .8-2.2 1.9h4.3z"
      fill="#FFFFFF"
    />
  </svg>
);

export const PayPalLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6', size }) => (
  <svg
    viewBox="0 0 60 25"
    className={className}
    style={size ? { width: size, height: typeof size === 'number' ? size * 0.42 : size } : undefined}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="60" height="25" rx="4" fill="#003087" />
    <path
      d="M17.5 6.5h6.2c3.4 0 5.4 1.6 4.8 4.8-.6 3.1-2.9 4.8-6.1 4.8h-2.2l-1.3 6.4h-3.6l3.2-16zm4.8 6.5h1.8c1.6 0 2.7-.8 3-2.3.3-1.4-.4-2.1-1.9-2.1h-1.8l-1.1 4.4z"
      fill="#0079C1"
    />
    <path
      d="M21.5 9h6.2c3.4 0 5.4 1.6 4.8 4.8-.6 3.1-2.9 4.8-6.1 4.8h-2.2l-1.3 6.4h-3.6l3.2-16zm4.8 6.5h1.8c1.6 0 2.7-.8 3-2.3.3-1.4-.4-2.1-1.9-2.1h-1.8l-1.1 4.4z"
      fill="#00457C"
      fillOpacity="0.4"
    />
    <path
      d="M34.5 13.5c0-2.8 2.2-4.9 5.2-4.9 3 0 5.1 2.1 5.1 4.9s-2.2 4.9-5.1 4.9c-3 0-5.2-2.1-5.2-4.9zm7.3 0c0-1.4-.9-2.5-2.2-2.5s-2.2 1.1-2.2 2.5.9 2.5 2.2 2.5 2.2-1.1 2.2-2.5zm4.8-4.6h3v1.5h.1c.5-1 1.7-1.8 3-1.8 2.5 0 4.1 1.7 4.1 4.2v6.4h-3v-5.9c0-1.4-.7-2.2-1.9-2.2-1.1 0-2 .8-2.2 2v6.1h-3.1V8.9z"
      fill="#0079C1"
    />
  </svg>
);

export const RazorpayLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <div className={`flex items-center justify-center bg-[#02042B] rounded-lg p-1 ${className}`}>
    <span className="text-[#0C2340] font-black text-[11px] tracking-tight bg-[#3395FF] px-1.5 py-0.5 rounded text-white font-mono">
      Razorpay
    </span>
  </div>
);

export const MollieLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <div className={`flex items-center justify-center bg-[#000000] text-white rounded-lg p-1 font-black text-xs ${className}`}>
    mollie
  </div>
);

export const PaystackLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <div className={`flex items-center justify-center bg-[#09A5DB] text-white rounded-lg p-1 font-black text-xs ${className}`}>
    paystack
  </div>
);

export const FlutterwaveLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <div className={`flex items-center justify-center bg-[#FB9129] text-slate-950 rounded-lg p-1 font-black text-xs ${className}`}>
    Flutterwave
  </div>
);

export const MercadoPagoLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <div className={`flex items-center justify-center bg-[#009EE3] text-white rounded-lg p-1 font-black text-xs ${className}`}>
    MercadoPago
  </div>
);

export const CoinbaseLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <div className={`flex items-center justify-center bg-[#0052FF] text-white rounded-lg p-1 font-black text-xs ${className}`}>
    🪙 Coinbase Crypto
  </div>
);

export const SkrillLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <div className={`flex items-center justify-center bg-[#811244] text-white rounded-lg p-1 font-black text-xs ${className}`}>
    Skrill
  </div>
);

export const NagadLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <div className={`flex items-center justify-center bg-[#F7931E] text-white rounded-lg p-1 font-black text-xs ${className}`}>
    <span className="font-extrabold">নগদ</span> Nagad
  </div>
);

export const RocketLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <div className={`flex items-center justify-center bg-[#8C3494] text-white rounded-lg p-1 font-black text-xs ${className}`}>
    🚀 Rocket
  </div>
);

export const BinanceLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <div className={`flex items-center justify-center bg-[#F3BA2F] text-slate-950 rounded-lg p-1 font-black text-xs ${className}`}>
    ⯨ Binance Pay
  </div>
);

export const BankLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <div className={`flex items-center justify-center bg-slate-800 text-white rounded-lg p-1 font-black text-xs ${className}`}>
    🏛️ Bank Wire / IBAN
  </div>
);

export const ShurjopayLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <div className={`flex items-center justify-center gap-1 bg-[#EB5A28] text-white rounded-lg px-2 py-1 font-black text-xs shadow-sm ${className}`}>
    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" fill="#FFC72C" />
      <path d="M7 12L10 15L17 8" stroke="#EB5A28" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span className="font-heading tracking-tight text-white font-extrabold text-[11px]">shurjo<span className="text-[#FFC72C]">Pay</span></span>
  </div>
);

export const SSLCommerzLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <div className={`flex items-center justify-center gap-1 bg-[#1A2E40] border border-[#E31B23]/40 text-white rounded-lg px-2 py-1 font-black text-xs shadow-sm ${className}`}>
    <span className="bg-[#E31B23] text-white text-[9px] px-1 py-0.5 rounded font-black tracking-wider">SSL</span>
    <span className="font-heading tracking-tight text-slate-100 font-extrabold text-[11px]">COMMERZ</span>
  </div>
);

export const AamarPayLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6' }) => (
  <div className={`flex items-center justify-center gap-1 bg-gradient-to-r from-[#144673] to-[#0A88BA] text-white rounded-lg px-2 py-1 font-black text-xs shadow-sm ${className}`}>
    <span className="text-[#00D2D3] font-bold text-xs">aamar</span>
    <span className="bg-[#00D2D3] text-[#0A2F4A] px-1 py-0.2 rounded font-black text-[10px]">PAY</span>
  </div>
);

export const UpayLogo: React.FC<LogoProps> = ({ className = 'w-6 h-6', size }) => (
  <div 
    className={`flex items-center justify-center gap-0.5 bg-[#002D62] text-white rounded-lg px-1.5 py-0.5 font-black text-xs shadow-sm ${className}`}
    style={size ? { width: size, height: typeof size === 'number' ? size * 0.42 : size } : undefined}
  >
    <span className="font-heading font-extrabold text-[#FBBF24] text-[12px] lowercase tracking-tighter">u</span>
    <span className="font-heading font-extrabold text-white text-[12px] lowercase tracking-tighter">pay</span>
  </div>
);

export interface PaymentGatewayLogoProps {
  gatewayId: string;
  customLogo?: string;
  className?: string;
  size?: number | string;
  name?: string;
  fallbackText?: string;
}

export const PaymentGatewayLogo: React.FC<PaymentGatewayLogoProps> = ({
  gatewayId,
  customLogo,
  className = 'w-6 h-6',
  size,
  name,
  fallbackText,
}) => {
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [customLogo]);

  if (customLogo && !imgError) {
    return (
      <img
        src={customLogo}
        alt={name || gatewayId}
        className={`${className} object-contain rounded-md`}
        style={size ? { width: size, height: size } : undefined}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
    );
  }

  const normalizedId = gatewayId.toLowerCase().replace(/[^a-z0-9]/g, '');

  switch (normalizedId) {
    case 'bkash':
      // Dynamic Bkash SVG
      return (
        <svg viewBox="0 0 100 100" className={className} style={size ? { width: size, height: size } : undefined} fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="50" fill="#E2136E" />
          <polygon points="43.7,48.7 21.8,20.3 51.1,23.7" fill="#FFFFFF" />
          <polygon points="21.8,20.3 20.8,25.1 33.5,36.2" fill="#FFFFFF" />
          <polygon points="43.7,48.7 51.1,23.7 65.2,41.2" fill="#FFFFFF" />
          <polygon points="65.2,41.2 84.8,44.2 78.0,44.5" fill="#FFFFFF" />
          <polygon points="65.2,41.2 78.0,44.5 72.6,52.8 43.7,48.7" fill="#FFFFFF" />
          <polygon points="43.7,48.7 72.6,52.8 47.9,65.0" fill="#FFFFFF" />
          <polygon points="43.7,48.7 47.9,65.0 34.9,79.6" fill="#FFFFFF" />
        </svg>
      );
    case 'nagad':
      return <NagadLogo className={className} size={size} />;
    case 'rocket':
      return <RocketLogo className={className} size={size} />;
    case 'upay':
      return <UpayLogo className={className} size={size} />;
    case 'binance':
    case 'binancepay':
      return <BinanceLogo className={className} size={size} />;
    case 'stripe':
    case 'card':
    case 'cards':
    case 'creditdebit':
      return <StripeLogo className={className} size={size} />;
    case 'paypal':
      return <PayPalLogo className={className} size={size} />;
    case 'shurjopay':
      return <ShurjopayLogo className={className} size={size} />;
    case 'sslcommerz':
      return <SSLCommerzLogo className={className} size={size} />;
    case 'aamarpay':
      return <AamarPayLogo className={className} size={size} />;
    case 'razorpay':
      return <RazorpayLogo className={className} size={size} />;
    case 'coinbase':
      return <CoinbaseLogo className={className} size={size} />;
    case 'paystack':
      return <PaystackLogo className={className} size={size} />;
    case 'flutterwave':
      return <FlutterwaveLogo className={className} size={size} />;
    case 'mollie':
      return <MollieLogo className={className} size={size} />;
    case 'mercadopago':
      return <MercadoPagoLogo className={className} size={size} />;
    case 'skrill':
      return <SkrillLogo className={className} size={size} />;
    case 'banktransfer':
    case 'bank':
      return <BankLogo className={className} size={size} />;
    default:
      return (
        <div
          className={`flex items-center justify-center bg-slate-800 text-white rounded-md font-bold text-[10px] ${className}`}
          style={size ? { width: size, height: size } : undefined}
        >
          {fallbackText || name?.substring(0, 2).toUpperCase() || gatewayId.substring(0, 2).toUpperCase()}
        </div>
      );
  }
};

