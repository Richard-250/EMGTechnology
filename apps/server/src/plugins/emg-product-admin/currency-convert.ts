/**
 * Shared RWF ↔ USD helpers. Prefer the live admin rate from GlobalSettings when available.
 */
export const DEFAULT_RWF_PER_USD = 1300;

export function rwfMinorToUsdMinor(rwfMinor: number, rwfPerUsd = DEFAULT_RWF_PER_USD): number {
    const rate = rwfPerUsd > 0 ? rwfPerUsd : DEFAULT_RWF_PER_USD;
    const rwfMajor = rwfMinor / 100;
    return Math.max(100, Math.round((rwfMajor / rate) * 100));
}

export function usdMinorToRwfMinor(usdMinor: number, rwfPerUsd = DEFAULT_RWF_PER_USD): number {
    const rate = rwfPerUsd > 0 ? rwfPerUsd : DEFAULT_RWF_PER_USD;
    const usdMajor = usdMinor / 100;
    return Math.max(100, Math.round(usdMajor * rate * 100));
}
