import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Tag, 
  ShieldCheck, 
  Package, 
  Download, 
  Truck, 
  Check, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Currency } from '../types';
import { navigateTo } from '../router';
import { formatDirectImageUrl } from '../utils/formatImageUrl';

interface CartDrawerProps {
  currency: Currency;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ currency }) => {
  const {
    cartItems,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItemsCount,
    subtotalBDT,
    subtotalUSD,
    shippingCostBDT,
    shippingCostUSD,
    discountBDT,
    discountUSD,
    totalBDT,
    totalUSD,
    hasPhysicalItems,
    hasDigitalItems,
    appliedCoupon,
    applyCouponCode,
    removeCoupon,
    couponError,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isCartDrawerOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplying(true);
    const res = applyCouponCode(couponInput.trim());
    setIsApplying(false);
    if (res.success) {
      setSuccessToast(res.message);
      setTimeout(() => setSuccessToast(null), 3000);
      setCouponInput('');
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartDrawerOpen(false);
    navigateTo('/checkout');
  };

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={() => setIsCartDrawerOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#0B1120] text-slate-900 dark:text-white shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-black text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Your Cart</span>
                  {totalItemsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-slate-950">
                      {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {hasPhysicalItems && hasDigitalItems 
                    ? 'Mixed: Instant Downloads & Parcel Delivery' 
                    : hasPhysicalItems 
                    ? 'Physical Goods • Fast Courier Delivery' 
                    : 'Digital Assets • Instant Cloud Unlock'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white">Your cart is empty</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                    Explore our vast library of verified digital master bundles and physical merchandise.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    navigateTo('/');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide transition cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <>
                {/* Clear Cart link */}
                <div className="flex justify-between items-center text-xs text-slate-400 pb-1">
                  <span>Selected items ({totalItemsCount})</span>
                  <button 
                    onClick={clearCart} 
                    className="text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  {cartItems.map((item) => {
                    const isPhysical = item.product.productKind === 'physical';
                    const unitPrice = currency === 'USD' ? item.product.priceUSD : item.product.priceBDT;
                    const itemTotal = unitPrice * item.quantity;

                    return (
                      <div 
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 flex gap-3.5 items-start transition hover:border-emerald-500/30"
                      >
                        {/* Thumbnail */}
                        <img 
                          src={formatDirectImageUrl(item.product.thumbnail) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80'} 
                          alt={item.product.title}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />

                        {/* Info & Quantity */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1 leading-snug">
                              {item.product.title}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-slate-400 hover:text-rose-500 p-1 transition cursor-pointer"
                              title="Remove item"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Product Type & Variant Badge */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className={`px-1.5 py-0.5 rounded text-[9.5px] font-extrabold uppercase tracking-wider ${
                              isPhysical 
                                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20' 
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {isPhysical ? '📦 Physical' : '⚡ Digital'}
                            </span>
                            {item.selectedColor && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                Color: {item.selectedColor}
                              </span>
                            )}
                            {item.selectedSize && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                Size: {item.selectedSize}
                              </span>
                            )}
                          </div>

                          {/* Price & Quantity Controls */}
                          <div className="flex items-center justify-between mt-2.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                            <div className="font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                              {currency === 'USD' ? `$${itemTotal.toFixed(2)}` : `৳${itemTotal.toLocaleString('en-BD')}`}
                              {item.quantity > 1 && (
                                <span className="text-[10px] text-slate-400 font-normal ml-1">
                                  ({currency === 'USD' ? `$${unitPrice}` : `৳${unitPrice}`} each)
                                </span>
                              )}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-xs">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-slate-900 dark:text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon Code Section */}
                <div className="pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Tag className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Have a Discount Coupon?</span>
                    </div>

                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div>
                            <span className="font-black tracking-wider uppercase">{appliedCoupon.code}</span>
                            <span className="text-[11px] block text-slate-600 dark:text-slate-400">
                              {appliedCoupon.discountType === 'percent' 
                                ? `${appliedCoupon.discountValue}% Discount Applied` 
                                : `৳${appliedCoupon.discountValue} Discount Applied`}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={removeCoupon}
                          className="p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                          title="Remove coupon"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          placeholder="e.g. WELCOME50, SAVE100"
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 uppercase tracking-wider font-semibold focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="submit"
                          disabled={isApplying || !couponInput.trim()}
                          className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-emerald-600 dark:hover:bg-emerald-400 dark:hover:text-slate-950 font-extrabold text-xs transition disabled:opacity-50 cursor-pointer"
                        >
                          {isApplying ? 'Applying...' : 'Apply'}
                        </button>
                      </form>
                    )}

                    {couponError && (
                      <div className="flex items-center gap-1.5 text-[11px] text-rose-500 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{couponError}</span>
                      </div>
                    )}

                    {successToast && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>{successToast}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer with Summary & Checkout Trigger */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 space-y-3.5">
              {/* Order Summary Calculations */}
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {currency === 'USD' ? `$${subtotalUSD.toFixed(2)}` : `৳${subtotalBDT.toLocaleString('en-BD')}`}
                  </span>
                </div>

                {hasPhysicalItems ? (
                  <div className="flex justify-between items-center text-cyan-600 dark:text-cyan-400">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      Shipping &amp; Delivery
                    </span>
                    <span className="font-semibold">
                      {currency === 'USD' ? `$${shippingCostUSD.toFixed(2)}` : `৳${shippingCostBDT.toLocaleString('en-BD')}`}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" />
                      Delivery
                    </span>
                    <span className="font-bold">Instant Download (Free)</span>
                  </div>
                )}

                {appliedCoupon && (discountBDT > 0 || discountUSD > 0) && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                    <span className="font-bold">
                      -{currency === 'USD' ? `$${discountUSD.toFixed(2)}` : `৳${discountBDT.toLocaleString('en-BD')}`}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Grand Total</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {currency === 'USD' ? `$${totalUSD.toFixed(2)}` : `৳${totalBDT.toLocaleString('en-BD')}`}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-heading font-black text-sm shadow-xl shadow-emerald-500/25 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Universal Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>100% Secure Checkout • 15+ Payment Gateways</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
