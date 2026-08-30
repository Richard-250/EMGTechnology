import {getRouteLocale} from '@/i18n/server';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {query} from '@/lib/vendure/api';
import {SearchProductsQuery} from '@/lib/vendure/queries';
import {serializeProductCard} from '@/lib/product-price';
import {getDiscountPercent} from '@/lib/product-badges';
import {cacheLife, cacheTag} from 'next/cache';
import {FlashDealsSection} from '@/components/commerce/flash-deals-section';

async function getDealProducts(currencyCode: string) {
    'use cache';
    cacheLife('hours');

    const locale = await getRouteLocale();
    cacheTag(`deals-${locale}-${currencyCode}`);
    cacheTag('products');

    const result = await query(
        SearchProductsQuery,
        {
            input: {
                take: 48,
                skip: 0,
                groupByProduct: true,
            },
        },
        {languageCode: locale, currencyCode},
    );

    return result.data.search.items
        .map(item => serializeProductCard(item))
        .filter(product => getDiscountPercent(product.slug) != null);
}

export async function FlashDealsLoader() {
    const currencyCode = await getActiveCurrencyCode();
    const products = await getDealProducts(currencyCode);
    return <FlashDealsSection products={products} />;
}
