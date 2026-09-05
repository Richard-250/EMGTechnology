/**
 * Approximate RWF ↔ USD rate used for catalog display price conversion.
 * Keep in sync with apps/server/src/configure-store.ts
 */
export const RWF_PER_USD = 1300;

/** Convert RWF minor units (cents/centimes) → USD minor units. */
export function rwfMinorToUsdMinor(rwfMinor: number): number {
    const rwfMajor = rwfMinor / 100;
    return Math.max(100, Math.round((rwfMajor / RWF_PER_USD) * 100));
}

/** Convert USD minor units → RWF minor units. */
export function usdMinorToRwfMinor(usdMinor: number): number {
    const usdMajor = usdMinor / 100;
    return Math.max(100, Math.round(usdMajor * RWF_PER_USD * 100));
}
