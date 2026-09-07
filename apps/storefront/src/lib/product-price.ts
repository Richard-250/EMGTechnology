import {FragmentOf, readFragment} from '@/graphql';
import {ProductCardFragment} from '@/lib/vendure/fragments';
import {applyActiveCurrencyToSearchPrices} from '@/lib/search-price-display';
import type {ProductDiscountFields} from '@/lib/discount-display';

type PriceWithTax = {
    __typename: 'PriceRange' | 'SinglePrice';
    min?: number;
    max?: number;
    value?: number;
};

export function getProductPrice(priceWithTax: PriceWithTax): number | null {
    if (priceWithTax.__typename === 'SinglePrice') {
        return priceWithTax.value ?? null;
    }
    if (priceWithTax.__typename === 'PriceRange') {
        return priceWithTax.min ?? null;
    }
    return null;
}

export function serializeProductCard(
    product: FragmentOf<typeof ProductCardFragment>,
    options?: {activeCurrency?: string; rwfPerUsd?: number},
) {
    const data = readFragment(ProductCardFragment, product);
    const price = getProductPrice(data.priceWithTax);
    const base = {
        productId: data.productId,
        productVariantId: data.productVariantId,
        productName: data.productName,
        slug: data.slug,
        image: data.productAsset?.preview ?? null,
        currencyCode: data.currencyCode,
        price,
        priceMin: data.priceWithTax.__typename === 'PriceRange' ? data.priceWithTax.min : null,
        priceMax: data.priceWithTax.__typename === 'PriceRange' ? data.priceWithTax.max : null,
    };

    if (!options?.activeCurrency || !options.rwfPerUsd) {
        return base;
    }

    return applyActiveCurrencyToSearchPrices(
        {...base, customFields: null as ProductDiscountFields | null},
        options.activeCurrency,
        options.rwfPerUsd,
    );
}

export type SerializedProductCard = ReturnType<typeof serializeProductCard>;
