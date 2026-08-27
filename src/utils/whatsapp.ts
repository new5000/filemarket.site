import { Product, Currency } from '../types';
import { getAuthStatus } from '../lib/authGuard';

export const DEFAULT_WHATSAPP_NUMBER = '8801673833783';

/**
 * Clean general inquiry message for founder and support chats
 */
export const GENERAL_WHATSAPP_GREETING =
  'Hello Joy Barmon / FileMarket Support, I have an inquiry regarding your digital assets and services.';

/**
 * Returns a direct WhatsApp URL with a clean customer inquiry greeting
 */
export const getGeneralWhatsAppUrl = (phoneNumber: string = DEFAULT_WHATSAPP_NUMBER): string => {
  const cleanPhone = (phoneNumber || DEFAULT_WHATSAPP_NUMBER).replace(/[^0-9]/g, '') || DEFAULT_WHATSAPP_NUMBER;
  const generalGreeting = encodeURIComponent(GENERAL_WHATSAPP_GREETING);
  return `https://wa.me/${cleanPhone}?text=${generalGreeting}`;
};

/**
 * Opens WhatsApp in a new tab with a clean customer inquiry greeting
 */
export const handleDirectWhatsAppChat = (phoneNumber: string = DEFAULT_WHATSAPP_NUMBER) => {
  const cleanPhone = (phoneNumber || DEFAULT_WHATSAPP_NUMBER).replace(/[^0-9]/g, '') || DEFAULT_WHATSAPP_NUMBER;
  const generalGreeting = encodeURIComponent(GENERAL_WHATSAPP_GREETING);
  const targetUrl = `https://wa.me/${cleanPhone}?text=${generalGreeting}`;

  if (typeof window !== 'undefined') {
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }
  return targetUrl;
};

/**
 * Formats a clean, well-structured markdown message for WhatsApp from Product Details
 */
export function generateProductDetailsWhatsAppMessage(
  product: Product,
  currency: Currency | string = 'BDT',
  customPhone?: string
): { message: string; url: string } {
  const auth = getAuthStatus();
  const customerInfo = auth.isLoggedIn && auth.user
    ? `${auth.user.name || 'User'} (${auth.user.email || ''})`
    : 'Guest Customer';

  const priceFormatted =
    currency === 'USD'
      ? `$${product.priceUSD} USD`
      : `৳${product.priceBDT?.toLocaleString('en-BD')} BDT`;

  const currentUrl =
    typeof window !== 'undefined' ? window.location.href : 'https://filemarket.site';

  const productId =
    product.id || (product as any).productId || 'FM-' + Math.floor(Math.random() * 100000);

  const message = `👋 Hello FileMarket Support, I want to purchase this digital product:

📦 *Product:* ${product.title}
🆔 *Product ID:* ${productId}
💰 *Price:* ${priceFormatted}
📂 *Category:* ${product.category}
🔗 *Product Link:* ${currentUrl}

👤 *Customer:* ${customerInfo}

Please assist me with instant access and payment instructions. Thank you!`;

  const phone = customPhone || DEFAULT_WHATSAPP_NUMBER;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return { message, url };
}

/**
 * Formats a clean, well-structured markdown message for WhatsApp from Checkout Page
 */
export function generateCheckoutWhatsAppMessage(params: {
  product?: Product | null;
  totalBDT: number;
  totalUSD: number;
  paymentMethod: string;
  trxId: string;
  customerPhone: string;
  orderId?: string;
  currency?: Currency | string;
  customPhone?: string;
}): { message: string; url: string } {
  const {
    product,
    totalBDT,
    totalUSD,
    paymentMethod,
    trxId,
    customerPhone,
    orderId,
    currency = 'BDT',
    customPhone,
  } = params;

  const auth = getAuthStatus();
  const customerInfo = auth.isLoggedIn && auth.user
    ? `${auth.user.name || 'User'} (${auth.user.email || ''})`
    : `Guest (${customerPhone || 'Not provided'})`;

  const priceFormatted =
    currency === 'USD' || paymentMethod === 'Binance'
      ? `$${totalUSD} USD / USDT`
      : `৳${totalBDT?.toLocaleString('en-BD')} BDT ($${totalUSD} USD)`;

  const productId =
    product?.id || (product as any)?.productId || orderId || 'FM-ORDER';

  const now = new Date();
  const dateTimeStr = now.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const message = `👋 Hello FileMarket Support, I have submitted a payment order on FileMarket!

📦 *Product:* ${product?.title || 'Digital Asset'}
🆔 *Product ID:* ${productId}
💰 *Total Amount:* ${priceFormatted}
💳 *Payment Method:* ${paymentMethod || 'bKash/Nagad/Rocket'}
🔢 *Transaction ID (TrxID):* ${trxId || 'Pending Verification'}
📱 *Sender Account / Phone:* ${customerPhone || 'N/A'}

👤 *Customer Email/Name:* ${customerInfo}
⏱ *Order Date:* ${dateTimeStr}

Please verify my payment and approve my Google Drive instant access download link. Thank you!`;

  const phone = customPhone || DEFAULT_WHATSAPP_NUMBER;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return { message, url };
}
