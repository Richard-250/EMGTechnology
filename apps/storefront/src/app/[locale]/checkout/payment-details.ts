export interface CardPaymentDetails {
    cardholderName: string;
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
}

export type MobileMoneyStatus = 'idle' | 'pending' | 'completed';

export interface MobileMoneyDetails {
    phoneNumber: string;
    status: MobileMoneyStatus;
}

export interface PaymentDetailsMetadata {
    cardLast4?: string;
    cardBrand?: string;
    mobileMoneyPhone?: string;
    mobileMoneyProvider?: string;
}

export function digitsOnly(value: string): string {
    return value.replace(/\D/g, '');
}

export function formatCardNumber(value: string): string {
    const digits = digitsOnly(value).slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function maskCardNumber(cardNumber: string): string {
    const digits = digitsOnly(cardNumber);
    if (digits.length < 4) return '';
    return `•••• •••• •••• ${digits.slice(-4)}`;
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

export function buildPaymentMetadata(
    paymentMethodCode: string,
    card?: CardPaymentDetails,
    mobilePhone?: string,
): PaymentDetailsMetadata {
    if (paymentMethodCode === 'card' && card) {
        const digits = digitsOnly(card.cardNumber);
        return {
            cardLast4: digits.slice(-4),
            cardBrand: digits.startsWith('4') ? 'Visa' : digits.startsWith('5') ? 'Mastercard' : 'Card',
        };
    }

    if ((paymentMethodCode === 'mtn-rwanda' || paymentMethodCode === 'airtel-rwanda') && mobilePhone) {
        return {
            mobileMoneyPhone: normalizeRwandaMobileNumber(mobilePhone),
            mobileMoneyProvider: paymentMethodCode === 'mtn-rwanda' ? 'MTN Rwanda' : 'Airtel Rwanda',
        };
    }

    return {};
}
