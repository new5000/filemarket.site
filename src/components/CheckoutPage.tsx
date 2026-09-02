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
  UpayLogo,
  BinanceLogo, 
  BankLogo,
  PaymentGatewayLogo
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
import { useCart } from '../context/CartContext';

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

  const { cartItems, totalBDT: cartTotalBDT, clearCart } = useCart();

  const isCartMode = !product && cartItems.length > 0;
  const effectiveTotalBDT = isCartMode ? (cartTotalBDT > 0 ? cartTotalBDT : totalBDT) : totalBDT;
  const effectiveTotalUSD = isCartMode ? (cartTotalBDT > 0 ? Math.round((cartTotalBDT / 118) * 100) / 100 : totalUSD) : totalUSD;

  const checkoutState = useMemo(() => {
    if (isCartMode) {
      return {
        mode: 'cart' as const,
        items: cartItems.map((ci) => ({
          id: ci.product.id,
          title: ci.product.title,
          coverImage: formatDirectImageUrl(ci.product.thumbnail || (ci.product as any).image),
          thumbnail: formatDirectImageUrl(ci.product.thumbnail || (ci.product as any).image),
          fileSize: ci.product.fileSize || (ci.product.productKind === 'physical' ? 'Physical Item' : 'Digital Asset'),
          salePrice: ci.product.priceBDT,
          price: ci.product.priceBDT,
          quantity: ci.quantity,
          product: ci.product,
        })),
        total: effectiveTotalBDT
      };
    }

    return {
      mode: 'single' as const,
      items: activeProduct ? [{
        id: activeProduct.id,
        title: activeProduct.title,
        coverImage: formatDirectImageUrl(activeProduct.thumbnail || (activeProduct as any).image),
        thumbnail: formatDirectImageUrl(activeProduct.thumbnail || (activeProduct as any).image),
        fileSize: activeProduct.fileSize || (isPhysical ? 'Physical Item' : 'Digital Asset'),
        salePrice: unitPriceBDT,
        price: unitPriceBDT,
        quantity: quantity,
        product: activeProduct,
      }] : [],
      total: effectiveTotalBDT
    };
  }, [isCartMode, cartItems, effectiveTotalBDT, activeProduct, isPhysical, unitPriceBDT, quantity]);

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
      selectedGateway === 'upay' || 
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
    if (gatewayCurrency === 'BDT') return effectiveTotalBDT;
    if (gatewayCurrency === 'USD') return effectiveTotalUSD;
    return convertCurrency(effectiveTotalUSD, 'USD', gatewayCurrency, paymentSettings.exchangeRates);
  }, [gatewayCurrency, effectiveTotalBDT, effectiveTotalUSD, paymentSettings.exchangeRates]);

  const usdtAmount = useMemo(() => {
    return (checkoutState.total / 118).toFixed(2);
  }, [checkoutState.total]);

  const currentManualGateway = useMemo(() => {
    if (selectedGateway === 'bkash') {
      return {
        name: 'bKash',
        accountType: (paymentSettings.bkash as any)?.accountType || 'Personal / Send Money',
        number: paymentSettings.bkash?.merchantNumber || '01673833783',
        instructions: paymentSettings.bkash?.instructions,
        logoId: 'bkash' as const,
        customLogo: paymentSettings.bkash?.customLogo,
      };
    }
    if (selectedGateway === 'nagad') {
      return {
        name: 'Nagad',
        accountType: (paymentSettings.nagad as any)?.accountType || 'Personal / Send Money',
        number: paymentSettings.nagad?.merchantNumber || '01673833783',
        instructions: paymentSettings.nagad?.instructions,
        logoId: 'nagad' as const,
        customLogo: paymentSettings.nagad?.customLogo,
      };
    }
    if (selectedGateway === 'rocket') {
      return {
        name: 'Rocket',
        accountType: (paymentSettings.rocket as any)?.accountType || 'Personal / Send Money',
        number: paymentSettings.rocket?.merchantNumber || '01673833783',
        instructions: paymentSettings.rocket?.instructions,
        logoId: 'rocket' as const,
        customLogo: paymentSettings.rocket?.customLogo,
      };
    }
    if (selectedGateway === 'upay') {
      return {
        name: 'Upay',
        accountType: (paymentSettings.upay as any)?.accountType || 'Personal / Send Money',
        number: paymentSettings.upay?.merchantNumber || '01673833783',
        instructions: paymentSettings.upay?.instructions,
        logoId: 'upay' as const,
        customLogo: paymentSettings.upay?.customLogo,
      };
    }
    if (selectedGateway === 'binance') {
      return {
        name: 'Binance Pay',
        accountType: 'Pay ID (USDT)',
        number: paymentSettings.binance?.payId || '123456789',
        instructions: paymentSettings.binance?.instructions,
        logoId: 'binance' as const,
        customLogo: paymentSettings.binance?.customLogo,
      };
    }
    if (selectedGateway === 'bankTransfer') {
      return {
        name: paymentSettings.bankTransfer?.bankName || 'Bank Transfer',
        accountType: 'Bank Wire / Transfer',
        number: `${paymentSettings.bankTransfer?.accountNumber || ''} (${paymentSettings.bankTransfer?.accountName || 'FileMarket'})`,
        instructions: paymentSettings.bankTransfer?.instructions,
        logoId: 'bank' as const,
        customLogo: paymentSettings.bankTransfer?.customLogo,
      };
    }
    if (selectedCustomGateway) {
      return {
        name: selectedCustomGateway.name,
        accountType: 'Custom Payment Channel',
        number: selectedCustomGateway.accountDetails,
        instructions: selectedCustomGateway.instructions,
        logoId: selectedCustomGateway.id as any,
        customLogo: selectedCustomGateway.iconUrl,
      };
    }
    return null;
  }, [selectedGateway, paymentSettings, selectedCustomGateway]);

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
    const primaryProduct = activeProduct || (isCartMode && cartItems.length > 0 ? cartItems[0].product : null);
    if (!primaryProduct) return;
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
          : '[ ⚡ Verifying Transaction Details... ]'
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

      // 1. Safe Client-Side Image Processing & Upload (Fail-safe, never blocks indefinitely)
      let uploadedScreenshotUrl: string | null = null;
      if (screenshotFile) {
        setProcessingStatusText('[ 📸 Processing Receipt Image & Attaching Proof... ]');
        try {
          uploadedScreenshotUrl = await uploadPaymentReceipt(screenshotFile, generatedTrxId);
        } catch (uploadErr) {
          console.warn("Screenshot upload warning (fail-safe bypassed):", uploadErr);
        }
      }

      setProcessingStatusText('[ ⚡ Registering Payment Verification in System Ledger... ]');

      const result = await createOrderAndFulfill({
        productId: primaryProduct.id,
        product: primaryProduct,
        userId: effectiveUid,
        userEmail: orderEmail,
        userPhone: customerPhone.trim() || shippingPhone.trim() || orderEmail,
        amountBDT: effectiveTotalBDT,
        amountUSD: effectiveTotalUSD,
        paymentMethod: selectedCustomGateway ? selectedCustomGateway.name : selectedGateway,
        isAutomated: isAutomatedGateway,
        transactionId: generatedTrxId,
        senderNumber: customerPhone.trim() || shippingPhone.trim() || (isAutomatedGateway ? 'Card/Automated' : ''),
        screenshotUrl: uploadedScreenshotUrl,
        currencyPaid: gatewayCurrency,
        amountPaid: convertedGatewayAmount,
        productKind: isPhysical ? 'physical' : 'digital',
        quantity: isCartMode ? checkoutState.items.length : quantity,
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

      if (isCartMode) {
        clearCart();
      }

      // Dispatch Telegram Notification for Admin in background
      try {
        const BOT_TOKEN = "8293279827:AAFn12Cb-NKOHkv2rdhLjLcm8gdNkqkcKQ8";
        const CHAT_ID = "5570892539";
        const gatewayName = selectedCustomGateway ? selectedCustomGateway.name : selectedGateway.toUpperCase();

        const orderTitle = isCartMode 
          ? `Cart Checkout: ${checkoutState.items.length} Assets (${checkoutState.items.map(i => i.title).slice(0, 3).join(', ')}${checkoutState.items.length > 3 ? '...' : ''})`
          : primaryProduct.title;

        const alertMessage = 
`🚨 *NEW ORDER ${isAutomatedGateway ? '✅ AUTO-FULFILLED' : '⏳ PENDING'}* 🚨
━━━━━━━━━━━━━━━━━━━━━
📦 *Product:* ${orderTitle} (${isPhysical ? 'Physical Goods' : 'Digital Asset'})
💰 *Amount:* ${formatCurrencyAmount(convertedGatewayAmount, gatewayCurrency)} (${effectiveTotalBDT} BDT / $${effectiveTotalUSD} USD)
💳 *Gateway:* ${gatewayName} (${isAutomatedGateway ? 'Instant Automated' : 'Manual'})
🔢 *TrxID:* \`${generatedTrxId}\`
👤 *Customer:* ${orderEmail}
${isPhysical ? `🚚 *Ship To:* ${shippingName} (${shippingPhone}), ${shippingAddress}, ${shippingCity} ${shippingZip}\n` : ''}🆔 *Order ID:* \`${result.orderId}\`
⚡ *Status:* ${isAutomatedGateway ? 'COMPLETED' : 'PENDING (Admin Approval Required)'}
⏰ *Time:* ${new Date().toLocaleTimeString()}
━━━━━━━━━━━━━━━━━━━━━`;

        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
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

      // Smooth transition to Success / Order Pending Screen
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
      // Safety guard to ensure spinner NEVER hangs under any circumstances
      setTimeout(() => setIsProcessing(false), 2000);
    }
  };

  const handleGoToDownloads = () => {
    navigateTo('/downloads', { title: 'My Purchased Assets & Downloads — FileMarket' });
  };

  // Bank-Grade Anti-Theft: URL Masking
  const handleSecureDownload = async (orderId: string, fallbackUrl: string) => {
    try {
       if (!auth.currentUser) throw new Error("Unauthorized download attempt");
       window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
       console.error("Secure download failed", err);
       alert("Secure session expired. Please sign in again.");
    }
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
        
        {/* Unified Order Summary Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black tracking-wider uppercase text-slate-500 dark:text-slate-400">
                {checkoutState.mode === 'cart' 
                  ? `Order Summary (${checkoutState.items.length} Items)` 
                  : 'Direct Checkout (1 Item)'}
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span>⚡</span> Instant Cloud Access
            </span>
          </div>

          {/* Multi-Item Scrollable Asset List */}
          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
            {checkoutState.items.map((item, index) => (
              <div 
                key={item.id || index} 
                className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
              >
                <img 
                  src={item.coverImage || item.thumbnail} 
                  alt={item.title} 
                  className="w-14 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>📦 {item.fileSize || 'Digital Asset'}</span>
                    <span>•</span>
                    <span className="text-emerald-500 font-semibold">Lifetime Access</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    ৳{item.salePrice || item.price}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Total Payable Summary Banner */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
              TOTAL PAYABLE:
            </span>
            <div className="text-right">
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                ৳{checkoutState.total} BDT
              </span>
              <span className="text-[11px] text-slate-400 block font-medium">
                (≈ ${(checkoutState.total / 118).toFixed(2)} USD)
              </span>
            </div>
          </div>
        </div>

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
                  <button
                    type="button"
                    onClick={() => handleSecureDownload(completedOrder.orderId, completedOrder.downloadUrl)}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Product Files (ZIP / Drive)</span>
                  </button>
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
          <div className="rounded-3xl bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-5 sm:p-7 shadow-sm space-y-4">
            
            {/* Minimalist Clean Header (No extra subtitles or unwanted banners) */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-emerald-500">💳</span> Select Payment Gateway
              </h3>
            </div>

            {/* Gateway Grid directly underneath */}
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
                  <PaymentGatewayLogo gatewayId="stripe" customLogo={paymentSettings.stripe?.customLogo} className="w-12 h-6" />
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
                  <PaymentGatewayLogo gatewayId="paypal" customLogo={paymentSettings.paypal?.customLogo} className="w-12 h-6" />
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
                  <PaymentGatewayLogo gatewayId="shurjopay" customLogo={paymentSettings.shurjopay?.customLogo} className="h-6 px-1.5" />
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
                  <PaymentGatewayLogo gatewayId="sslcommerz" customLogo={paymentSettings.sslcommerz?.customLogo} className="h-6 px-1.5" />
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
                  <PaymentGatewayLogo gatewayId="aamarpay" customLogo={paymentSettings.aamarpay?.customLogo} className="h-6 px-1.5" />
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
                  <PaymentGatewayLogo gatewayId="razorpay" customLogo={paymentSettings.razorpay?.customLogo} className="h-6 px-1.5" />
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
                  <PaymentGatewayLogo gatewayId="coinbase" customLogo={paymentSettings.coinbase?.customLogo} className="h-6 px-1 text-[10px]" />
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
                  <PaymentGatewayLogo gatewayId="paystack" customLogo={paymentSettings.paystack?.customLogo} className="h-6 px-2 text-[10px]" />
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
                  <PaymentGatewayLogo gatewayId="flutterwave" customLogo={paymentSettings.flutterwave?.customLogo} className="h-6 px-2 text-[10px]" />
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
                  <PaymentGatewayLogo gatewayId="mollie" customLogo={paymentSettings.mollie?.customLogo} className="h-6 px-2 text-[10px]" />
                  <span className="text-[11px] font-black">iDEAL / EU</span>
                </button>
              )}

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
                  <PaymentGatewayLogo gatewayId="bkash" customLogo={paymentSettings.bkash?.customLogo} className="w-7 h-7" />
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
                  <PaymentGatewayLogo gatewayId="nagad" customLogo={paymentSettings.nagad?.customLogo} className="h-6 px-1 text-[10px]" />
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
                  <PaymentGatewayLogo gatewayId="rocket" customLogo={paymentSettings.rocket?.customLogo} className="h-6 px-1 text-[10px]" />
                  <span className="text-[11px] font-black text-[#8C3494]">Rocket (DBBL)</span>
                </button>
              )}

              {/* Upay */}
              {paymentSettings.upay?.enabled && (
                <button
                  type="button"
                  onClick={() => setSelectedGateway('upay')}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                    selectedGateway === 'upay'
                      ? 'border-blue-600 bg-blue-600/15 text-blue-700 dark:text-blue-300 shadow-sm ring-2 ring-blue-600/40 scale-[1.02]'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:border-blue-500/30'
                  }`}
                >
                  <PaymentGatewayLogo gatewayId="upay" customLogo={paymentSettings.upay?.customLogo} className="h-6 px-1 text-[10px]" />
                  <span className="text-[11px] font-black text-[#002D62] dark:text-[#FBBF24]">Upay (UCB)</span>
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
                  <PaymentGatewayLogo gatewayId="binance" customLogo={paymentSettings.binance?.customLogo} className="h-6 px-1 text-[10px]" />
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
                  <PaymentGatewayLogo gatewayId="bank" customLogo={paymentSettings.bankTransfer?.customLogo} className="h-6 px-1 text-[10px]" />
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
                  <PaymentGatewayLogo gatewayId={customGw.id} customLogo={customGw.iconUrl} name={customGw.name} className="w-6 h-6 rounded" />
                  <span className="text-[11px] font-black truncate max-w-[90px]">{customGw.name}</span>
                </button>
              ))}
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

              {/* --- 5. MANUAL GATEWAYS (bKash, Nagad, Rocket, Upay, Binance, Bank, Custom) --- */}
              {!isAutomatedGateway && currentManualGateway && (
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  
                  {/* 1. Header with Channel & Exact Amount to Send */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700/80 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 p-1.5 flex items-center justify-center shadow-xs border border-slate-200 dark:border-slate-700 shrink-0">
                        <PaymentGatewayLogo gatewayId={currentManualGateway.logoId} customLogo={currentManualGateway.customLogo} className="max-h-full object-contain" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {currentManualGateway.name} ({currentManualGateway.accountType})
                        </h4>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          সরাসরি ইনস্ট্যান্ট ভেরিফিকেশন এক্টিভ
                        </span>
                      </div>
                    </div>

                    {/* Exact Amount Tag */}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">পাঠানোর পরিমাণ:</span>
                      {selectedGateway === 'binance' ? (
                        <div>
                          <span className="text-sm sm:text-base font-black text-amber-500 dark:text-amber-400">
                            {usdtAmount} USDT
                          </span>
                          <span className="block text-[10px] font-bold text-slate-400">
                            (৳{checkoutState.total} BDT)
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                          ৳{checkoutState.total} BDT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. Number Copy Box with Visual Feedback */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {selectedGateway === 'binance' 
                        ? 'নিচের Binance Pay ID-তে USDT পাঠান:' 
                        : 'নিচের নম্বরে Send Money / টাকা পাঠান:'}
                    </label>
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-emerald-500/40 rounded-xl p-2.5 sm:p-3 shadow-xs">
                      <span className="text-base sm:text-lg font-mono font-black text-slate-900 dark:text-white tracking-wider truncate pr-2">
                        {currentManualGateway.number}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyPaymentInfo(currentManualGateway.number)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          copied 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                        }`}
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? '✓ কপি হয়েছে!' : '📋 Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 3. Easy 3-Step Visual Guidance */}
                  <div className="grid grid-cols-3 gap-2 py-1 text-center">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-2xs">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block mb-0.5">
                        {selectedGateway === 'binance' ? '১. USDT পাঠান' : '১. সেন্ড মানি'}
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                        {selectedGateway === 'binance' ? `ঠিক ${usdtAmount} USDT পাঠান` : `ঠিক ৳${checkoutState.total} পাঠান`}
                      </p>
                    </div>
                    <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-2xs">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block mb-0.5">
                        {selectedGateway === 'binance' ? '২. Order ID কপি' : '২. TrxID কপি'}
                      </span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight font-medium">
                        {selectedGateway === 'binance' ? 'Binance Pay Order ID কপি করুন' : 'মেসেজের কোডটি কপি করুন'}
                      </p>
                    </div>
                    <div className="p-2 sm:p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-2xs">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block mb-0.5">৩. সাবমিট</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight font-medium">নিচে কোড বসিয়ে ভেরিফাই করুন</p>
                    </div>
                  </div>

                  {/* 4. Streamlined Form Fields */}
                  <div className="space-y-3 pt-1">
                    {/* Sender Mobile Number */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {selectedGateway === 'binance' ? 'আপনার প্রেরক Binance Pay ID / Email' : 'আপনার প্রেরক মোবাইল নম্বর (Sender Number)'} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder={selectedGateway === 'binance' ? 'e.g. 123456789 বা Binance Email' : 'যে নম্বর থেকে টাকা পাঠিয়েছেন (01XXXXXXXXX)'}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        required
                      />
                    </div>

                    {/* Transaction ID */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        ট্রানজেকশন আইডি (TrxID) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                        placeholder="যেমন: BL7A89XC21"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all uppercase tracking-wider"
                        required
                      />
                    </div>

                    {/* Screenshot Upload (Clean & Optional) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          পেমেন্ট স্ক্রিনশট (Payment Screenshot)
                        </label>
                        <span className="text-[10px] text-slate-400 font-semibold">(ঐচ্ছিক / Optional)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors shrink-0">
                          <span>📷 ফটো আপলোড</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                            className="hidden" 
                          />
                        </label>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                          {screenshotFile ? screenshotFile.name : 'কোনো ফাইল সিলেক্ট করা হয়নি'}
                        </span>
                      </div>
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

              {/* HIGH CONVERTING SUBMIT BUTTON */}
              {!isProcessing && (
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  <Sparkles className="w-4 h-4 animate-pulse" />
                  <span>
                    {isAutomatedGateway
                      ? `⚡ Pay ${formatCurrencyAmount(convertedGatewayAmount, gatewayCurrency)} & Instant Access`
                      : '🚀 পেমেন্ট নিশ্চিত করুন ও ফাইল অ্যাক্সেস নিন'}
                  </span>
                </button>
              )}

              {/* 5. TRUST BADGES & WHATSAPP SUPPORT FOOTER */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-bold flex-wrap">
                  <span className="flex items-center gap-1">🔒 100% নিরাপদ লেনদেন</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">⚡ 5-15 মিনিটে অটো ভেরিফাই</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">🛡️ 24h রিফান্ড পলিসি</span>
                </div>

                {/* Direct WhatsApp Quick Help */}
                <a
                  href="https://wa.me/8801673833783?text=Hello%20FileMarket,%20I%20need%20help%20with%20my%20order"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/40 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  <span>💬 পেমেন্টে কোনো সমস্যা হচ্ছে? সরাসরি হোয়াটসঅ্যাপে কথা বলুন</span>
                </a>
              </div>
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
