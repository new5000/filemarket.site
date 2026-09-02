import { doc, getDoc, setDoc, onSnapshot, collection, addDoc } from 'firebase/firestore';
import { db, addPurchasedProductToUser, PurchasedProductItem, cleanFirestoreData } from './firebase';
import { PaymentSettingsData, CustomPaymentGateway, Product } from '../types';
import { AdminOrder, saveAdminOrder } from './adminServices';

export type { PaymentSettingsData, CustomPaymentGateway };

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettingsData = {
  stripe: {
    enabled: true,
    mode: 'sandbox',
    publishableKey: 'pk_test_51MzSAMPLEKEYSTRIPE00000000000000000000000000000000000000000000000000000000000000000000000000',
    secretKey: 'sk_test_51MzSAMPLESECRETSTRIPE0000000000000000000000000000000000000000000000000000000000000000000000',
    currency: 'USD'
  },
  paypal: {
    enabled: true,
    mode: 'sandbox',
    clientId: 'sb-sample-client-id-filemarket-sandbox-paypal-001',
    secretKey: 'EM_sample_secret_paypal_sandbox_key_filemarket',
    currency: 'USD'
  },
  shurjopay: {
    enabled: true,
    mode: 'sandbox',
    merchantUsername: 'sp_sandbox_merchant',
    merchantPassword: 'sp_sandbox_password',
    keyPrefix: 'NOK',
    currency: 'BDT'
  },
  sslcommerz: {
    enabled: true,
    mode: 'sandbox',
    storeId: 'testbox',
    storePassword: 'qwerty',
    currency: 'BDT'
  },
  aamarpay: {
    enabled: true,
    mode: 'sandbox',
    storeId: 'aamarpaytest',
    signatureKey: 'dbb74894e82415a2f7ff0ec3a97e4183',
    currency: 'BDT'
  },
  razorpay: {
    enabled: true,
    mode: 'sandbox',
    keyId: 'rzp_test_samplekey12345',
    keySecret: 'sample_secret_razorpay_9988',
    currency: 'INR'
  },
  mollie: {
    enabled: false,
    mode: 'sandbox',
    apiKey: 'test_dHar4JYDxFaSeWSGgapxTAhgkJbcQg',
    currency: 'EUR'
  },
  paystack: {
    enabled: false,
    mode: 'sandbox',
    publicKey: 'pk_test_sample_paystack_public_key_9999',
    secretKey: 'sk_test_sample_paystack_secret_key_8888',
    currency: 'NGN'
  },
  flutterwave: {
    enabled: false,
    mode: 'sandbox',
    publicKey: 'FLWPUBK_TEST-sample_flutterwave_key_001',
    secretKey: 'FLWSECK_TEST-sample_flutterwave_secret_001',
    encryptionKey: 'FLWSECK_TEST_ENC_SAMPLE',
    currency: 'USD'
  },
  mercadopago: {
    enabled: false,
    mode: 'sandbox',
    publicKey: 'TEST-sample-mercadopago-public-key',
    accessToken: 'TEST-sample-mercadopago-access-token-001',
    currency: 'BRL'
  },
  coinbase: {
    enabled: true,
    mode: 'sandbox',
    apiKey: 'sample_coinbase_commerce_api_key_12345',
    webhookSecret: 'sample_coinbase_webhook_secret'
  },
  skrill: {
    enabled: false,
    merchantEmail: 'merchant@filemarket.site',
    secretWord: 'FileMarketSkrillSecret2026'
  },
  bkash: {
    enabled: true,
    mode: 'manual',
    merchantNumber: '01673833783',
    type: 'Personal / Send Money',
    instructions: 'Go to your bKash App or dial *247# -> Select "Send Money" -> Enter the Merchant Number above -> Enter the Exact Amount -> Put your Name/Order in Reference -> Enter PIN to confirm -> Copy & Paste the Transaction ID (TrxID) below.',
    qrCodeUrl: ''
  },
  nagad: {
    enabled: true,
    mode: 'manual',
    merchantNumber: '01673833783',
    type: 'Personal / Send Money',
    instructions: 'Go to your Nagad App or dial *167# -> Select "Send Money" -> Enter the Merchant Number above -> Enter the Exact Amount -> Put your Name/Order in Reference -> Enter PIN to confirm -> Copy & Paste the Transaction ID (TrxID) below.',
    qrCodeUrl: ''
  },
  rocket: {
    enabled: true,
    mode: 'manual',
    merchantNumber: '01673833783',
    type: 'Personal / Send Money',
    instructions: 'Go to Dutch-Bangla Rocket App or dial *322# -> Select "Send Money" -> Enter Rocket Number -> Enter Amount -> Enter PIN -> Submit Transaction ID.',
    qrCodeUrl: ''
  },
  upay: {
    enabled: true,
    mode: 'manual',
    merchantNumber: '01673833783',
    type: 'Personal / Send Money',
    instructions: 'Go to Upay App or dial *268# -> Select "Send Money" -> Enter Upay Number -> Enter Amount -> Enter PIN to confirm -> Submit Transaction ID below.',
    qrCodeUrl: ''
  },
  binance: {
    enabled: true,
    mode: 'manual',
    payId: '874592014',
    usdtAddress: 'TXn8SAMPLEUSDTTRC20ADDRESS998877665544',
    network: 'USDT (TRC20) / Binance Pay',
    instructions: 'Open Binance App -> Binance Pay -> Send -> Enter Pay ID 874592014 or transfer USDT (TRC20) to the address -> Put Order ID in note -> Submit your Binance Transaction ID/Internal Transfer ID below.',
    qrCodeUrl: ''
  },
  bankTransfer: {
    enabled: true,
    mode: 'manual',
    bankName: 'City Bank PLC',
    accountName: 'FileMarket Digital Ventures Ltd.',
    accountNumber: '1102839485001',
    routingNumber: '225272341',
    swift: 'CIBLBDDH',
    branchName: 'Gulshan 2 Branch, Dhaka',
    instructions: 'Initiate online banking, BEFTN, NPSB, or Wire Transfer to the official bank account above. Use your Customer Email or Phone as the transfer reference note. Submit the Bank Transfer Reference Number below.'
  },
  payoneer: {
    enabled: false,
    mode: 'manual',
    email: 'payments@filemarket.site',
    instructions: 'Send payment via "Make a Payment to Payoneer Customers" to payments@filemarket.site. Enter the Payoneer transaction reference ID below.'
  },
  customGateways: [
    {
      id: 'custom_jazzcash',
      name: 'JazzCash / Easypaisa (PK)',
      iconUrl: '',
      category: 'mobile',
      enabled: false,
      instructions: 'Transfer the amount to Mobile Account 03001234567 and enter your JazzCash TID below.',
      accountDetails: 'Account Title: FileMarket Digital | Number: +92 300 1234567',
      requireProof: true,
      requiredFields: ['Sender Mobile Number', 'Transaction ID / TID']
    }
  ],
  globalCurrency: 'USD',
  exchangeRates: {
    USD: 1,
    BDT: 120,
    EUR: 0.92,
    GBP: 0.79,
    INR: 83.5,
    CAD: 1.36,
    AUD: 1.52,
    PKR: 278.0,
    NGN: 1550.0,
    KES: 130.0,
    BRL: 5.45
  }
};

const PAYMENT_SETTINGS_STORAGE_KEY = 'fm_payment_settings';

/**
 * Subscribe to real-time payment settings in Firestore ('settings/payments')
 */
export function subscribePaymentSettings(callback: (settings: PaymentSettingsData) => void): () => void {
  try {
    const unsub = onSnapshot(doc(db, 'settings', 'payments'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const merged: PaymentSettingsData = {
          stripe: { ...DEFAULT_PAYMENT_SETTINGS.stripe, ...data.stripe },
          paypal: { ...DEFAULT_PAYMENT_SETTINGS.paypal, ...data.paypal },
          shurjopay: { ...DEFAULT_PAYMENT_SETTINGS.shurjopay, ...data.shurjopay },
          sslcommerz: { ...DEFAULT_PAYMENT_SETTINGS.sslcommerz, ...data.sslcommerz },
          aamarpay: { ...DEFAULT_PAYMENT_SETTINGS.aamarpay, ...data.aamarpay },
          razorpay: { ...DEFAULT_PAYMENT_SETTINGS.razorpay, ...data.razorpay },
          mollie: { ...DEFAULT_PAYMENT_SETTINGS.mollie, ...data.mollie },
          paystack: { ...DEFAULT_PAYMENT_SETTINGS.paystack, ...data.paystack },
          flutterwave: { ...DEFAULT_PAYMENT_SETTINGS.flutterwave, ...data.flutterwave },
          mercadopago: { ...DEFAULT_PAYMENT_SETTINGS.mercadopago, ...data.mercadopago },
          coinbase: { ...DEFAULT_PAYMENT_SETTINGS.coinbase, ...data.coinbase },
          skrill: { ...DEFAULT_PAYMENT_SETTINGS.skrill, ...data.skrill },
          bkash: { ...DEFAULT_PAYMENT_SETTINGS.bkash, ...data.bkash },
          nagad: { ...DEFAULT_PAYMENT_SETTINGS.nagad, ...data.nagad },
          rocket: { ...DEFAULT_PAYMENT_SETTINGS.rocket, ...data.rocket },
          upay: { ...DEFAULT_PAYMENT_SETTINGS.upay, ...(data.upay || {}) },
          binance: { ...DEFAULT_PAYMENT_SETTINGS.binance, ...data.binance },
          bankTransfer: { ...DEFAULT_PAYMENT_SETTINGS.bankTransfer, ...data.bankTransfer },
          payoneer: { ...DEFAULT_PAYMENT_SETTINGS.payoneer, ...data.payoneer },
          customGateways: Array.isArray(data.customGateways) ? data.customGateways : DEFAULT_PAYMENT_SETTINGS.customGateways,
          globalCurrency: data.globalCurrency || DEFAULT_PAYMENT_SETTINGS.globalCurrency,
          exchangeRates: { ...DEFAULT_PAYMENT_SETTINGS.exchangeRates, ...data.exchangeRates },
          updatedAt: data.updatedAt
        };
        try {
          localStorage.setItem(PAYMENT_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
        } catch {}
        callback(merged);
      } else {
        // Initialize doc with defaults
        setDoc(doc(db, 'settings', 'payments'), DEFAULT_PAYMENT_SETTINGS, { merge: true }).catch(console.warn);
        callback(DEFAULT_PAYMENT_SETTINGS);
      }
    }, (err) => {
      console.warn("Payment settings realtime sync warning:", err);
      const cached = getCachedPaymentSettings();
      callback(cached);
    });

    return unsub;
  } catch (e) {
    console.warn("Failed to attach payment settings snapshot:", e);
    const cached = getCachedPaymentSettings();
    callback(cached);
    return () => {};
  }
}

/**
 * Fetch current payment settings
 */
export async function fetchPaymentSettings(): Promise<PaymentSettingsData> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'payments'));
    if (snap.exists()) {
      const data = snap.data();
      const merged: PaymentSettingsData = {
        stripe: { ...DEFAULT_PAYMENT_SETTINGS.stripe, ...data.stripe },
        paypal: { ...DEFAULT_PAYMENT_SETTINGS.paypal, ...data.paypal },
        shurjopay: { ...DEFAULT_PAYMENT_SETTINGS.shurjopay, ...data.shurjopay },
        sslcommerz: { ...DEFAULT_PAYMENT_SETTINGS.sslcommerz, ...data.sslcommerz },
        aamarpay: { ...DEFAULT_PAYMENT_SETTINGS.aamarpay, ...data.aamarpay },
        razorpay: { ...DEFAULT_PAYMENT_SETTINGS.razorpay, ...data.razorpay },
        mollie: { ...DEFAULT_PAYMENT_SETTINGS.mollie, ...data.mollie },
        paystack: { ...DEFAULT_PAYMENT_SETTINGS.paystack, ...data.paystack },
        flutterwave: { ...DEFAULT_PAYMENT_SETTINGS.flutterwave, ...data.flutterwave },
        mercadopago: { ...DEFAULT_PAYMENT_SETTINGS.mercadopago, ...data.mercadopago },
        coinbase: { ...DEFAULT_PAYMENT_SETTINGS.coinbase, ...data.coinbase },
        skrill: { ...DEFAULT_PAYMENT_SETTINGS.skrill, ...data.skrill },
        bkash: { ...DEFAULT_PAYMENT_SETTINGS.bkash, ...data.bkash },
        nagad: { ...DEFAULT_PAYMENT_SETTINGS.nagad, ...data.nagad },
        rocket: { ...DEFAULT_PAYMENT_SETTINGS.rocket, ...data.rocket },
        upay: { ...DEFAULT_PAYMENT_SETTINGS.upay, ...(data.upay || {}) },
        binance: { ...DEFAULT_PAYMENT_SETTINGS.binance, ...data.binance },
        bankTransfer: { ...DEFAULT_PAYMENT_SETTINGS.bankTransfer, ...data.bankTransfer },
        payoneer: { ...DEFAULT_PAYMENT_SETTINGS.payoneer, ...data.payoneer },
        customGateways: Array.isArray(data.customGateways) ? data.customGateways : DEFAULT_PAYMENT_SETTINGS.customGateways,
        globalCurrency: data.globalCurrency || DEFAULT_PAYMENT_SETTINGS.globalCurrency,
        exchangeRates: { ...DEFAULT_PAYMENT_SETTINGS.exchangeRates, ...data.exchangeRates },
        updatedAt: data.updatedAt
      };
      try {
        localStorage.setItem(PAYMENT_SETTINGS_STORAGE_KEY, JSON.stringify(merged));
      } catch {}
      return merged;
    }
  } catch (err) {
    console.warn("Could not fetch settings/payments from firestore:", err);
  }
  return getCachedPaymentSettings();
}

/**
 * Get cached payment settings from local storage or default
 */
export function getCachedPaymentSettings(): PaymentSettingsData {
  if (typeof window === 'undefined') return DEFAULT_PAYMENT_SETTINGS;
  try {
    const raw = localStorage.getItem(PAYMENT_SETTINGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_PAYMENT_SETTINGS;
}

/**
 * Save payment settings to Firestore 'settings/payments' and sync backups
 */
export async function savePaymentSettings(settings: PaymentSettingsData): Promise<void> {
  const payload = {
    ...settings,
    updatedAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, 'settings', 'payments'), payload, { merge: true });
    
    // Also sync to system_settings/payment_methods for backward compatibility
    await setDoc(doc(db, 'system_settings', 'payment_methods'), {
      bKash: {
        number: settings.bkash.merchantNumber,
        type: settings.bkash.type || 'Personal / Send Money',
        active: settings.bkash.enabled
      },
      nagad: {
        number: settings.nagad.merchantNumber,
        type: settings.nagad.type || 'Personal / Send Money',
        active: settings.nagad.enabled
      },
      rocket: {
        number: settings.rocket.merchantNumber,
        type: settings.rocket.type || 'Personal',
        active: settings.rocket.enabled
      },
      binance: {
        payId: settings.binance.payId,
        active: settings.binance.enabled
      },
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn("Firestore payment settings save warning:", err);
  }

  try {
    localStorage.setItem(PAYMENT_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event('storage'));
  } catch {}
}

/**
 * Currency conversion utility using live settings rates
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = DEFAULT_PAYMENT_SETTINGS.exchangeRates
): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert from source to USD base rate
  const fromRate = rates[fromCurrency] || (fromCurrency === 'BDT' ? 120 : fromCurrency === 'USD' ? 1 : 1);
  const toRate = rates[toCurrency] || (toCurrency === 'BDT' ? 120 : toCurrency === 'USD' ? 1 : 1);

  const amountInUSD = amount / fromRate;
  const result = amountInUSD * toRate;
  return Math.round(result * 100) / 100;
}

/**
 * Format currency with symbol
 */
export function formatCurrencyAmount(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    BDT: '৳',
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    CAD: 'CA$',
    AUD: 'AU$',
    PKR: 'Rs',
    NGN: '₦',
    KES: 'KSh',
    BRL: 'R$'
  };

  const sym = symbols[currency] || currency + ' ';
  if (currency === 'BDT') {
    return `${sym}${Math.round(amount)}`;
  }
  return `${sym}${amount.toFixed(2)}`;
}

export interface ShippingInfo {
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
}

export interface CreateOrderParams {
  productId: string;
  product: Product;
  userId: string;
  userEmail: string;
  userPhone?: string;
  amountBDT: number;
  amountUSD: number;
  paymentMethod: string;
  isAutomated: boolean;
  transactionId?: string;
  senderNumber?: string;
  screenshotUrl?: string | null;
  currencyPaid?: string;
  amountPaid?: number;
  productKind?: 'digital' | 'physical';
  quantity?: number;
  selectedColor?: string;
  selectedSize?: string;
  shippingInfo?: ShippingInfo;
  couponCode?: string;
  discountAmountBDT?: number;
  discountAmountUSD?: number;
}

/**
 * Execute order creation and instant fulfillment if automated
 */
export async function createOrderAndFulfill(params: CreateOrderParams): Promise<{
  orderId: string;
  status: 'completed' | 'pending';
  downloadUrl: string;
  licenseKey: string;
}> {
  const isAutomated = params.isAutomated;
  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const now = new Date().toISOString();
  
  const licenseKey = `FM-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-PRO`;
  const downloadUrl = params.product.instantDownloadLink || 'https://drive.google.com';
  const isPhysical = params.productKind === 'physical' || params.product.productKind === 'physical';

  const orderDocData = {
    orderId: orderId,
    id: orderId,
    productId: params.product.id,
    productTitle: params.product.title,
    productThumbnail: params.product.thumbnail || '',
    productKind: isPhysical ? 'physical' : 'digital',
    category: params.product.category || 'Digital Assets',
    amount: params.amountBDT,
    amountBDT: params.amountBDT,
    amountUSD: params.amountUSD,
    amountPaid: params.amountPaid || params.amountUSD,
    currency: params.currencyPaid || 'USD',
    paymentMethod: params.paymentMethod,
    status: isAutomated ? 'completed' : 'pending',
    statusDisplay: isAutomated ? 'Approved' : 'Pending',
    customerEmail: params.userEmail,
    userEmail: params.userEmail,
    userId: params.userId,
    userPhone: params.userPhone || params.senderNumber || '',
    senderNumber: params.senderNumber || '',
    transactionId: params.transactionId || (isAutomated ? `AUTO-${Date.now().toString(36).toUpperCase()}` : ''),
    trxId: params.transactionId || (isAutomated ? `AUTO-${Date.now().toString(36).toUpperCase()}` : ''),
    proofUrl: params.screenshotUrl || null,
    screenshotUrl: params.screenshotUrl || null,
    downloadUrl: isPhysical ? '' : downloadUrl,
    instantDownloadLink: isPhysical ? '' : downloadUrl,
    licenseKey: isPhysical ? '' : licenseKey,
    quantity: params.quantity || 1,
    selectedColor: params.selectedColor || null,
    selectedSize: params.selectedSize || null,
    shippingInfo: params.shippingInfo || null,
    shippingStatus: isPhysical ? (isAutomated ? 'Processing / Ready to Ship' : 'Order Placed (Pending Payment)') : 'Digital Unlock',
    trackingCarrier: '',
    trackingNumber: '',
    estimatedDelivery: params.product.estimatedDeliveryDays || '2-4 business days',
    couponCode: params.couponCode || null,
    discountAmountBDT: params.discountAmountBDT || 0,
    discountAmountUSD: params.discountAmountUSD || 0,
    createdAt: now,
    approvedAt: isAutomated ? now : null
  };

  // 1. Save to Firestore orders collection
  try {
    await setDoc(doc(db, 'orders', orderId), cleanFirestoreData(orderDocData), { merge: true });
  } catch (err) {
    console.warn("Error creating order in Firestore:", err);
  }

  // 2. Save in Admin service for cross-table sync
  try {
    const adminOrder: AdminOrder = {
      id: orderId,
      userId: params.userId,
      userEmail: params.userEmail,
      userPhone: params.userPhone || params.senderNumber || '',
      senderNumber: params.senderNumber || '',
      productId: params.product.id,
      productTitle: params.product.title,
      productThumbnail: params.product.thumbnail,
      category: params.product.category,
      amount: params.amountBDT,
      amountBDT: params.amountBDT,
      amountUSD: params.amountUSD,
      paymentMethod: params.paymentMethod,
      trxId: params.transactionId || orderDocData.trxId,
      screenshotUrl: params.screenshotUrl,
      status: isAutomated ? 'Approved' : 'Pending',
      statusDisplay: isAutomated ? 'Approved' : 'Pending',
      createdAt: now,
      approvedAt: isAutomated ? now : null
    };
    await saveAdminOrder(adminOrder);
  } catch (err) {
    console.warn("Could not save to admin orders:", err);
  }

  // 3. If automated & digital, instantly grant Cloud Locker access to customer!
  if (isAutomated && !isPhysical) {
    try {
      const item: PurchasedProductItem = {
        id: params.product.id,
        title: params.product.title,
        category: params.product.category || 'Digital Assets',
        image: params.product.thumbnail || '',
        downloadUrl: downloadUrl,
        cloudDriveUrl: downloadUrl,
        licenseKey: licenseKey,
        purchaseDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        priceBdt: params.amountBDT,
        priceUsd: params.amountUSD
      };

      if (params.userId) {
        await addPurchasedProductToUser(params.userId, item);
      }
    } catch (lockerErr) {
      console.warn("Could not grant instant locker access:", lockerErr);
    }
  }

  return {
    orderId,
    status: isAutomated ? 'completed' : 'pending',
    downloadUrl: isPhysical ? '' : downloadUrl,
    licenseKey: isPhysical ? '' : licenseKey
  };
}
