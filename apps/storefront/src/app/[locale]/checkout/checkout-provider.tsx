'use client';

import { createContext, useContext, ReactNode, useState } from 'react';
import { CheckoutOrder } from './types';
import type { CardPaymentDetails, MobileMoneyDetails, PaymentDetailsMetadata } from './payment-details';

interface CustomerAddress {
  id: string;
  fullName?: string | null;
  company?: string | null;
  streetLine1: string;
  streetLine2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country: { id: string; code: string; name: string };
  phoneNumber?: string | null;
  defaultShippingAddress?: boolean | null;
  defaultBillingAddress?: boolean | null;
}

interface Country {
  id: string;
  code: string;
  name: string;
}

interface ShippingMethod {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  priceWithTax: number;
}

interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isEligible: boolean;
  eligibilityMessage?: string | null;
}

interface CheckoutContextType {
  order: CheckoutOrder;
  addresses: CustomerAddress[];
  countries: Country[];
  shippingMethods: ShippingMethod[];
  paymentMethods: PaymentMethod[];
  selectedPaymentMethodCode: string | null;
  setSelectedPaymentMethodCode: (code: string | null) => void;
  cardDetails: CardPaymentDetails;
  setCardDetails: (details: CardPaymentDetails) => void;
  mobileMoneyDetails: MobileMoneyDetails;
  setMobileMoneyDetails: (details: MobileMoneyDetails) => void;
  paymentDetailsMetadata: PaymentDetailsMetadata | null;
  setPaymentDetailsMetadata: (metadata: PaymentDetailsMetadata | null) => void;
  isGuest: boolean;
}

const CheckoutContext = createContext<CheckoutContextType | null>(null);

const EMPTY_CARD: CardPaymentDetails = {
  cardholderName: '',
  cardNumber: '',
  expiryMonth: '',
  expiryYear: '',
  cvv: '',
};

const EMPTY_MOBILE: MobileMoneyDetails = {
  phoneNumber: '',
  status: 'idle',
};

interface CheckoutProviderProps {
  children: ReactNode;
  order: CheckoutOrder;
  addresses: CustomerAddress[];
  countries: Country[];
  shippingMethods: ShippingMethod[];
  paymentMethods: PaymentMethod[];
  isGuest: boolean;
}

export function CheckoutProvider({
  children,
  order,
  addresses,
  countries,
  shippingMethods,
  paymentMethods,
  isGuest,
}: CheckoutProviderProps) {
  const [selectedPaymentMethodCode, setSelectedPaymentMethodCode] = useState<string | null>(
    paymentMethods.length === 1 ? paymentMethods[0].code : null
  );
  const [cardDetails, setCardDetails] = useState<CardPaymentDetails>(EMPTY_CARD);
  const [mobileMoneyDetails, setMobileMoneyDetails] = useState<MobileMoneyDetails>(EMPTY_MOBILE);
  const [paymentDetailsMetadata, setPaymentDetailsMetadata] = useState<PaymentDetailsMetadata | null>(null);

  const handleSetPaymentMethod = (code: string | null) => {
    setSelectedPaymentMethodCode(code);
    setPaymentDetailsMetadata(null);
    setMobileMoneyDetails(EMPTY_MOBILE);
  };

  return (
    <CheckoutContext.Provider
      value={{
        order,
        addresses,
        countries,
        shippingMethods,
        paymentMethods,
        selectedPaymentMethodCode,
        setSelectedPaymentMethodCode: handleSetPaymentMethod,
        cardDetails,
        setCardDetails,
        mobileMoneyDetails,
        setMobileMoneyDetails,
        paymentDetailsMetadata,
        setPaymentDetailsMetadata,
        isGuest,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within CheckoutProvider');
  }
  return context;
}
