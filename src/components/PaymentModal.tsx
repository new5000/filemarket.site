import React from 'react';
import { PaymentCheckoutModal } from './PaymentCheckoutModal';
import { Product, Currency } from '../types';

export interface PaymentModalProps {
  isOpen?: boolean;
  product: Product | null;
  currency?: Currency;
  onClose: () => void;
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

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen = true,
  product,
  currency = 'BDT',
  onClose,
  onBack,
  ...props
}) => {
  if (isOpen === false || !product) return null;

  return (
    <PaymentCheckoutModal
      product={product}
      currency={currency}
      onClose={onClose}
      onBack={onBack}
      {...props}
    />
  );
};

export default PaymentModal;
