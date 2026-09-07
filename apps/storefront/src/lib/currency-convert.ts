/**
 * Search listings always return RWF from Vendure’s search index.
 * Product detail uses ProductVariantPrice (USD when selected).
 * Convert search amounts so cards match the active currency.
 */
export const DEFAULT_RWF_PER_USD = 1300;

export function rwfMinorToUsdMinor(rwfMinor: number, rwfPerUsd = DEFAULT_RWF_PER_USD): number {
    const rate = rwfPerUsd > 0 ? rwfPerUsd : DEFAULT_RWF_PER_USD;
    const rwfMajor = rwfMinor / 100;
    return Math.max(1, Math.round((rwfMajor / rate) * 100));
}

export function usdMinorToRwfMinor(usdMinor: number, rwfPerUsd = DEFAULT_RWF_PER_USD): number {
    const rate = rwfPerUsd > 0 ? rwfPerUsd : DEFAULT_RWF_PER_USD;
    const usdMajor = usdMinor / 100;
    return Math.max(1, Math.round(usdMajor * rate * 100));
}

export function convertMinorBetweenCurrencies(
    amountMinor: number,
    fromCurrency: string,
    toCurrency: string,
    rwfPerUsd = DEFAULT_RWF_PER_USD,
): number {
    if (!Number.isFinite(amountMinor)) return amountMinor;
    if (fromCurrency === toCurrency) return amountMinor;
    if (fromCurrency === 'RWF' && toCurrency === 'USD') {
        return rwfMinorToUsdMinor(amountMinor, rwfPerUsd);
    }
    if (fromCurrency === 'USD' && toCurrency === 'RWF') {
        return usdMinorToRwfMinor(amountMinor, rwfPerUsd);
    }
    return amountMinor;
}

/** Convert a major-unit amount (e.g. customFields.originalPrice). */
export function convertMajorBetweenCurrencies(
    amountMajor: number,
    fromCurrency: string,
    toCurrency: string,
    rwfPerUsd = DEFAULT_RWF_PER_USD,
): number {
    const minor = Math.round(amountMajor * 100);
    return convertMinorBetweenCurrencies(minor, fromCurrency, toCurrency, rwfPerUsd) / 100;
}
