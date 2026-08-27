import React from 'react';
import { Product, Currency } from '../types';
import { CheckoutPage } from './CheckoutPage';

export interface PaymentCheckoutModalProps {
  product: Product | null;
  currency?: Currency;
  isOpen?: boolean;
  onClose?: () => void;
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

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  product,
  currency = 'BDT',
  isOpen = true,
  onClose,
  onBack,
  onExploreStore,
  onOpenXmlStudio,
  darkMode,
  setDarkMode,
  setCurrency,
  onOpenProfile,
  onOpenDrawer,
  onOpenAiSeo,
  onOpenSearch,
  searchQuery,
  setSearchQuery,
  isHeaderVisible,
  onOpenAuthModal
}) => {
  if (!product || isOpen === false) return null;

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else if (typeof onClose === 'function') {
      onClose();
    } else {
      window.history.back();
    }
  };

  return (
    <CheckoutPage
      product={product}
      currency={currency}
      onBack={handleBack}
      onExploreStore={onExploreStore}
      onOpenXmlStudio={onOpenXmlStudio}
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      setCurrency={setCurrency}
      onOpenProfile={onOpenProfile}
      onOpenDrawer={onOpenDrawer}
      onOpenAiSeo={onOpenAiSeo}
      onOpenSearch={onOpenSearch}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      isHeaderVisible={isHeaderVisible}
      onOpenAuthModal={onOpenAuthModal}
    />
  );
};

export default PaymentCheckoutModal;
