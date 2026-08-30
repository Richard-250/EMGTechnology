/** Rwanda VAT display helpers (Nyereka-style incl./excl. toggle). */
export const RWANDA_VAT_RATE = 18;

export function priceExclVat(amountWithTax: number, rate = RWANDA_VAT_RATE): number {
    return Math.round(amountWithTax / (1 + rate / 100));
}

export function vatAmount(amountWithTax: number, rate = RWANDA_VAT_RATE): number {
    return amountWithTax - priceExclVat(amountWithTax, rate);
}

export function displayAmount(amountWithTax: number, includeVat: boolean, rate = RWANDA_VAT_RATE): number {
    return includeVat ? amountWithTax : priceExclVat(amountWithTax, rate);
}
