export interface CardPaymentDetails {
    cardholderName: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
}

export interface MobileMoneyCheckoutDetails {
    accountName: string;
    phoneNumber: string;
    transactionId: string;
    note: string;
}

export interface PaymentMethodCustomFields {
    merchantDisplayName?: string | null;
    merchantPhone?: string | null;
    merchantMomoCode?: string | null;
    paymentSteps?: string | null;
}

export interface PaymentDetailsMetadata {
    cardLast4?: string;
    cardBrand?: string;
    mobileMoneyPhone?: string;
    mobileMoneyProvider?: string;
    payerAccountName?: string;
    transactionId?: string;
    paymentNote?: string;
    paymentReference?: string;
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

export function isValidRwandaMobileNumber(phone: string): boolean {
    const digits = digitsOnly(phone);
    if (digits.startsWith('250')) {
        return digits.length === 12 && /^2507\d{8}$/.test(digits);
    }
    if (digits.startsWith('07')) {
        return digits.length === 10 && /^07\d{8}$/.test(digits);
    }
    if (digits.startsWith('7')) {
        return digits.length === 9 && /^7\d{8}$/.test(digits);
    }
    return false;
}

export function normalizeRwandaMobileNumber(phone: string): string {
    const digits = digitsOnly(phone);
    if (digits.startsWith('250')) return `+${digits}`;
    if (digits.startsWith('07')) return `+250${digits.slice(1)}`;
    if (digits.startsWith('7') && digits.length === 9) return `+250${digits}`;
    return phone.trim();
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

export function isMobileMoneyCheckoutValid(details: MobileMoneyCheckoutDetails): boolean {
    return (
        details.accountName.trim().length >= 2 &&
        isValidRwandaMobileNumber(details.phoneNumber) &&
        details.transactionId.trim().length >= 4
    );
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
            mobileMoneyPhone: normalizeRwandaMobileNumber(options.mobile.phoneNumber),
            mobileMoneyProvider: paymentMethodCode === 'mtn-rwanda' ? 'MTN Mobile Money' : 'Airtel Money',
            payerAccountName: options.mobile.accountName.trim(),
            transactionId: options.mobile.transactionId.trim(),
            paymentNote: options.mobile.note.trim() || undefined,
            paymentReference: options.paymentReference,
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
