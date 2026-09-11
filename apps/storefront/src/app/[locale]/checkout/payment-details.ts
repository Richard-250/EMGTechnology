export interface CardPaymentDetails {
    cardholderName: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
}

/** MoMo / Airtel checkout — only a payment screenshot is required from the customer. */
export interface MobileMoneyCheckoutDetails {
    proofFileName: string;
    proofMimeType: string;
    /** Data URL or raw base64 — cleared after upload */
    proofDataUrl: string;
    /** Set after successful Cloudinary upload */
    proofUrl: string;
}

export interface PaymentMethodCustomFields {
    merchantDisplayName?: string | null;
    merchantPhone?: string | null;
    merchantMomoCode?: string | null;
    paymentSteps?: string | null;
}

export const DEFAULT_MOMO_MERCHANT: Record<
    'mtn-rwanda' | 'airtel-rwanda',
    Required<Pick<PaymentMethodCustomFields, 'merchantDisplayName' | 'merchantPhone' | 'merchantMomoCode' | 'paymentSteps'>>
> = {
    'mtn-rwanda': {
        merchantDisplayName: 'EMG Technology Ltd',
        merchantPhone: '+250796345773',
        merchantMomoCode: '*182*8*1*0796345773#',
        paymentSteps:
            'Dial the USSD code shown above\nEnter the exact order amount in RWF\nUse your payment reference as the reason / message\nTake a screenshot of the successful payment and upload it below',
    },
    'airtel-rwanda': {
        merchantDisplayName: 'EMG Technology Ltd',
        merchantPhone: '+250796345773',
        merchantMomoCode: '*185*1*0796345773#',
        paymentSteps:
            'Dial the USSD code shown above\nEnter the exact order amount in RWF\nUse your payment reference as the reason / message\nTake a screenshot of the successful payment and upload it below',
    },
};

export function resolvePaymentMethodFields(
    providerCode: 'mtn-rwanda' | 'airtel-rwanda',
    customFields?: PaymentMethodCustomFields | null,
): PaymentMethodCustomFields {
    return {
        ...DEFAULT_MOMO_MERCHANT[providerCode],
        ...customFields,
    };
}

export interface PaymentDetailsMetadata {
    cardLast4?: string;
    cardBrand?: string;
    mobileMoneyProvider?: string;
    paymentReference?: string;
    paymentProofUrl?: string;
    deliveryDate?: string;
    deliveryMethodName?: string;
}

export function digitsOnly(value: string): string {
    return value.replace(/\D/g, '');
}

export function formatCardNumber(value: string): string {
    const digits = digitsOnly(value).slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function isCardFormValid(card: CardPaymentDetails): boolean {
    const digits = digitsOnly(card.cardNumber);
    const month = Number(card.expiryMonth);
    const year = Number(card.expiryYear);
    const cvv = digitsOnly(card.cvv);

    return (
        card.cardholderName.trim().length >= 2 &&
        digits.length >= 13 &&
        digits.length <= 19 &&
        month >= 1 &&
        month <= 12 &&
        year >= new Date().getFullYear() % 100 &&
        cvv.length >= 3 &&
        cvv.length <= 4
    );
}

/** Customer must attach a payment screenshot before placing the order. */
export function isMobileMoneyCheckoutValid(details: MobileMoneyCheckoutDetails): boolean {
    return Boolean(details.proofUrl.trim()) || Boolean(details.proofDataUrl.trim());
}

export function buildPaymentReference(methodCode: string, orderCode?: string | null): string {
    const suffix = orderCode ?? `${Date.now()}`.slice(-8);
    const prefix = methodCode === 'airtel-rwanda' ? 'EMG-AIRTEL' : methodCode === 'mtn-rwanda' ? 'EMG-MOMO' : 'EMG';
    return `${prefix}-${suffix}`;
}

export function buildPaymentMetadata(
    paymentMethodCode: string,
    options?: {
        card?: CardPaymentDetails;
        mobile?: MobileMoneyCheckoutDetails;
        paymentReference?: string;
        deliveryDate?: string;
        deliveryMethodName?: string;
    },
): PaymentDetailsMetadata {
    if (paymentMethodCode === 'card' && options?.card) {
        const digits = digitsOnly(options.card.cardNumber);
        return {
            cardLast4: digits.slice(-4),
            cardBrand: digits.startsWith('4') ? 'Visa' : digits.startsWith('5') ? 'Mastercard' : 'Card',
            paymentReference: options.paymentReference,
            deliveryDate: options.deliveryDate,
            deliveryMethodName: options.deliveryMethodName,
        };
    }

    if ((paymentMethodCode === 'mtn-rwanda' || paymentMethodCode === 'airtel-rwanda') && options?.mobile) {
        return {
            mobileMoneyProvider: paymentMethodCode === 'mtn-rwanda' ? 'MTN Mobile Money' : 'Airtel Money',
            paymentReference: options.paymentReference,
            paymentProofUrl: options.mobile.proofUrl.trim(),
            deliveryDate: options.deliveryDate,
            deliveryMethodName: options.deliveryMethodName,
        };
    }

    return {
        paymentReference: options?.paymentReference,
        deliveryDate: options?.deliveryDate,
        deliveryMethodName: options?.deliveryMethodName,
    };
}

export function parsePaymentSteps(steps?: string | null): string[] {
    if (!steps?.trim()) return [];
    return steps
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
}
