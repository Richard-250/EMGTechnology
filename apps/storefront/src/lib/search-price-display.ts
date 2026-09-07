import type {ProductDiscountFields} from '@/lib/discount-display';
import {
    convertMajorBetweenCurrencies,
    convertMinorBetweenCurrencies,
} from '@/lib/currency-convert';

export interface SearchPriceFields {
    currencyCode: string;
    price: number | null;
    priceMin?: number | null;
    priceMax?: number | null;
    customFields?: ProductDiscountFields | null;
}

/**
 * Map search-index prices (usually RWF) into the shopper’s active currency
 * so listing cards match product detail.
 */
export function applyActiveCurrencyToSearchPrices<T extends SearchPriceFields>(
    input: T,
    activeCurrency: string,
    rwfPerUsd: number,
): T {
    const from = input.currencyCode || 'RWF';
    if (from === activeCurrency) {
        return {...input, currencyCode: activeCurrency};
    }

    const convertMinor = (value: number | null | undefined) =>
        value == null ? value : convertMinorBetweenCurrencies(value, from, activeCurrency, rwfPerUsd);

    const cf = input.customFields;
    let customFields = cf ?? null;
    if (cf) {
        customFields = {
            ...cf,
            originalPrice:
                cf.originalPrice != null && cf.originalPrice > 0
                    ? convertMajorBetweenCurrencies(cf.originalPrice, from, activeCurrency, rwfPerUsd)
                    : cf.originalPrice,
            discountAmount:
                cf.discountAmount != null && cf.discountAmount > 0
                    ? convertMajorBetweenCurrencies(cf.discountAmount, from, activeCurrency, rwfPerUsd)
                    : cf.discountAmount,
        };
    }

    return {
        ...input,
        currencyCode: activeCurrency,
        price: convertMinor(input.price) ?? null,
        priceMin: convertMinor(input.priceMin) ?? null,
        priceMax: convertMinor(input.priceMax) ?? null,
        customFields,
    };
}
