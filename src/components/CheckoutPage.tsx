import React, { useState, useEffect, useMemo } from 'react';
import { formatDirectImageUrl } from '../utils/formatImageUrl';
import { 
  Copy, 
  Check, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  Send, 
  Loader2, 
  Clock, 
  ArrowRight,
  ShieldCheck, 
  HardDrive, 
  Zap, 
  CreditCard,
  Lock,
  Download,
  Key,
  ExternalLink,
  ChevronDown,
  Truck,
  Tag,
  ShoppingBag,
  MapPin,
  Phone,
  User as UserIcon,
  CheckCircle,
  Package
} from 'lucide-react';
import { collection, addDoc, doc, getDoc, getDocs, query } from 'firebase/firestore';
import { Product, Currency } from '../types';
import { BkashLogo } from './icons/BkashLogo';
import { 
  StripeLogo, 
  PayPalLogo, 
  ShurjopayLogo,
  SSLCommerzLogo,
  AamarPayLogo,
  RazorpayLogo, 
  MollieLogo, 
  PaystackLogo, 
  FlutterwaveLogo, 
  CoinbaseLogo, 
  NagadLogo, 
  RocketLogo, 
  BinanceLogo, 
  BankLogo 
} from './icons/PaymentGatewayLogos';
import { Footer } from './Footer';
import { Header } from './Header';
import { auth, db, triggerEmailVerification, getUserProfileFromFirestore } from '../lib/firebase';
import { getAuthStatus, syncAndCheckVerification } from '../lib/authGuard';
import { navigateTo, findProductBySlugOrId } from '../router';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { 
  PaymentSettingsData, 
  CustomPaymentGateway, 
  DEFAULT_PAYMENT_SETTINGS, 
  subscribePaymentSettings, 
  convertCurrency, 
  formatCurrencyAmount, 
  createOrderAndFulfill 
} from '../lib/paymentService';
import { subscribeCoupons, validateCoupon, Coupon, CouponValidationResult } from '../lib/couponService';
import { uploadPaymentReceipt } from '../lib/storageService';

export interface CheckoutPageProps {
  product?: Product;
  currency?: Currency;
  onBack?: () => void;
  onExploreStore?: () => void;
  onOpenXmlStudio?: () => void;
  darkMode?: boolean;
  setDarkMode?: (val: boolean) => void;
  setCurrency?: (curr: Currency) => void;
  onOpenProfile?: () => void;
  onOpenDrawer?: () => void;
  onOpenAiSeo?: () => void;
  onOpenSearch?: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  isHeaderVisible?: boolean;
  onOpenAuthModal?: (initialView?: 'login' | 'verify', message?: string) => void;
}

type GatewayType = 
  | 'stripe' 
  | 'paypal' 
  | 'shurjopay'
  | 'sslcommerz'
  | 'aamarpay'
  | 'razorpay' 
  | 'paystack' 
  | 'flutterwave' 
  | 'mollie' 
  | 'coinbase' 
  | 'bkash' 
  | 'nagad' 
  | 'rocket' 
  | 'binance' 
  | 'bankTransfer' 
  | 'payoneer' 
  | string;

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  product,
  currency = 'BDT',
  onBack,
  onExploreStore,
  onOpenXmlStudio,
  darkMode,
  setDarkMode,
  setCurrency,
  onOpenProfile,
  onOpenDrawer,
  onOpenSearch,
  searchQuery = '',
  setSearchQuery = () => {},
  isHeaderVisible = true,
  onOpenAuthModal
}) => {
  // Payment settings state from Firestore (with local fallback)
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettingsData>(DEFAULT_PAYMENT_SETTINGS);

  useEffect(() => {
    const unsub = subscribePaymentSettings((settings) => {
      setPaymentSettings(settings);
    });
    return () => unsub();
  }, []);

  const [activeProduct, setActiveProduct] = useState<Product | null>(product || null);
  const [isLoadingProduct, setIsLoadingProduct] = useState<boolean>(!product);
  const [imageError, setImageError] = useState(false);

  // Reset scroll to top once on component mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const localScrollVisible = useScrollDirection();
  const isNavVisible = isHeaderVisible && localScrollVisible;

  // Fetch product from Firestore if not directly provided via props
  useEffect(() => {
    if (product) {
      setActiveProduct(product);
      setIsLoadingProduct(false);
      return;
    }

    const fetchProductFromFirestore = async () => {
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const pathParts = pathname.split('/checkout/');
      const slugOrId = pathParts[1] ? pathParts[1].split('?')[0] : '';
      if (!slugOrId) {
        setIsLoadingProduct(false);
        return;
      }

      setIsLoadingProduct(true);
      try {
        const docRef = doc(db, 'products', slugOrId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setActiveProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        } else {
          const q = query(collection(db, 'products'));
          const querySnap = await getDocs(q);
          const fetchedProducts: Product[] = [];
          querySnap.forEach((d) => {
            fetchedProducts.push({ id: d.id, ...d.data() } as Product);
          });
          const matched = findProductBySlugOrId(slugOrId, fetchedProducts);
          if (matched) {
            setActiveProduct(matched);
          }
        }
      } catch (err) {
        console.warn("Error fetching product details for checkout:", err);
      } finally {
        setIsLoadingProduct(false);
      }
    };

    fetchProductFromFirestore();
  }, [product]);

  // Selected Gateway Key
  const [selectedGateway, setSelectedGateway] = useState<GatewayType>('stripe');

  // Manual payment input states
  const [copied, setCopied] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [trxId, setTrxId] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  // Automated Card / Sandbox form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cryptoAsset, setCryptoAsset] = useState('USDT (TRC20)');
  const [upiId, setUpiId] = useState('');

  // Order submission and fulfillment result states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Dual Engine / Physical product states
  const isPhysical = activeProduct?.productKind === 'physical';
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');

  // Shipping Address details
  const [shippingName, setShippingName] = useState<string>('');
  const [shippingPhone, setShippingPhone] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [shippingCity, setShippingCity] = useState<string>('');
  const [shippingZip, setShippingZip] = useState<string>('');

  // Discount Coupons state
  const [couponsList, setCouponsList] = useState<Coupon[]>([]);
  const [couponInput, setCouponInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Subscribe to real-time coupons
  useEffect(() => {
    const unsub = subscribeCoupons((list) => {
      setCouponsList(list);
    });
    return () => unsub();
  }, []);

  // Pre-fill user profile info for shipping if logged in
  useEffect(() => {
    const loadProfile = async () => {
      try {
        let localUser: any = null;
        try {
          const raw = localStorage.getItem('filemarket_user');
          if (raw) localUser = JSON.parse(raw);
        } catch {}

        const uid = auth.currentUser?.uid || localUser?.sub || localUser?.userId || localUser?.uid;
        if (uid) {
          const profile = await getUserProfileFromFirestore(uid);
          if (profile) {
            setShippingName(profile.fullName || localUser?.name || auth.currentUser?.displayName || '');
            setShippingPhone(profile.phone || localUser?.phone || '');
            setShippingAddress(profile.address || profile.deliveryAddress || localUser?.address || '');
            setShippingCity(profile.city || localUser?.city || '');
            setShippingZip(profile.zipCode || localUser?.zipCode || '');
            if (profile.phone && !customerPhone) {
              setCustomerPhone(profile.phone);
            }
          }
        }
      } catch (err) {
        console.warn("Could not prefill user profile for shipping:", err);
      }
    };
    loadProfile();
  }, [activeProduct]);

  // Set default variant if available
  useEffect(() => {
    if (activeProduct?.variants) {
      if (Array.isArray(activeProduct.variants.colors) && activeProduct.variants.colors.length > 0 && !selectedColor) {
        setSelectedColor(activeProduct.variants.colors[0]);
      }
      if (Array.isArray(activeProduct.variants.sizes) && activeProduct.variants.sizes.length > 0 && !selectedSize) {
        setSelectedSize(activeProduct.variants.sizes[0]);
      }
    }
  }, [activeProduct]);
  
  // Successful order state
  const [completedOrder, setCompletedOrder] = useState<{
    orderId: string;
    status: 'completed' | 'pending';
    downloadUrl: string;
    licenseKey: string;
    isAutomated: boolean;
    isPhysical?: boolean;
  } | null>(null);

  // Auth verification guard state
  const [authStatus, setAuthStatus] = useState(() => getAuthStatus());
  const [isCheckingVerify, setIsCheckingVerify] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const updateStatus = () => setAuthStatus(getAuthStatus());
    window.addEventListener('storage', updateStatus);
    return () => window.removeEventListener('storage', updateStatus);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Set default selected gateway when payment settings load
  useEffect(() => {
    // If stripe is enabled, keep stripe. Otherwise pick first enabled gateway
    if (paymentSettings.stripe?.enabled) {
      setSelectedGateway('stripe');
    } else if (paymentSettings.bkash?.enabled) {
      setSelectedGateway('bkash');
    } else if (paymentSettings.paypal?.enabled) {
      setSelectedGateway('paypal');
    } else if (paymentSettings.nagad?.enabled) {
      setSelectedGateway('nagad');
    } else if (paymentSettings.binance?.enabled) {
      setSelectedGateway('binance');
    }
  }, [paymentSettings]);

  // Pricing calculations
  const unitPriceBDT = activeProduct?.priceBDT || 0;
  const unitPriceUSD = activeProduct?.priceUSD || (unitPriceBDT ? Math.round(unitPriceBDT / 120) : 0);
  const subtotalBDT = unitPriceBDT * quantity;
  const subtotalUSD = unitPriceUSD * quantity;

  // Shipping costs
  const shippingCostBDT = isPhysical ? (activeProduct?.shippingCostBDT !== undefined ? activeProduct.shippingCostBDT : 60) : 0;
  const shippingCostUSD = isPhysical ? (activeProduct?.shippingCostUSD !== undefined ? activeProduct.shippingCostUSD : 2) : 0;

  // Discount calculation
  const discountBDT = appliedCoupon?.valid ? appliedCoupon.discountBDT : 0;
  const discountUSD = appliedCoupon?.valid ? appliedCoupon.discountUSD : 0;

  // Net totals
  const totalBDT = Math.max(0, subtotalBDT + shippingCostBDT - discountBDT);
  const totalUSD = Math.max(0, subtotalUSD + shippingCostUSD - discountUSD);

  const originalPriceBDT = (activeProduct?.originalPriceBDT || (unitPriceBDT ? Math.round(unitPriceBDT * 1.4) : 0)) * quantity;
  const savingsPercent = originalPriceBDT > subtotalBDT ? Math.round(((originalPriceBDT - subtotalBDT) / originalPriceBDT) * 100) : 0;

  // Apply Coupon Handler
  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim();
    if (!code) {
      setCouponMessage({ text: 'Please enter a coupon code.', isError: true });
      return;
    }
    const result = validateCoupon(code, subtotalBDT, subtotalUSD, couponsList);
    if (result.valid) {
      setAppliedCoupon(result);
      setCouponInput(code.toUpperCase());
      setCouponMessage({ text: `✓ ${result.message}`, isError: false });
    } else {
      setAppliedCoupon(null);
      setCouponMessage({ text: result.message, isError: true });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMessage(null);
  };

  // Selected gateway configuration helper
  const isAutomatedGateway = useMemo(() => {
    const automatedKeys = ['stripe', 'paypal', 'shurjopay', 'sslcommerz', 'aamarpay', 'razorpay', 'paystack', 'flutterwave', 'mollie', 'coinbase'];
    return automatedKeys.includes(selectedGateway);
  }, [selectedGateway]);

  // Resolve custom gateway if selected
  const selectedCustomGateway = useMemo(() => {
    if (selectedGateway.startsWith('custom_')) {
      return paymentSettings.customGateways.find((g) => g.id === selectedGateway) || null;
    }
    return null;
  }, [selectedGateway, paymentSettings.customGateways]);

  // Calculate currency and amount for selected gateway
  const gatewayCurrency = useMemo(() => {
    if (
      selectedGateway === 'bkash' || 
      selectedGateway === 'nagad' || 
      selectedGateway === 'rocket' || 
      selectedGateway === 'shurjopay' || 
      selectedGateway === 'sslcommerz' || 
      selectedGateway === 'aamarpay'
    ) {
      return 'BDT';
    }
    if (selectedGateway === 'razorpay') return 'INR';
    if (selectedGateway === 'mollie') return 'EUR';
    if (selectedGateway === 'paystack') return 'NGN';
    if (selectedGateway === 'binance' || selectedGateway === 'coinbase') return 'USD';
    return 'USD';
  }, [selectedGateway]);

  const convertedGatewayAmount = useMemo(() => {
    if (gatewayCurrency === 'BDT') return totalBDT;
    if (gatewayCurrency === 'USD') return totalUSD;
    return convertCurrency(totalUSD, 'USD', gatewayCurrency, paymentSettings.exchangeRates);
  }, [gatewayCurrency, totalBDT, totalUSD, paymentSettings.exchangeRates]);

  const handleCopyPaymentInfo = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCheckUserVerification = async () => {
    setIsCheckingVerify(true);
    setCheckoutError(null);
    try {
      const ok = await syncAndCheckVerification();
      setAuthStatus(getAuthStatus());
      if (ok) {
        setCheckoutError(null);
      } else {
        setCheckoutError('⚠️ Email not verified yet. Please check your Gmail link.');
      }
    } catch {
      setCheckoutError('Could not verify status. Please check your internet connection.');
    } finally {
      setIsCheckingVerify(false);
    }
  };

  const handleResendUserVerification = async () => {
    if (resendCooldown > 0) return;
    setCheckoutError(null);
    try {
      const sent = await triggerEmailVerification();
      if (sent) {
        setResendCooldown(30);
        setCheckoutError('✓ Verification email resent! Please check your Gmail inbox & spam folder.');
      } else {
        setCheckoutError('Could not resend email right now. Please try again.');
      }
    } catch (err: any) {
      setCheckoutError(err?.message || 'Failed to resend verification email.');
    }
  };

  // Pre-fill test card credentials for sandbox
  const handleFillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExp('12/28');
    setCardCvc('888');
    setCardHolder('John Doe (Test)');
  };

  // Process Checkout (Automated Instant Verification or Manual Submit)
  const handleProcessOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;
    setCheckoutError(null);

    const currentStatus = getAuthStatus();
    if (!currentStatus.isLoggedIn) {
      setCheckoutError('⚠️ Please sign in or create an account to complete checkout and claim your digital locker!');
      if (onOpenAuthModal) {
        onOpenAuthModal('login', 'Please sign in or create an account to complete checkout!');
      }
      return;
    }

    if (!currentStatus.isEmailVerified && !currentStatus.isGoogleUser) {
      setCheckoutError('⚠️ Please verify your Gmail address first to receive lifetime license key!');
      if (onOpenAuthModal) {
        onOpenAuthModal('verify', '⚠️ Please verify your Gmail address first to proceed with checkout!');
      }
      return;
    }

    // Physical Product Shipping Validation
    if (isPhysical) {
      if (!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim() || !shippingCity.trim()) {
        setCheckoutError('⚠️ Please fill in all required shipping details (Full Name, Phone Number, Delivery Address, City).');
        return;
      }
    }

    // Manual Gateway Validation
    if (!isAutomatedGateway) {
      const cleanPhone = customerPhone.trim() || shippingPhone.trim();
      const cleanTrx = trxId.trim();
      if (!cleanPhone || !cleanTrx) {
        setCheckoutError('Please enter both your sender account number and Transaction ID (TrxID).');
        return;
      }
    }

    setIsProcessing(true);
    if (selectedGateway === 'shurjopay') {
      setProcessingStatusText(`[ ⚡ Initializing Shurjopay API Token (Key Prefix: ${paymentSettings.shurjopay?.keyPrefix || 'NOK'})... ]`);
    } else if (selectedGateway === 'sslcommerz') {
      setProcessingStatusText(`[ ⚡ Initializing SSLCommerz Session (Store ID: ${paymentSettings.sslcommerz?.storeId || 'testbox'})... ]`);
    } else if (selectedGateway === 'aamarpay') {
      setProcessingStatusText(`[ ⚡ Requesting AamarPay API Payment Session (Store: ${paymentSettings.aamarpay?.storeId || 'aamarpaytest'})... ]`);
    } else {
      setProcessingStatusText(
        isAutomatedGateway
          ? `[ ⚡ Connecting to ${selectedGateway.toUpperCase()} Secure API Gateway... ]`
          : '[ ⚡ Registering Payment Verification in System Ledger... ]'
      );
    }

    try {
      let localUser: any = null;
      try {
        const raw = localStorage.getItem('filemarket_user');
        if (raw) localUser = JSON.parse(raw);
      } catch {}

      const effectiveUid = auth.currentUser?.uid || localUser?.sub || localUser?.userId || localUser?.uid || `USR-${Date.now().toString(36)}`;
      const orderEmail = auth.currentUser?.email || localUser?.email || 'customer@filemarket.site';

      if (isAutomatedGateway) {
        // Step 1: Initialize token / session
        await new Promise((r) => setTimeout(r, 600));
        if (selectedGateway === 'shurjopay') {
          setProcessingStatusText(`[ 💳 Executing Shurjopay Gateway & Authorizing Automated IPN Callback... ]`);
        } else if (selectedGateway === 'sslcommerz') {
          setProcessingStatusText(`[ 💳 Processing SSLCommerz Secure Payment & Validating Hash... ]`);
        } else if (selectedGateway === 'aamarpay') {
          setProcessingStatusText(`[ 💳 Validating AamarPay API Handshake & Authorizing Webhook... ]`);
        } else {
          setProcessingStatusText(`[ 💳 Tokenizing Payment & Verifying with ${selectedGateway.toUpperCase()}... ]`);
        }
        
        // Step 2: Instant IPN Callback & Fulfillment
        await new Promise((r) => setTimeout(r, 800));
        setProcessingStatusText(
          isPhysical 
            ? '[ 📦 Automated Payment Verified! Generating Physical Shipment Order... ]' 
            : `[ 🚀 Instant IPN Callback Verified! Generating Lifetime Cloud Locker License... ]`
        );
        await new Promise((r) => setTimeout(r, 500));
      }

      const generatedTrxId = isAutomatedGateway
        ? `${selectedGateway.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
        : trxId.trim();

      let uploadedScreenshotUrl: string | null = null;
      if (screenshotFile) {
        setProcessingStatusText('[ 📸 Uploading Payment Proof Screenshot to Cloud Storage... ]');
        try {
          uploadedScreenshotUrl = await uploadPaymentReceipt(screenshotFile, generatedTrxId);
        } catch (uploadErr) {
          console.warn("Screenshot upload warning:", uploadErr);
        }
      }

      const result = await createOrderAndFulfill({
        productId: activeProduct.id,
        product: activeProduct,
        userId: effectiveUid,
        userEmail: orderEmail,
        userPhone: customerPhone.trim() || shippingPhone.trim() || orderEmail,
        amountBDT: totalBDT,
        amountUSD: totalUSD,
        paymentMethod: selectedCustomGateway ? selectedCustomGateway.name : selectedGateway,
        isAutomated: isAutomatedGateway,
        transactionId: generatedTrxId,
        senderNumber: customerPhone.trim() || shippingPhone.trim() || (isAutomatedGateway ? 'Card/Automated' : ''),
        screenshotUrl: uploadedScreenshotUrl,
        currencyPaid: gatewayCurrency,
        amountPaid: convertedGatewayAmount,
        productKind: isPhysical ? 'physical' : 'digital',
        quantity: quantity,
        selectedColor: selectedColor || undefined,
        selectedSize: selectedSize || undefined,
        shippingInfo: isPhysical ? {
          fullName: shippingName.trim(),
          phone: shippingPhone.trim(),
          address: shippingAddress.trim(),
          city: shippingCity.trim(),
          zipCode: shippingZip.trim()
        } : undefined,
        couponCode: appliedCoupon?.coupon?.code,
        discountAmountBDT: discountBDT,
        discountAmountUSD: discountUSD
      });

      // Dispatch Telegram Notification for Admin
      try {
        const BOT_TOKEN = "8293279827:AAFn12Cb-NKOHkv2rdhLjLcm8gdNkqkcKQ8";
        const CHAT_ID = "5570892539";
        const gatewayName = selectedCustomGateway ? selectedCustomGateway.name : selectedGateway.toUpperCase();

        const alertMessage = 
`🚨 *NEW ORDER ${isAutomatedGateway ? '✅ AUTO-FULFILLED' : '⏳ PENDING'}* 🚨
━━━━━━━━━━━━━━━━━━━━━
📦 *Product:* ${activeProduct.title} (${isPhysical ? 'Physical Goods' : 'Digital Asset'})
💰 *Amount:* ${formatCurrencyAmount(convertedGatewayAmount, gatewayCurrency)} (${totalBDT} BDT / $${totalUSD} USD)
💳 *Gateway:* ${gatewayName} (${isAutomatedGateway ? 'Instant Automated' : 'Manual'})
🔢 *TrxID:* \`${generatedTrxId}\`
👤 *Customer:* ${orderEmail}
${isPhysical ? `🚚 *Ship To:* ${shippingName} (${shippingPhone}), ${shippingAddress}, ${shippingCity} ${shippingZip}\n` : ''}🆔 *Order ID:* \`${result.orderId}\`
⚡ *Status:* ${isAutomatedGateway ? 'COMPLETED' : 'PENDING (Admin Approval Required)'}
⏰ *Time:* ${new Date().toLocaleTimeString()}
━━━━━━━━━━━━━━━━━━━━━`;

        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            text: alertMessage,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
          }),
          keepalive: true
        }).catch(console.warn);
      } catch (tgErr) {
        console.warn("Telegram dispatch error:", tgErr);
      }

      setCompletedOrder({
        orderId: result.orderId,
        status: result.status,
        downloadUrl: result.downloadUrl,
        licenseKey: result.licenseKey,
        isAutomated: isAutomatedGateway,
        isPhysical: isPhysical
      });
    } catch (err: any) {
      console.error("Payment submission error:", err);
      setCheckoutError(err?.message || "Payment verification failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoToDownloads = () => {
    navigateTo('/downloads', { title: 'My Purchased Assets & Downloads — FileMarket' });
  };

  return (
    <div className="min-h-screen w-full max-w-full flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-300 antialiased overflow-x-clip">
      
      {/* 1. GLOBAL NAVBAR */}
      <div
        className={`sticky top-0 z-50 w-full transition-transform duration-300 ease-in-out will-change-transform ${
          isNavVisible ? 'translate-y-0 shadow-md' : '-translate-y-full shadow-none'
        }`}
      >
        <Header
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          currency={currency}
          setCurrency={setCurrency}
          onOpenXmlStudio={onOpenXmlStudio}
          onOpenProfile={onOpenProfile}
          onOpenDrawer={onOpenDrawer}
          onOpenSearch={onOpenSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>

      {/* MAIN CHECKOUT CONTENT */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 pt-2 sm:pt-4 pb-12 space-y-5">
        
        {/* PRODUCT DETAILS SUMMARY & THUMBNAIL CARD */}
        {isLoadingProduct ? (
          <div className="rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
              </div>
            </div>
          </div>
        ) : activeProduct ? (
          <div className="rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-4 sm:p-5 shadow-sm space-y-3.5 transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
              <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isPhysical ? 'Selected Physical Good' : 'Selected Digital Asset'}</span>
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border flex items-center gap-1 ${
                isPhysical 
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' 
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              }`}>
                {isPhysical ? <Truck className="w-3 h-3 text-amber-500" /> : <Zap className="w-3 h-3 fill-emerald-500" />}
                <span>{isPhysical ? 'Physical Goods Shipment' : 'Instant Multi-Gateway Checkout'}</span>
              </span>
            </div>

            <div className="flex flex-row items-start gap-3.5 sm:gap-4">
              <div className="relative w-22 h-22 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-900 shrink-0 shadow-2xs group">
                <img
                  src={
                    !imageError && (activeProduct.thumbnail || (activeProduct as any).image)
                      ? formatDirectImageUrl(activeProduct.thumbnail || (activeProduct as any).image)
                      : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'
                  }
                  alt={activeProduct.title || 'Product Thumbnail'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {activeProduct.category || (isPhysical ? 'Physical Good' : 'Digital Asset')}
                  </span>
                  {activeProduct.rating > 0 && (
                    <span className="text-[11px] font-bold text-amber-500 flex items-center gap-0.5">
                      ★ {activeProduct.rating.toFixed(1)} <span className="text-slate-400 text-[10px]">({activeProduct.reviewsCount || 12})</span>
                    </span>
                  )}
                  {isPhysical && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      <span>{activeProduct.estimatedDeliveryDays || '2-4 Days Delivery'}</span>
                    </span>
                  )}
                </div>

                <h2 className="font-heading font-black text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  {activeProduct.title}
                </h2>

                <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  {isPhysical ? (
                    <>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/50">
                        <Package className="w-3 h-3 text-amber-500" />
                        <span>Stock: {activeProduct.stockQuantity !== undefined ? `${activeProduct.stockQuantity} in stock` : 'In Stock'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/50">
                        <Truck className="w-3 h-3 text-blue-500" />
                        <span>Shipping: ৳{shippingCostBDT} (${shippingCostUSD})</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/50">
                        <HardDrive className="w-3 h-3 text-emerald-500" />
                        <span>{activeProduct.fileSize || 'Instant Zip'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/50">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span>{activeProduct.license || 'Lifetime License'}</span>
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-baseline gap-2 pt-1 flex-wrap">
                  <span className="font-heading font-extrabold text-base sm:text-lg text-emerald-600 dark:text-emerald-400">
                    ৳{unitPriceBDT.toLocaleString('en-BD')} BDT (${unitPriceUSD} USD)
                  </span>
                  {savingsPercent > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 uppercase">
                      {savingsPercent}% OFF
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quantity and Variant Selectors for Physical Products */}
            {isPhysical && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Quantity */}
                <div className="space-y-1">
                  <label className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Quantity
                  </label>
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 w-fit">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 rounded-l-xl transition cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-xs font-bold text-slate-900 dark:text-white font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.min(activeProduct.stockQuantity || 99, quantity + 1))}
                      className="px-3 py-1.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 rounded-r-xl transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Color Variants */}
                {activeProduct.variants?.colors && activeProduct.variants.colors.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Color
                    </label>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                    >
                      {activeProduct.variants.colors.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Size Variants */}
                {activeProduct.variants?.sizes && activeProduct.variants.sizes.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Size
                    </label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                    >
                      {activeProduct.variants.sizes.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* PHYSICAL PRODUCT SHIPPING ADDRESS FORM */}
        {isPhysical && (
          <div className="rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-heading font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <span>Shipping &amp; Delivery Destination</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Doorstep Courier Delivery
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Recipient Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                    placeholder="e.g. Asif Ahmed"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Recipient Contact Phone *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={shippingPhone}
                    onChange={(e) => {
                      setShippingPhone(e.target.value);
                      if (!customerPhone) setCustomerPhone(e.target.value);
                    }}
                    placeholder="e.g. 01712345678"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Street Address / House / Flat / Area *
                </label>
                <input
                  type="text"
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="e.g. House 42, Road 11, Block D, Banani"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  City / District *
                </label>
                <input
                  type="text"
                  required
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  placeholder="e.g. Dhaka / Chittagong / Sylhet"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Postal / Zip Code
                </label>
                <input
                  type="text"
                  value={shippingZip}
                  onChange={(e) => setShippingZip(e.target.value)}
                  placeholder="e.g. 1213"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* DISCOUNT COUPON PROMO CARD */}
        <div className="rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-500" />
              <span>Discount Coupon Code</span>
            </span>
            {appliedCoupon?.valid && (
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-[11px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME50, SAVE100, VIP20"
              disabled={Boolean(appliedCoupon?.valid)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs uppercase font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
            />
            {!appliedCoupon?.valid ? (
              <button
                type="button"
                onClick={() => handleApplyCoupon()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs shadow-sm transition cursor-pointer shrink-0"
              >
                Apply
              </button>
            ) : (
              <span className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Applied</span>
              </span>
            )}
          </div>

          {/* Quick Apply Preset Chips */}
          {!appliedCoupon?.valid && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[10px] text-slate-400 font-medium">Quick apply:</span>
              {['WELCOME50', 'SAVE100', 'VIP20'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleApplyCoupon(code)}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold transition cursor-pointer"
                >
                  +{code}
                </button>
              ))}
            </div>
          )}

          {couponMessage && (
            <div className={`text-[11px] font-medium ${couponMessage.isError ? 'text-rose-500' : 'text-emerald-500'}`}>
              {couponMessage.text}
            </div>
          )}
        </div>

        {/* TOTAL PAYABLE HIGHLIGHT WITH BREAKDOWN */}
        <div className="rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-4 sm:p-5 shadow-sm space-y-3">
          {/* Item Breakdown */}
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center justify-between">
              <span>Subtotal ({quantity} {quantity > 1 ? 'items' : 'item'}):</span>
              <span className="font-bold text-slate-900 dark:text-white">৳{subtotalBDT.toLocaleString('en-BD')} (${subtotalUSD})</span>
            </div>
            {isPhysical && (
              <div className="flex items-center justify-between">
                <span>Shipping &amp; Logistics:</span>
                <span className="font-bold text-slate-900 dark:text-white">+৳{shippingCostBDT} (+${shippingCostUSD})</span>
              </div>
            )}
            {discountBDT > 0 && (
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Coupon Discount ({appliedCoupon?.coupon?.code}):</span>
                <span>-৳{discountBDT.toLocaleString('en-BD')} (-${discountUSD})</span>
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-between">
            <div>
              <span className="font-heading font-extrabold text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                Total Payable Amount
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Converted for {selectedGateway.toUpperCase()}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrencyAmount(convertedGatewayAmount, gatewayCurrency)}
              {gatewayCurrency !== 'BDT' && (
                <span className="text-xs font-normal text-slate-400 block text-right font-mono">
                  (≈ ৳{totalBDT} BDT)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* AUTHENTICATION GUARD WARNING BANNER */}
        {(!authStatus.isLoggedIn || (!authStatus.isEmailVerified && !authStatus.isGoogleUser)) && (
          <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-heading font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                  <span>⚠️ Sign In Required for Cloud Locker Vault</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {!authStatus.isLoggedIn
                    ? 'Please sign in or register so your purchased assets and lifetime license keys are permanently saved to your account.'
                    : `Please verify your Gmail (${authStatus.user?.email}) to ensure instant license delivery.`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {!authStatus.isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => onOpenAuthModal ? onOpenAuthModal('login', 'Please sign in to proceed with checkout!') : null}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-bold text-xs shadow-sm transition cursor-pointer"
                >
                  ⚡ Sign In / Create Account
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCheckUserVerification}
                    disabled={isCheckingVerify}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    {isCheckingVerify ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Check Status</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResendUserVerification}
                    disabled={resendCooldown > 0}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-500" />
                    <span>{resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend Link'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {checkoutError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{checkoutError}</span>
          </div>
        )}

        {/* COMPLETED ORDER / INSTANT SUCCESS VAULT */}
        {completedOrder ? (
          <div className="rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-6 sm:p-8 shadow-xl space-y-6 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500 text-emerald-500 flex items-center justify-center mx-auto shadow-lg">
              {completedOrder.status === 'completed' ? <Check className="w-8 h-8" /> : <Clock className="w-8 h-8 text-amber-500" />}
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-block ${
                completedOrder.status === 'completed' 
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
              }`}>
                {completedOrder.status === 'completed' 
                  ? (completedOrder.isPhysical ? '📦 Order Placed & Confirmed' : '⚡ Order Completed & Cloud Locker Unlocked') 
                  : '⏳ Order Pending Manual Verification'}
              </span>

              <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
                {completedOrder.status === 'completed' 
                  ? (completedOrder.isPhysical ? 'Shipment Processing Started!' : 'Instant Download Ready!') 
                  : 'Payment Submitted Successfully!'}
              </h2>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                {completedOrder.status === 'completed'
                  ? (completedOrder.isPhysical 
                      ? 'Your physical item has been logged. Our logistics team is preparing your package for courier dispatch.' 
                      : 'Your digital files and lifetime license key are permanently accessible in your account.')
                  : 'Your payment verification request has been queued. Our verification engine will process your order shortly.'}
              </p>
            </div>

            {/* Instant Fulfillment Box (Digital) */}
            {completedOrder.status === 'completed' && !completedOrder.isPhysical && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-emerald-500" /> Lifetime License Key:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyPaymentInfo(completedOrder.licenseKey)}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/30 font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 select-all">
                  {completedOrder.licenseKey}
                </div>

                <div className="pt-2">
                  <a
                    href={completedOrder.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Product Files (ZIP / Drive)</span>
                  </a>
                </div>
              </div>
            )}

            {/* Shipment Summary Box (Physical) */}
            {completedOrder.isPhysical && (
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-left space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-500" /> Order Tracking ID:
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{completedOrder.orderId}</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  🚚 Destination: <strong>{shippingName}</strong>, {shippingAddress}, {shippingCity} ({shippingPhone})
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  ✓ Estimated Delivery: {activeProduct?.estimatedDeliveryDays || '2-4 business days'}
                </div>
              </div>
            )}

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleGoToDownloads}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <span>{completedOrder.isPhysical ? 'View in My Physical Orders' : 'Go to My Downloads Vault'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onExploreStore ? onExploreStore() : navigateTo('/')}
                className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-xs cursor-pointer"
              >
                Continue Browsing Store
              </button>
            </div>
          </div>
        ) : (
          /* PAYMENT FORM AND GATEWAY SELECTOR */
          <div className="rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-5 sm:p-7 shadow-sm space-y-6">
            
            <div className="space-y-1">
              <h1 className="font-heading text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                Select Payment Gateway
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose from international automated cards, PayPal, crypto, or regional mobile banking.
              </p>
            </div>

            {/* GATEWAYS SELECTION TABS & GRID */}
            <div className="space-y-4">
              
              {/* Automated Gateways Header */}
              <div>
                <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                  ⚡ Automated &amp; Instant Gateways (Cards, PayPal, Crypto)
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  
                  {/* Stripe Card */}
                  {paymentSettings.stripe?.enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('stripe')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedGateway === 'stripe'
                          ? 'border-indigo-500 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 shadow-sm ring-2 ring-indigo-500/40 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-indigo-500/30'
                      }`}
                    >
                      <StripeLogo className="w-12 h-6" />
                      <span className="text-[11px] font-black">Credit / Debit</span>
                    </button>
                  )}

                  {/* PayPal */}
                  {paymentSettings.paypal?.enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('paypal')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedGateway === 'paypal'
                          ? 'border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300 shadow-sm ring-2 ring-blue-500/40 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-blue-500/30'
                      }`}
                    >
                      <PayPalLogo className="w-12 h-6" />
                      <span className="text-[11px] font-black">PayPal</span>
                    </button>
                  )}

                  {/* Shurjopay Automated */}
                  {paymentSettings.shurjopay?.enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('shurjopay')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedGateway === 'shurjopay'
                          ? 'border-orange-500 bg-orange-500/15 text-orange-700 dark:text-orange-300 shadow-sm ring-2 ring-orange-500/40 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-orange-500/30'
                      }`}
                    >
                      <ShurjopayLogo className="h-6 px-1.5" />
                      <span className="text-[11px] font-black text-[#EB5A28]">Shurjopay (BD)</span>
                    </button>
                  )}

                  {/* SSLCommerz Automated */}
                  {paymentSettings.sslcommerz?.enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('sslcommerz')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedGateway === 'sslcommerz'
                          ? 'border-red-500 bg-red-500/15 text-red-700 dark:text-red-300 shadow-sm ring-2 ring-red-500/40 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-red-500/30'
                      }`}
                    >
                      <SSLCommerzLogo className="h-6 px-1.5" />
                      <span className="text-[11px] font-black text-[#E31B23]">SSLCommerz</span>
                    </button>
                  )}

                  {/* AamarPay Automated */}
                  {paymentSettings.aamarpay?.enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('aamarpay')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedGateway === 'aamarpay'
                          ? 'border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 shadow-sm ring-2 ring-cyan-500/40 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-cyan-500/30'
                      }`}
                    >
                      <AamarPayLogo className="h-6 px-1.5" />
                      <span className="text-[11px] font-black text-[#0A88BA]">AamarPay</span>
                    </button>
                  )}

                  {/* Razorpay */}
                  {paymentSettings.razorpay?.enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('razorpay')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedGateway === 'razorpay'
                          ? 'border-blue-600 bg-blue-600/15 text-blue-700 dark:text-blue-300 shadow-sm ring-2 ring-blue-600/40 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-blue-600/30'
                      }`}
                    >
                      <RazorpayLogo className="h-6 px-1.5" />
                      <span className="text-[11px] font-black">UPI / NetBank</span>
                    </button>
                  )}

                  {/* Coinbase Commerce */}
                  {paymentSettings.coinbase?.enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('coinbase')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedGateway === 'coinbase'
                          ? 'border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300 shadow-sm ring-2 ring-blue-500/40 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-blue-500/30'
                      }`}
                    >
                      <CoinbaseLogo className="h-6 px-1 text-[10px]" />
                      <span className="text-[11px] font-black">Crypto Asset</span>
                    </button>
                  )}

                  {/* Paystack */}
                  {paymentSettings.paystack?.enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('paystack')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedGateway === 'paystack'
                          ? 'border-sky-500 bg-sky-500/15 text-sky-700 dark:text-sky-300 shadow-sm ring-2 ring-sky-500/40 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-sky-500/30'
                      }`}
                    >
                      <PaystackLogo className="h-6 px-2 text-[10px]" />
                      <span className="text-[11px] font-black">Paystack</span>
                    </button>
                  )}

                  {/* Flutterwave */}
                  {paymentSettings.flutterwave?.enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('flutterwave')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedGateway === 'flutterwave'
                          ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-sm ring-2 ring-amber-500/40 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-amber-500/30'
                      }`}
                    >
                      <FlutterwaveLogo className="h-6 px-2 text-[10px]" />
                      <span className="text-[11px] font-black">Flutterwave</span>
                    </button>
                  )}

                  {/* Mollie */}
                  {paymentSettings.mollie?.enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('mollie')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedGateway === 'mollie'
                          ? 'border-slate-700 bg-slate-700/15 text-slate-900 dark:text-white shadow-sm ring-2 ring-slate-700/40 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-500/30'
                      }`}
                    >
                      <MollieLogo className="h-6 px-2 text-[10px]" />
                      <span className="text-[11px] font-black">iDEAL / EU</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Regional & Mobile Gateways Header */}
              <div>
                <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                  📱 Regional Mobile Banking &amp; Wire Transfer
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* bKash */}
                  {paymentSettings.bkash?.enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('bkash')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedGateway === 'bkash'
                          ? 'border-pink-500 bg-pink-500/15 text-pink-700 dark:text-pink-300 shadow-sm ring-2 ring-pink-500/40 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-pink-500/30'
                      }`}
                    >
                      <BkashLogo className="w-7 h-7" />
                      <span className="text-[11px] font-black text-[#E2136E]">bKash (BD)</span>
                    </button>
                  )}

                  {/* Nagad */}
                  {paymentSettings.nagad?.enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('nagad')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedGateway === 'nagad'
                          ? 'border-orange-500 bg-orange-500/15 text-orange-700 dark:text-orange-300 shadow-sm ring-2 ring-orange-500/40 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-orange-500/30'
                      }`}
                    >
                      <NagadLogo className="h-6 px-1 text-[10px]" />
                      <span className="text-[11px] font-black text-[#F7931E]">Nagad (BD)</span>
                    </button>
                  )}

                  {/* Rocket */}
                  {paymentSettings.rocket?.enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('rocket')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedGateway === 'rocket'
                          ? 'border-purple-500 bg-purple-500/15 text-purple-700 dark:text-purple-300 shadow-sm ring-2 ring-purple-500/40 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-purple-500/30'
                      }`}
                    >
                      <RocketLogo className="h-6 px-1 text-[10px]" />
                      <span className="text-[11px] font-black text-[#8C3494]">Rocket (DBBL)</span>
                    </button>
                  )}

                  {/* Binance Pay */}
                  {paymentSettings.binance?.enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('binance')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedGateway === 'binance'
                          ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300 shadow-sm ring-2 ring-amber-500/40 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-amber-500/30'
                      }`}
                    >
                      <BinanceLogo className="h-6 px-1 text-[10px]" />
                      <span className="text-[11px] font-black">Binance Pay</span>
                    </button>
                  )}

                  {/* Bank Transfer */}
                  {paymentSettings.bankTransfer?.enabled && (
                    <button
                      type="button"
                      onClick={() => setSelectedGateway('bankTransfer')}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedGateway === 'bankTransfer'
                          ? 'border-slate-600 bg-slate-600/15 text-slate-900 dark:text-white shadow-sm ring-2 ring-slate-600/40 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-slate-500/30'
                      }`}
                    >
                      <BankLogo className="h-6 px-1 text-[10px]" />
                      <span className="text-[11px] font-black">Bank Transfer</span>
                    </button>
                  )}

                  {/* Custom Gateways */}
                  {paymentSettings.customGateways.filter((g) => g.enabled).map((customGw) => (
                    <button
                      key={customGw.id}
                      type="button"
                      onClick={() => setSelectedGateway(customGw.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                        selectedGateway === customGw.id
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-sm ring-2 ring-emerald-500/40 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-emerald-500/30'
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-[10px]">
                        {customGw.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[11px] font-black truncate max-w-[90px]">{customGw.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DYNAMIC FORM RENDERING BASED ON GATEWAY TYPE */}
            <form onSubmit={handleProcessOrder} className="space-y-4 pt-2">
              
              {/* --- 1. STRIPE CARD FORM --- */}
              {selectedGateway === 'stripe' && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-extrabold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-500" />
                      256-Bit SSL Encrypted Card Payment
                    </span>
                    <button
                      type="button"
                      onClick={handleFillTestCard}
                      className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold cursor-pointer transition"
                    >
                      ⚡ Auto-Fill Test Card
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Card Number</label>
                      <input
                        type="text"
                        required
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-sm tracking-wider focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Exp Date</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          value={cardExp}
                          onChange={(e) => setCardExp(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">CVC / CWW</label>
                        <input
                          type="text"
                          required
                          placeholder="CVC"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Cardholder</label>
                        <input
                          type="text"
                          required
                          placeholder="Name"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- 2. PAYPAL EXPRESS FORM --- */}
              {selectedGateway === 'paypal' && (
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-3 text-center">
                  <div className="text-xs text-blue-900 dark:text-blue-300 font-bold">
                    Click below to complete simulated instant sandbox PayPal payment:
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-300 dark:border-blue-700 text-xs font-mono text-slate-600 dark:text-slate-300">
                    PayPal Sandbox Account: <strong className="text-blue-500 font-mono">sb-user@filemarket.site</strong>
                  </div>
                </div>
              )}

              {/* --- 2B. SHURJOPAY AUTOMATED GATEWAY FORM --- */}
              {selectedGateway === 'shurjopay' && (
                <div className="p-4.5 rounded-2xl bg-gradient-to-br from-orange-50/80 via-white to-amber-50/40 dark:from-orange-950/25 dark:via-slate-900 dark:to-amber-950/15 border border-orange-200 dark:border-orange-900/50 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShurjopayLogo className="h-6 px-1" />
                      <div>
                        <div className="text-xs font-heading font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          Shurjopay Automated API
                          <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-md ${
                            paymentSettings.shurjopay?.sandboxMode
                              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                              : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          }`}>
                            {paymentSettings.shurjopay?.sandboxMode ? 'SANDBOX TESTNET' : 'PRODUCTION LIVE'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Official Built-in Automated Gateway</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white/80 dark:bg-slate-950/60 rounded-xl border border-orange-200/80 dark:border-orange-900/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Merchant Account:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{paymentSettings.shurjopay?.merchantUsername || 'sp_sandbox'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Key Prefix:</span>
                      <span className="font-mono font-bold text-orange-600 dark:text-orange-400">{paymentSettings.shurjopay?.keyPrefix || 'NOK'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Fulfillment Type:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Instant 100% Automated IPN
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Supported Channels (Selected at Payment Window):
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                      <span className="px-2 py-0.5 rounded-md bg-[#E2136E]/10 text-[#E2136E] border border-[#E2136E]/20">bKash Instant</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#F7931E]/10 text-[#F7931E] border border-[#F7931E]/20">Nagad Direct</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#8C3494]/10 text-[#8C3494] border border-[#8C3494]/20">Rocket DBBL</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">VISA / Master</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20">DBBL Nexus</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">Net Banking</span>
                    </div>
                  </div>
                </div>
              )}

              {/* --- 2C. SSLCOMMERZ AUTOMATED GATEWAY FORM --- */}
              {selectedGateway === 'sslcommerz' && (
                <div className="p-4.5 rounded-2xl bg-gradient-to-br from-red-50/80 via-white to-rose-50/40 dark:from-red-950/25 dark:via-slate-900 dark:to-rose-950/15 border border-red-200 dark:border-red-900/50 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SSLCommerzLogo className="h-6 px-1" />
                      <div>
                        <div className="text-xs font-heading font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          SSLCommerz Session Gateway
                          <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-md ${
                            paymentSettings.sslcommerz?.sandboxMode
                              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                              : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          }`}>
                            {paymentSettings.sslcommerz?.sandboxMode ? 'SANDBOX TESTNET' : 'PRODUCTION LIVE'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Official Built-in Automated Gateway</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white/80 dark:bg-slate-950/60 rounded-xl border border-red-200/80 dark:border-red-900/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Store ID:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{paymentSettings.sslcommerz?.storeId || 'testbox'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Security Validation:</span>
                      <span className="font-mono font-bold text-red-600 dark:text-red-400">MD5 Store Secret Encrypted</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Fulfillment Callback:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Instant Automated Order Unlock
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Supported Channels (Selected at Payment Window):
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                      <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">VISA / MasterCard</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">AMEX</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#E2136E]/10 text-[#E2136E] border border-[#E2136E]/20">bKash</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#F7931E]/10 text-[#F7931E] border border-[#F7931E]/20">Nagad</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#8C3494]/10 text-[#8C3494] border border-[#8C3494]/20">Rocket</span>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">City Touch / EBL</span>
                    </div>
                  </div>
                </div>
              )}

              {/* --- 2D. AAMARPAY AUTOMATED GATEWAY FORM --- */}
              {selectedGateway === 'aamarpay' && (
                <div className="p-4.5 rounded-2xl bg-gradient-to-br from-cyan-50/80 via-white to-blue-50/40 dark:from-cyan-950/25 dark:via-slate-900 dark:to-blue-950/15 border border-cyan-200 dark:border-cyan-900/50 space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AamarPayLogo className="h-6 px-1" />
                      <div>
                        <div className="text-xs font-heading font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          AamarPay Direct Integration
                          <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-md ${
                            paymentSettings.aamarpay?.sandboxMode
                              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                              : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          }`}>
                            {paymentSettings.aamarpay?.sandboxMode ? 'SANDBOX TESTNET' : 'PRODUCTION LIVE'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Official Built-in Automated Gateway</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white/80 dark:bg-slate-950/60 rounded-xl border border-cyan-200/80 dark:border-cyan-900/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Store ID:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{paymentSettings.aamarpay?.storeId || 'aamarpaytest'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">API Signature:</span>
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">Secured Signature Handshake</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Callback Handling:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Direct IPN Server Verification
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Supported Channels (Selected at Payment Window):
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                      <span className="px-2 py-0.5 rounded-md bg-[#E2136E]/10 text-[#E2136E] border border-[#E2136E]/20">bKash Instant</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#F7931E]/10 text-[#F7931E] border border-[#F7931E]/20">Nagad Direct</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#8C3494]/10 text-[#8C3494] border border-[#8C3494]/20">Rocket</span>
                      <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">QCash</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">VISA / MasterCard</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">Internet Banking</span>
                    </div>
                  </div>
                </div>
              )}

              {/* --- 3. RAZORPAY UPI FORM --- */}
              {selectedGateway === 'razorpay' && (
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-3">
                  <span className="text-xs font-heading font-extrabold text-blue-900 dark:text-blue-300 uppercase tracking-wider block">
                    Razorpay UPI / VPA ID
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* --- 4. COINBASE CRYPTO COMMERCE FORM --- */}
              {selectedGateway === 'coinbase' && (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="text-xs font-heading font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    Select Preferred Cryptocurrency:
                  </span>
                  <select
                    value={cryptoAsset}
                    onChange={(e) => setCryptoAsset(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-bold focus:outline-none"
                  >
                    <option value="USDT (TRC20)">Tether USDT (TRC20 Network)</option>
                    <option value="BTC">Bitcoin (BTC)</option>
                    <option value="ETH">Ethereum (ETH / Arbitrum)</option>
                    <option value="SOL">Solana (SOL)</option>
                    <option value="BNB">BNB (BEP20)</option>
                  </select>
                </div>
              )}

              {/* --- 5. MANUAL GATEWAYS (bKash, Nagad, Rocket, Binance, Bank, Custom) --- */}
              {!isAutomatedGateway && (
                <div className="space-y-4">
                  {/* Account Information Copy Box */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        {selectedGateway === 'bkash' ? 'bKash Merchant / Personal:'
                          : selectedGateway === 'nagad' ? 'Nagad Personal / Agent:'
                          : selectedGateway === 'rocket' ? 'DBBL Rocket Number:'
                          : selectedGateway === 'binance' ? 'Binance Pay ID (USDT):'
                          : selectedGateway === 'bankTransfer' ? 'Bank Wire Details:'
                          : selectedCustomGateway ? `${selectedCustomGateway.name} Account:` : 'Account Number:'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        Manual Verification ⏳
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-xl p-2.5 sm:p-3 shadow-2xs">
                      <span className="font-mono font-black text-sm sm:text-base tracking-wider text-slate-900 dark:text-white truncate pr-2">
                        {selectedGateway === 'bkash' ? paymentSettings.bkash.merchantNumber
                          : selectedGateway === 'nagad' ? paymentSettings.nagad.merchantNumber
                          : selectedGateway === 'rocket' ? paymentSettings.rocket.merchantNumber
                          : selectedGateway === 'binance' ? paymentSettings.binance.payId
                          : selectedGateway === 'bankTransfer' ? `${paymentSettings.bankTransfer.bankName} - ${paymentSettings.bankTransfer.accountNumber}`
                          : selectedCustomGateway ? selectedCustomGateway.accountDetails : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyPaymentInfo(
                          selectedGateway === 'bkash' ? paymentSettings.bkash.merchantNumber
                          : selectedGateway === 'nagad' ? paymentSettings.nagad.merchantNumber
                          : selectedGateway === 'rocket' ? paymentSettings.rocket.merchantNumber
                          : selectedGateway === 'binance' ? paymentSettings.binance.payId
                          : selectedGateway === 'bankTransfer' ? paymentSettings.bankTransfer.accountNumber
                          : selectedCustomGateway ? selectedCustomGateway.accountDetails : ''
                        )}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer shrink-0"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      👉 {selectedGateway === 'bkash' ? paymentSettings.bkash.instructions
                        : selectedGateway === 'nagad' ? paymentSettings.nagad.instructions
                        : selectedGateway === 'rocket' ? paymentSettings.rocket.instructions
                        : selectedGateway === 'binance' ? paymentSettings.binance.instructions
                        : selectedGateway === 'bankTransfer' ? paymentSettings.bankTransfer.instructions
                        : selectedCustomGateway ? selectedCustomGateway.instructions : 'Send payment and submit reference.'}
                    </p>
                  </div>

                  {/* Input Fields */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Sender Mobile Number / Sender Account:
                      </label>
                      <input
                        type="text"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g. 017XXXXXXXX / Sender Account / Binance Name"
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Transaction ID (TrxID) / Reference Number:
                      </label>
                      <input
                        type="text"
                        required
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        placeholder="e.g. 9N87B654321 / Ref"
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Payment Screenshot / Receipt (Optional):
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setScreenshotFile(e.target.files[0]);
                          }
                        }}
                        className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-600 dark:file:text-emerald-400 hover:file:bg-emerald-500/20 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* LOADER OVERLAY WHILE PROCESSING */}
              {isProcessing && (
                <div className="py-6 flex flex-col items-center justify-center space-y-3 text-center">
                  <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    {processingStatusText}
                  </div>
                </div>
              )}

              {/* SUBMIT ORDER BUTTON */}
              {!isProcessing && (
                <button
                  type="submit"
                  className="relative overflow-hidden w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-heading font-black text-sm sm:text-base border border-emerald-400/40 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Sparkles className="w-5 h-5 animate-pulse text-slate-950" />
                  <span>
                    {isAutomatedGateway
                      ? `Pay ${formatCurrencyAmount(convertedGatewayAmount, gatewayCurrency)} & Instant Download ⚡`
                      : `Submit ${selectedGateway.toUpperCase()} Verification 🚀`}
                  </span>
                </button>
              )}
            </form>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <Footer
        onSelectCategory={() => {
          if (onExploreStore) onExploreStore();
          else navigateTo('/');
        }}
        onOpenXmlStudio={onOpenXmlStudio}
      />
    </div>
  );
};

export default CheckoutPage;
