import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Save, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Globe, 
  DollarSign, 
  HelpCircle, 
  Sparkles, 
  X,
  Lock,
  Zap,
  ArrowRight
} from 'lucide-react';
import { 
  PaymentSettingsData, 
  CustomPaymentGateway, 
  DEFAULT_PAYMENT_SETTINGS, 
  fetchPaymentSettings, 
  savePaymentSettings,
  convertCurrency,
  formatCurrencyAmount
} from '../../lib/paymentService';
import { BkashLogo } from '../icons/BkashLogo';
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
  MercadoPagoLogo, 
  CoinbaseLogo, 
  SkrillLogo, 
  NagadLogo, 
  RocketLogo, 
  UpayLogo,
  BinanceLogo, 
  BankLogo 
} from '../icons/PaymentGatewayLogos';
import { GatewayLogoControl } from './GatewayLogoControl';

interface AdminPaymentSettingsViewProps {
  onRefresh?: () => void;
}

export const AdminPaymentSettingsView: React.FC<AdminPaymentSettingsViewProps> = ({ onRefresh }) => {
  const [settings, setSettings] = useState<PaymentSettingsData>(DEFAULT_PAYMENT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Show/Hide password field state map
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  // Active filter for gateway categories
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'international' | 'local' | 'crypto' | 'custom'>('all');

  // Custom Gateway Modal state
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [editingCustomGateway, setEditingCustomGateway] = useState<CustomPaymentGateway | null>(null);
  const [customName, setCustomName] = useState('');
  const [customIconUrl, setCustomIconUrl] = useState('');
  const [customCategory, setCustomCategory] = useState<'mobile' | 'wallet' | 'bank' | 'crypto' | 'cards' | 'other'>('wallet');
  const [customAccountDetails, setCustomAccountDetails] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [customRequireProof, setCustomRequireProof] = useState(true);
  const [customFieldsText, setCustomFieldsText] = useState('Sender Number, Transaction ID');

  // Currency calculator sandbox
  const [calcAmount, setCalcAmount] = useState<number>(10);
  const [calcFrom, setCalcFrom] = useState<string>('USD');
  const [calcTo, setCalcTo] = useState<string>('BDT');

  useEffect(() => {
    fetchPaymentSettings().then((data) => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  const toggleKeyVisibility = (key: string) => {
    setVisibleKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await savePaymentSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("Failed to save payment settings:", err);
      setSaveError(err?.message || "Failed to save settings to Firestore.");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAddCustom = () => {
    setEditingCustomGateway(null);
    setCustomName('');
    setCustomIconUrl('');
    setCustomCategory('wallet');
    setCustomAccountDetails('');
    setCustomInstructions('');
    setCustomRequireProof(true);
    setCustomFieldsText('Sender Mobile / Account Number, Transaction Reference ID');
    setIsCustomModalOpen(true);
  };

  const handleOpenEditCustom = (gw: CustomPaymentGateway) => {
    setEditingCustomGateway(gw);
    setCustomName(gw.name);
    setCustomIconUrl(gw.iconUrl || '');
    setCustomCategory((gw.category as any) || 'wallet');
    setCustomAccountDetails(gw.accountDetails);
    setCustomInstructions(gw.instructions);
    setCustomRequireProof(gw.requireProof !== false);
    setCustomFieldsText((gw.requiredFields || ['Sender Mobile Number', 'Transaction ID']).join(', '));
    setIsCustomModalOpen(true);
  };

  const handleSaveCustomGateway = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const fieldsArray = customFieldsText
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean);

    const newCustomGateway: CustomPaymentGateway = {
      id: editingCustomGateway ? editingCustomGateway.id : `custom_${Date.now().toString(36)}`,
      name: customName.trim(),
      iconUrl: customIconUrl.trim(),
      category: customCategory,
      enabled: editingCustomGateway ? editingCustomGateway.enabled : true,
      accountDetails: customAccountDetails.trim(),
      instructions: customInstructions.trim(),
      requireProof: customRequireProof,
      requiredFields: fieldsArray.length > 0 ? fieldsArray : ['Sender Mobile Number', 'Transaction ID']
    };

    let updatedList = [...settings.customGateways];
    if (editingCustomGateway) {
      updatedList = updatedList.map((g) => (g.id === editingCustomGateway.id ? newCustomGateway : g));
    } else {
      updatedList.push(newCustomGateway);
    }

    setSettings({
      ...settings,
      customGateways: updatedList
    });

    setIsCustomModalOpen(false);
  };

  const handleDeleteCustomGateway = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this custom payment gateway?")) return;
    setSettings({
      ...settings,
      customGateways: settings.customGateways.filter((g) => g.id !== id)
    });
  };

  const handleExchangeRateChange = (curr: string, value: number) => {
    setSettings({
      ...settings,
      exchangeRates: {
        ...settings.exchangeRates,
        [curr]: value
      }
    });
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold">Loading Multi-Gateway Payment Configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-500" />
            Multi-Gateway Payment & Checkout Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure 15+ international and regional automated & manual payment processors, API credentials, and dynamic custom gateways.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving to Firestore...' : 'Save All Payment Settings'}
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" /> Payment gateway credentials, exchange rates, and custom gateways successfully saved!
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4" /> {saveError}
        </div>
      )}

      {/* Global Currency & Exchange Rates Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            Global Base Currency & Exchange Rates Engine
          </h2>
          <span className="text-[11px] font-bold text-slate-400">
            Base: 1 USD
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Base Currency Selection */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Primary Store Currency
            </label>
            <select
              value={settings.globalCurrency}
              onChange={(e) => setSettings({ ...settings, globalCurrency: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="USD">USD ($) - US Dollar</option>
              <option value="BDT">BDT (৳) - Bangladeshi Taka</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="CAD">CAD (CA$) - Canadian Dollar</option>
              <option value="AUD">AUD (AU$) - Australian Dollar</option>
              <option value="PKR">PKR (Rs) - Pakistani Rupee</option>
              <option value="NGN">NGN (₦) - Nigerian Naira</option>
              <option value="KES">KES (KSh) - Kenyan Shilling</option>
              <option value="BRL">BRL (R$) - Brazilian Real</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Default currency shown when customers first visit checkout.
            </p>
          </div>

          {/* Live Currency Converter Test Box */}
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Realtime Currency Calculator
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={calcAmount}
                onChange={(e) => setCalcAmount(parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1.5 bg-white dark:bg-slate-800 border border-emerald-500/30 rounded text-xs font-mono text-slate-900 dark:text-white"
              />
              <select
                value={calcFrom}
                onChange={(e) => setCalcFrom(e.target.value)}
                className="px-2 py-1.5 bg-white dark:bg-slate-800 border border-emerald-500/30 rounded text-xs font-bold text-slate-900 dark:text-white"
              >
                {Object.keys(settings.exchangeRates).map((curr) => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={calcTo}
                onChange={(e) => setCalcTo(e.target.value)}
                className="px-2 py-1.5 bg-white dark:bg-slate-800 border border-emerald-500/30 rounded text-xs font-bold text-slate-900 dark:text-white"
              >
                {Object.keys(settings.exchangeRates).map((curr) => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white pt-1">
              Result: <span className="font-mono text-emerald-500 font-black">{formatCurrencyAmount(convertCurrency(calcAmount, calcFrom, calcTo, settings.exchangeRates), calcTo)}</span>
            </div>
          </div>

          {/* Exchange Rate Adjustment Grid */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Live Exchange Multipliers (1 USD = X)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-28 overflow-y-auto pr-1 text-[11px]">
              {Object.entries(settings.exchangeRates).map(([curr, rate]) => (
                <div key={curr} className="flex items-center gap-1">
                  <span className="font-mono font-bold text-slate-500 w-9">{curr}:</span>
                  <input
                    type="number"
                    step="0.01"
                    value={rate}
                    onChange={(e) => handleExchangeRateChange(curr, parseFloat(e.target.value) || 1)}
                    className="w-full px-1.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-mono text-[11px] text-slate-900 dark:text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
          {(['all', 'international', 'local', 'crypto', 'custom'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer capitalize ${
                activeCategoryFilter === cat
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Gateways (15+)' : cat === 'international' ? 'International / Cards' : cat === 'local' ? 'Bangladesh & Regional' : cat === 'crypto' ? 'Crypto' : 'Custom Gateways'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleOpenAddCustom}
          className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm border border-slate-700"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          Add Dynamic Custom Gateway
        </button>
      </div>

      {/* Grid of Gateways */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* 1. Stripe */}
        {(activeCategoryFilter === 'all' || activeCategoryFilter === 'international') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 space-y-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StripeLogo className="w-16 h-7" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-bold">
                  Automated
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.stripe.enabled}
                  onChange={(e) => setSettings({ ...settings, stripe: { ...settings.stripe, enabled: e.target.checked } })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Custom Logo Row */}
            <GatewayLogoControl
              gatewayId="stripe"
              gatewayName="Cards / Stripe"
              customLogo={settings.stripe.customLogo}
              onChangeCustomLogo={(newLogo) => setSettings({ ...settings, stripe: { ...settings.stripe, customLogo: newLogo } })}
              renderDefaultLogo={() => <StripeLogo className="w-8 h-4" />}
            />

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <span className="font-bold text-slate-700 dark:text-slate-300">Environment</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, stripe: { ...settings.stripe, mode: 'sandbox' } })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${settings.stripe.mode === 'sandbox' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                >
                  Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, stripe: { ...settings.stripe, mode: 'live' } })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${settings.stripe.mode === 'live' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
                >
                  Live
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Publishable Key</label>
                <div className="relative">
                  <input
                    type={visibleKeys['stripe_pub'] ? 'text' : 'password'}
                    value={settings.stripe.publishableKey}
                    onChange={(e) => setSettings({ ...settings, stripe: { ...settings.stripe, publishableKey: e.target.value } })}
                    className="w-full pr-8 pl-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('stripe_pub')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {visibleKeys['stripe_pub'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Secret Key</label>
                <div className="relative">
                  <input
                    type={visibleKeys['stripe_sec'] ? 'text' : 'password'}
                    value={settings.stripe.secretKey}
                    onChange={(e) => setSettings({ ...settings, stripe: { ...settings.stripe, secretKey: e.target.value } })}
                    className="w-full pr-8 pl-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('stripe_sec')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {visibleKeys['stripe_sec'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PayPal */}
        {(activeCategoryFilter === 'all' || activeCategoryFilter === 'international') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PayPalLogo className="w-16 h-7" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold">
                  Automated
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.paypal.enabled}
                  onChange={(e) => setSettings({ ...settings, paypal: { ...settings.paypal, enabled: e.target.checked } })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Custom Logo Row */}
            <GatewayLogoControl
              gatewayId="paypal"
              gatewayName="PayPal"
              customLogo={settings.paypal.customLogo}
              onChangeCustomLogo={(newLogo) => setSettings({ ...settings, paypal: { ...settings.paypal, customLogo: newLogo } })}
              renderDefaultLogo={() => <PayPalLogo className="w-8 h-4" />}
            />

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <span className="font-bold text-slate-700 dark:text-slate-300">Environment</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, paypal: { ...settings.paypal, mode: 'sandbox' } })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${settings.paypal.mode === 'sandbox' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                >
                  Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, paypal: { ...settings.paypal, mode: 'live' } })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${settings.paypal.mode === 'live' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
                >
                  Live
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Client ID</label>
                <div className="relative">
                  <input
                    type={visibleKeys['paypal_client'] ? 'text' : 'password'}
                    value={settings.paypal.clientId}
                    onChange={(e) => setSettings({ ...settings, paypal: { ...settings.paypal, clientId: e.target.value } })}
                    className="w-full pr-8 pl-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('paypal_client')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {visibleKeys['paypal_client'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Secret Key</label>
                <div className="relative">
                  <input
                    type={visibleKeys['paypal_sec'] ? 'text' : 'password'}
                    value={settings.paypal.secretKey}
                    onChange={(e) => setSettings({ ...settings, paypal: { ...settings.paypal, secretKey: e.target.value } })}
                    className="w-full pr-8 pl-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('paypal_sec')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {visibleKeys['paypal_sec'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Shurjopay (Automated BD Gateway) */}
        {(activeCategoryFilter === 'all' || activeCategoryFilter === 'international' || activeCategoryFilter === 'local') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShurjopayLogo className="h-7 px-2" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 font-bold">
                  Automated BDT
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.shurjopay?.enabled ?? true}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    shurjopay: { 
                      ...(settings.shurjopay || DEFAULT_PAYMENT_SETTINGS.shurjopay), 
                      enabled: e.target.checked 
                    } 
                  })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Custom Logo Row */}
            <GatewayLogoControl
              gatewayId="shurjopay"
              gatewayName="Shurjopay"
              customLogo={settings.shurjopay?.customLogo}
              onChangeCustomLogo={(newLogo) => setSettings({ 
                ...settings, 
                shurjopay: { 
                  ...(settings.shurjopay || DEFAULT_PAYMENT_SETTINGS.shurjopay), 
                  customLogo: newLogo 
                } 
              })}
              renderDefaultLogo={() => <ShurjopayLogo className="h-5 px-1 text-[10px]" />}
            />

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <span className="font-bold text-slate-700 dark:text-slate-300">Environment</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSettings({ 
                    ...settings, 
                    shurjopay: { 
                      ...(settings.shurjopay || DEFAULT_PAYMENT_SETTINGS.shurjopay), 
                      mode: 'sandbox' 
                    } 
                  })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${settings.shurjopay?.mode === 'sandbox' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                >
                  Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ 
                    ...settings, 
                    shurjopay: { 
                      ...(settings.shurjopay || DEFAULT_PAYMENT_SETTINGS.shurjopay), 
                      mode: 'live' 
                    } 
                  })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${settings.shurjopay?.mode === 'live' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}
                >
                  Live
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Merchant Username</label>
                <input
                  type="text"
                  value={settings.shurjopay?.merchantUsername || ''}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    shurjopay: { 
                      ...(settings.shurjopay || DEFAULT_PAYMENT_SETTINGS.shurjopay), 
                      merchantUsername: e.target.value 
                    } 
                  })}
                  placeholder="sp_sandbox_merchant"
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Merchant Password</label>
                <div className="relative">
                  <input
                    type={visibleKeys['shurjopay_pwd'] ? 'text' : 'password'}
                    value={settings.shurjopay?.merchantPassword || ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      shurjopay: { 
                        ...(settings.shurjopay || DEFAULT_PAYMENT_SETTINGS.shurjopay), 
                        merchantPassword: e.target.value 
                      } 
                    })}
                    placeholder="Merchant API Password"
                    className="w-full pr-8 pl-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('shurjopay_pwd')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {visibleKeys['shurjopay_pwd'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Key Prefix</label>
                <input
                  type="text"
                  value={settings.shurjopay?.keyPrefix || ''}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    shurjopay: { 
                      ...(settings.shurjopay || DEFAULT_PAYMENT_SETTINGS.shurjopay), 
                      keyPrefix: e.target.value 
                    } 
                  })}
                  placeholder="e.g. NOK or SP"
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. SSLCommerz (Automated BD Gateway) */}
        {(activeCategoryFilter === 'all' || activeCategoryFilter === 'international' || activeCategoryFilter === 'local') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SSLCommerzLogo className="h-7 px-2" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 font-bold">
                  Automated BDT
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.sslcommerz?.enabled ?? true}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    sslcommerz: { 
                      ...(settings.sslcommerz || DEFAULT_PAYMENT_SETTINGS.sslcommerz), 
                      enabled: e.target.checked 
                    } 
                  })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Custom Logo Row */}
            <GatewayLogoControl
              gatewayId="sslcommerz"
              gatewayName="SSLCommerz"
              customLogo={settings.sslcommerz?.customLogo}
              onChangeCustomLogo={(newLogo) => setSettings({ 
                ...settings, 
                sslcommerz: { 
                  ...(settings.sslcommerz || DEFAULT_PAYMENT_SETTINGS.sslcommerz), 
                  customLogo: newLogo 
                } 
              })}
              renderDefaultLogo={() => <SSLCommerzLogo className="h-5 px-1 text-[10px]" />}
            />

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <span className="font-bold text-slate-700 dark:text-slate-300">Environment</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSettings({ 
                    ...settings, 
                    sslcommerz: { 
                      ...(settings.sslcommerz || DEFAULT_PAYMENT_SETTINGS.sslcommerz), 
                      mode: 'sandbox' 
                    } 
                  })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${settings.sslcommerz?.mode === 'sandbox' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                >
                  Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ 
                    ...settings, 
                    sslcommerz: { 
                      ...(settings.sslcommerz || DEFAULT_PAYMENT_SETTINGS.sslcommerz), 
                      mode: 'live' 
                    } 
                  })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${settings.sslcommerz?.mode === 'live' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}
                >
                  Live
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Store ID</label>
                <input
                  type="text"
                  value={settings.sslcommerz?.storeId || ''}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    sslcommerz: { 
                      ...(settings.sslcommerz || DEFAULT_PAYMENT_SETTINGS.sslcommerz), 
                      storeId: e.target.value 
                    } 
                  })}
                  placeholder="testbox"
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Store Password</label>
                <div className="relative">
                  <input
                    type={visibleKeys['sslcz_pwd'] ? 'text' : 'password'}
                    value={settings.sslcommerz?.storePassword || ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      sslcommerz: { 
                        ...(settings.sslcommerz || DEFAULT_PAYMENT_SETTINGS.sslcommerz), 
                        storePassword: e.target.value 
                      } 
                    })}
                    placeholder="Store Secret Password"
                    className="w-full pr-8 pl-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('sslcz_pwd')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {visibleKeys['sslcz_pwd'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. AamarPay (Automated BD Gateway) */}
        {(activeCategoryFilter === 'all' || activeCategoryFilter === 'international' || activeCategoryFilter === 'local') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AamarPayLogo className="h-7 px-2" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 font-bold">
                  Automated BDT
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.aamarpay?.enabled ?? true}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    aamarpay: { 
                      ...(settings.aamarpay || DEFAULT_PAYMENT_SETTINGS.aamarpay), 
                      enabled: e.target.checked 
                    } 
                  })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Custom Logo Row */}
            <GatewayLogoControl
              gatewayId="aamarpay"
              gatewayName="AamarPay"
              customLogo={settings.aamarpay?.customLogo}
              onChangeCustomLogo={(newLogo) => setSettings({ 
                ...settings, 
                aamarpay: { 
                  ...(settings.aamarpay || DEFAULT_PAYMENT_SETTINGS.aamarpay), 
                  customLogo: newLogo 
                } 
              })}
              renderDefaultLogo={() => <AamarPayLogo className="h-5 px-1 text-[10px]" />}
            />

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <span className="font-bold text-slate-700 dark:text-slate-300">Environment</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSettings({ 
                    ...settings, 
                    aamarpay: { 
                      ...(settings.aamarpay || DEFAULT_PAYMENT_SETTINGS.aamarpay), 
                      mode: 'sandbox' 
                    } 
                  })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${settings.aamarpay?.mode === 'sandbox' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                >
                  Sandbox
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ 
                    ...settings, 
                    aamarpay: { 
                      ...(settings.aamarpay || DEFAULT_PAYMENT_SETTINGS.aamarpay), 
                      mode: 'live' 
                    } 
                  })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${settings.aamarpay?.mode === 'live' ? 'bg-emerald-500 text-white' : 'text-slate-400'}`}
                >
                  Live
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Store ID</label>
                <input
                  type="text"
                  value={settings.aamarpay?.storeId || ''}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    aamarpay: { 
                      ...(settings.aamarpay || DEFAULT_PAYMENT_SETTINGS.aamarpay), 
                      storeId: e.target.value 
                    } 
                  })}
                  placeholder="aamarpaytest"
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Signature Key</label>
                <div className="relative">
                  <input
                    type={visibleKeys['aamarpay_sig'] ? 'text' : 'password'}
                    value={settings.aamarpay?.signatureKey || ''}
                    onChange={(e) => setSettings({ 
                      ...settings, 
                      aamarpay: { 
                        ...(settings.aamarpay || DEFAULT_PAYMENT_SETTINGS.aamarpay), 
                        signatureKey: e.target.value 
                      } 
                    })}
                    placeholder="Signature Key / Hash"
                    className="w-full pr-8 pl-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('aamarpay_sig')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {visibleKeys['aamarpay_sig'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. Razorpay */}
        {(activeCategoryFilter === 'all' || activeCategoryFilter === 'international') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RazorpayLogo className="h-7 px-2" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold">
                  India UPI / Cards
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.razorpay.enabled}
                  onChange={(e) => setSettings({ ...settings, razorpay: { ...settings.razorpay, enabled: e.target.checked } })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Custom Logo Row */}
            <GatewayLogoControl
              gatewayId="razorpay"
              gatewayName="Razorpay"
              customLogo={settings.razorpay.customLogo}
              onChangeCustomLogo={(newLogo) => setSettings({ ...settings, razorpay: { ...settings.razorpay, customLogo: newLogo } })}
              renderDefaultLogo={() => <RazorpayLogo className="h-5 px-1 text-[10px]" />}
            />

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <span className="font-bold text-slate-700 dark:text-slate-300">Environment</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, razorpay: { ...settings.razorpay, mode: 'sandbox' } })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${settings.razorpay.mode === 'sandbox' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                >
                  Test
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, razorpay: { ...settings.razorpay, mode: 'live' } })}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${settings.razorpay.mode === 'live' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'}`}
                >
                  Live
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Key ID</label>
                <input
                  type="text"
                  value={settings.razorpay.keyId}
                  onChange={(e) => setSettings({ ...settings, razorpay: { ...settings.razorpay, keyId: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Key Secret</label>
                <input
                  type={visibleKeys['rzp_sec'] ? 'text' : 'password'}
                  value={settings.razorpay.keySecret}
                  onChange={(e) => setSettings({ ...settings, razorpay: { ...settings.razorpay, keySecret: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 7. Paystack */}
        {(activeCategoryFilter === 'all' || activeCategoryFilter === 'international') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PaystackLogo className="h-7 px-2" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20 font-bold">
                  Africa / NGN
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.paystack.enabled}
                  onChange={(e) => setSettings({ ...settings, paystack: { ...settings.paystack, enabled: e.target.checked } })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Custom Logo Row */}
            <GatewayLogoControl
              gatewayId="paystack"
              gatewayName="Paystack"
              customLogo={settings.paystack.customLogo}
              onChangeCustomLogo={(newLogo) => setSettings({ ...settings, paystack: { ...settings.paystack, customLogo: newLogo } })}
              renderDefaultLogo={() => <PaystackLogo className="h-5 px-1 text-[10px]" />}
            />

            <div className="space-y-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Public Key</label>
                <input
                  type="text"
                  value={settings.paystack.publicKey}
                  onChange={(e) => setSettings({ ...settings, paystack: { ...settings.paystack, publicKey: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Secret Key</label>
                <input
                  type={visibleKeys['paystack_sec'] ? 'text' : 'password'}
                  value={settings.paystack.secretKey}
                  onChange={(e) => setSettings({ ...settings, paystack: { ...settings.paystack, secretKey: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 8. Flutterwave */}
        {(activeCategoryFilter === 'all' || activeCategoryFilter === 'international') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlutterwaveLogo className="h-7 px-2" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">
                  Pan-Africa
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.flutterwave.enabled}
                  onChange={(e) => setSettings({ ...settings, flutterwave: { ...settings.flutterwave, enabled: e.target.checked } })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Custom Logo Row */}
            <GatewayLogoControl
              gatewayId="flutterwave"
              gatewayName="Flutterwave"
              customLogo={settings.flutterwave.customLogo}
              onChangeCustomLogo={(newLogo) => setSettings({ ...settings, flutterwave: { ...settings.flutterwave, customLogo: newLogo } })}
              renderDefaultLogo={() => <FlutterwaveLogo className="h-5 px-1 text-[10px]" />}
            />

            <div className="space-y-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Public Key</label>
                <input
                  type="text"
                  value={settings.flutterwave.publicKey}
                  onChange={(e) => setSettings({ ...settings, flutterwave: { ...settings.flutterwave, publicKey: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Secret Key</label>
                <input
                  type={visibleKeys['flw_sec'] ? 'text' : 'password'}
                  value={settings.flutterwave.secretKey}
                  onChange={(e) => setSettings({ ...settings, flutterwave: { ...settings.flutterwave, secretKey: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 9. Mollie */}
        {(activeCategoryFilter === 'all' || activeCategoryFilter === 'international') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MollieLogo className="h-7 px-2" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20 font-bold">
                  Europe / iDEAL
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.mollie.enabled}
                  onChange={(e) => setSettings({ ...settings, mollie: { ...settings.mollie, enabled: e.target.checked } })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Custom Logo Row */}
            <GatewayLogoControl
              gatewayId="mollie"
              gatewayName="Mollie"
              customLogo={settings.mollie.customLogo}
              onChangeCustomLogo={(newLogo) => setSettings({ ...settings, mollie: { ...settings.mollie, customLogo: newLogo } })}
              renderDefaultLogo={() => <MollieLogo className="h-5 px-1 text-[10px]" />}
            />

            <div className="space-y-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Mollie API Key</label>
                <input
                  type={visibleKeys['mollie_key'] ? 'text' : 'password'}
                  value={settings.mollie.apiKey}
                  onChange={(e) => setSettings({ ...settings, mollie: { ...settings.mollie, apiKey: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 10. Coinbase Commerce */}
        {(activeCategoryFilter === 'all' || activeCategoryFilter === 'crypto') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CoinbaseLogo className="h-7 px-2" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold">
                  BTC, ETH, USDT
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.coinbase.enabled}
                  onChange={(e) => setSettings({ ...settings, coinbase: { ...settings.coinbase, enabled: e.target.checked } })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Custom Logo Row */}
            <GatewayLogoControl
              gatewayId="coinbase"
              gatewayName="Coinbase Commerce"
              customLogo={settings.coinbase.customLogo}
              onChangeCustomLogo={(newLogo) => setSettings({ ...settings, coinbase: { ...settings.coinbase, customLogo: newLogo } })}
              renderDefaultLogo={() => <CoinbaseLogo className="h-5 px-1 text-[10px]" />}
            />

            <div className="space-y-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Commerce API Key</label>
                <input
                  type={visibleKeys['coinbase_key'] ? 'text' : 'password'}
                  value={settings.coinbase.apiKey}
                  onChange={(e) => setSettings({ ...settings, coinbase: { ...settings.coinbase, apiKey: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 11. bKash */}
        {(activeCategoryFilter === 'all' || activeCategoryFilter === 'local') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BkashLogo className="w-7 h-7" />
                <span className="font-extrabold text-sm text-[#E2136E]">bKash (BD)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 border border-pink-500/20 font-bold">
                  Manual TrxID
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.bkash.enabled}
                  onChange={(e) => setSettings({ ...settings, bkash: { ...settings.bkash, enabled: e.target.checked } })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Custom Logo Row */}
            <GatewayLogoControl
              gatewayId="bkash"
              gatewayName="bKash"
              customLogo={settings.bkash.customLogo}
              onChangeCustomLogo={(newLogo) => setSettings({ ...settings, bkash: { ...settings.bkash, customLogo: newLogo } })}
              renderDefaultLogo={() => <BkashLogo className="w-6 h-6" />}
            />

            <div className="space-y-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Merchant / Agent / Personal Number</label>
                <input
                  type="text"
                  value={settings.bkash.merchantNumber}
                  onChange={(e) => setSettings({ ...settings, bkash: { ...settings.bkash, merchantNumber: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Account Type Tag</label>
                <input
                  type="text"
                  value={settings.bkash.type || 'Personal / Send Money'}
                  onChange={(e) => setSettings({ ...settings, bkash: { ...settings.bkash, type: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Payment Instructions</label>
                <textarea
                  rows={2}
                  value={settings.bkash.instructions}
                  onChange={(e) => setSettings({ ...settings, bkash: { ...settings.bkash, instructions: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 12. Nagad */}
        {(activeCategoryFilter === 'all' || activeCategoryFilter === 'local') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <NagadLogo className="h-7 px-2" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 font-bold">
                  Manual TrxID
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.nagad.enabled}
                  onChange={(e) => setSettings({ ...settings, nagad: { ...settings.nagad, enabled: e.target.checked } })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Custom Logo Row */}
            <GatewayLogoControl
              gatewayId="nagad"
              gatewayName="Nagad"
              customLogo={settings.nagad.customLogo}
              onChangeCustomLogo={(newLogo) => setSettings({ ...settings, nagad: { ...settings.nagad, customLogo: newLogo } })}
              renderDefaultLogo={() => <NagadLogo className="h-5 px-1 text-[10px]" />}
            />

            <div className="space-y-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Merchant / Personal Number</label>
                <input
                  type="text"
                  value={settings.nagad.merchantNumber}
                  onChange={(e) => setSettings({ ...settings, nagad: { ...settings.nagad, merchantNumber: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Account Type Tag</label>
                <input
                  type="text"
                  value={settings.nagad.type || 'Personal / Send Money'}
                  onChange={(e) => setSettings({ ...settings, nagad: { ...settings.nagad, type: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Payment Instructions</label>
                <textarea
                  rows={2}
                  value={settings.nagad.instructions}
                  onChange={(e) => setSettings({ ...settings, nagad: { ...settings.nagad, instructions: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 13. Rocket */}
        {(activeCategoryFilter === 'all' || activeCategoryFilter === 'local') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RocketLogo className="h-7 px-2" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 font-bold">
                  DBBL Mobile
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.rocket.enabled}
                  onChange={(e) => setSettings({ ...settings, rocket: { ...settings.rocket, enabled: e.target.checked } })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Custom Logo Row */}
            <GatewayLogoControl
              gatewayId="rocket"
              gatewayName="Rocket"
              customLogo={settings.rocket.customLogo}
              onChangeCustomLogo={(newLogo) => setSettings({ ...settings, rocket: { ...settings.rocket, customLogo: newLogo } })}
              renderDefaultLogo={() => <RocketLogo className="h-5 px-1 text-[10px]" />}
            />

            <div className="space-y-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Rocket Number (+ 12th Check Digit)</label>
                <input
                  type="text"
                  value={settings.rocket.merchantNumber}
                  onChange={(e) => setSettings({ ...settings, rocket: { ...settings.rocket, merchantNumber: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Payment Instructions</label>
                <textarea
                  rows={2}
                  value={settings.rocket.instructions}
                  onChange={(e) => setSettings({ ...settings, rocket: { ...settings.rocket, instructions: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 14. Upay */}
        {(activeCategoryFilter === 'all' || activeCategoryFilter === 'local') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UpayLogo className="h-7 px-2" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold">
                  UCB Mobile
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.upay?.enabled ?? false}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    upay: { 
                      ...(settings.upay || { enabled: false, merchantNumber: '', type: 'Personal', instructions: '' }), 
                      enabled: e.target.checked 
                    } 
                  })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Custom Logo Row */}
            <GatewayLogoControl
              gatewayId="upay"
              gatewayName="Upay"
              customLogo={settings.upay?.customLogo}
              onChangeCustomLogo={(newLogo) => setSettings({ 
                ...settings, 
                upay: { 
                  ...(settings.upay || { enabled: false, merchantNumber: '', type: 'Personal', instructions: '' }), 
                  customLogo: newLogo 
                } 
              })}
              renderDefaultLogo={() => <UpayLogo className="h-5 px-1 text-[10px]" />}
            />

            <div className="space-y-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Upay Number</label>
                <input
                  type="text"
                  value={settings.upay?.merchantNumber || ''}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    upay: { 
                      ...(settings.upay || { enabled: false, merchantNumber: '', type: 'Personal', instructions: '' }), 
                      merchantNumber: e.target.value 
                    } 
                  })}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Account Type Tag</label>
                <input
                  type="text"
                  value={settings.upay?.type || 'Personal / Send Money'}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    upay: { 
                      ...(settings.upay || { enabled: false, merchantNumber: '', type: 'Personal', instructions: '' }), 
                      type: e.target.value 
                    } 
                  })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Payment Instructions</label>
                <textarea
                  rows={2}
                  value={settings.upay?.instructions || ''}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    upay: { 
                      ...(settings.upay || { enabled: false, merchantNumber: '', type: 'Personal', instructions: '' }), 
                      instructions: e.target.value 
                    } 
                  })}
                  placeholder="Instructions for customer sending money via Upay"
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 15. Binance Pay */}
        {(activeCategoryFilter === 'all' || activeCategoryFilter === 'crypto') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BinanceLogo className="h-7 px-2" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 font-bold">
                  USDT Instant
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.binance.enabled}
                  onChange={(e) => setSettings({ ...settings, binance: { ...settings.binance, enabled: e.target.checked } })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Custom Logo Row */}
            <GatewayLogoControl
              gatewayId="binance"
              gatewayName="Binance Pay"
              customLogo={settings.binance.customLogo}
              onChangeCustomLogo={(newLogo) => setSettings({ ...settings, binance: { ...settings.binance, customLogo: newLogo } })}
              renderDefaultLogo={() => <BinanceLogo className="h-5 px-1 text-[10px]" />}
            />

            <div className="space-y-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Binance Pay ID</label>
                <input
                  type="text"
                  value={settings.binance.payId}
                  onChange={(e) => setSettings({ ...settings, binance: { ...settings.binance, payId: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">USDT TRC20 / BEP20 Address (Optional)</label>
                <input
                  type="text"
                  value={settings.binance.usdtAddress || ''}
                  onChange={(e) => setSettings({ ...settings, binance: { ...settings.binance, usdtAddress: e.target.value } })}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 16. Bank Wire / Transfer */}
        {(activeCategoryFilter === 'all' || activeCategoryFilter === 'local' || activeCategoryFilter === 'international') && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg shadow-slate-900/5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BankLogo className="h-7 px-2" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20 font-bold">
                  SWIFT / IBAN
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.bankTransfer.enabled}
                  onChange={(e) => setSettings({ ...settings, bankTransfer: { ...settings.bankTransfer, enabled: e.target.checked } })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Custom Logo Row */}
            <GatewayLogoControl
              gatewayId="bank"
              gatewayName="Bank Transfer"
              customLogo={settings.bankTransfer.customLogo}
              onChangeCustomLogo={(newLogo) => setSettings({ ...settings, bankTransfer: { ...settings.bankTransfer, customLogo: newLogo } })}
              renderDefaultLogo={() => <BankLogo className="h-5 px-1 text-[10px]" />}
            />

            <div className="space-y-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Bank Name</label>
                  <input
                    type="text"
                    value={settings.bankTransfer.bankName}
                    onChange={(e) => setSettings({ ...settings, bankTransfer: { ...settings.bankTransfer, bankName: e.target.value } })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Account Number / IBAN</label>
                  <input
                    type="text"
                    value={settings.bankTransfer.accountNumber}
                    onChange={(e) => setSettings({ ...settings, bankTransfer: { ...settings.bankTransfer, accountNumber: e.target.value } })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Routing Number</label>
                  <input
                    type="text"
                    value={settings.bankTransfer.routingNumber}
                    onChange={(e) => setSettings({ ...settings, bankTransfer: { ...settings.bankTransfer, routingNumber: e.target.value } })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">SWIFT / BIC Code</label>
                  <input
                    type="text"
                    value={settings.bankTransfer.swift}
                    onChange={(e) => setSettings({ ...settings, bankTransfer: { ...settings.bankTransfer, swift: e.target.value } })}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Custom Gateways Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Dynamic Custom Gateways Builder (Repeater)
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Create unlimited custom payment methods (JazzCash, Easypaisa, Chipper Cash, SadaPay, Local Wallets, or Direct QR codes).
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAddCustom}
            className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add New Gateway
          </button>
        </div>

        {settings.customGateways.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            No custom payment gateways created yet. Click "Add New Gateway" to create one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settings.customGateways.map((gw) => (
              <div
                key={gw.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {gw.iconUrl ? (
                      <img src={gw.iconUrl} alt={gw.name} className="w-6 h-6 rounded object-contain" />
                    ) : (
                      <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-500 font-black text-[10px] flex items-center justify-center">
                        {gw.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                      {gw.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gw.enabled}
                        onChange={(e) => {
                          const updated = settings.customGateways.map((g) =>
                            g.id === gw.id ? { ...g, enabled: e.target.checked } : g
                          );
                          setSettings({ ...settings, customGateways: updated });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>

                    <button
                      type="button"
                      onClick={() => handleOpenEditCustom(gw)}
                      className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCustomGateway(gw.id)}
                      className="p-1 rounded bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                  <div><strong className="text-slate-900 dark:text-white">Account:</strong> {gw.accountDetails || 'None'}</div>
                  <div className="line-clamp-2"><strong className="text-slate-900 dark:text-white">Instructions:</strong> {gw.instructions}</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    Inputs: {(gw.requiredFields || ['TrxID']).join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Add/Edit Custom Payment Gateway */}
      {isCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-base font-black text-slate-900 dark:text-white font-heading flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                {editingCustomGateway ? 'Edit Custom Gateway' : 'Add New Custom Payment Gateway'}
              </h2>
              <button
                type="button"
                onClick={() => setIsCustomModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomGateway} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Gateway / Wallet Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JazzCash Mobile / SadaPay / Chipper Cash"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Logo / Icon Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={customIconUrl}
                    onChange={(e) => setCustomIconUrl(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category Type</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="wallet">Digital Wallet</option>
                    <option value="mobile">Mobile Banking</option>
                    <option value="bank">Bank / Wire</option>
                    <option value="crypto">Cryptocurrency</option>
                    <option value="cards">Debit / Credit</option>
                    <option value="other">Other Method</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Merchant Account Number / Details *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Account: 03001234567 | Title: FileMarket Digital"
                  value={customAccountDetails}
                  onChange={(e) => setCustomAccountDetails(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Payment Instructions for Customer</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Step-by-step instructions on how the user should make the payment and obtain reference..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Required Customer Input Fields (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Sender Number, Transaction ID"
                  value={customFieldsText}
                  onChange={(e) => setCustomFieldsText(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={customRequireProof}
                  onChange={(e) => setCustomRequireProof(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span className="font-bold text-slate-700 dark:text-slate-300">Allow / Require Receipt Screenshot Upload</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCustomModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black shadow-md cursor-pointer"
                >
                  {editingCustomGateway ? 'Update Gateway' : 'Create Gateway'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentSettingsView;
