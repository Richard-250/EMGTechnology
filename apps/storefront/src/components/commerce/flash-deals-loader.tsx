import {getRouteLocale} from '@/i18n/server';
import {connection} from 'next/server';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {withLiveFallback} from '@/lib/vendure/live-fallback';
import type {DealProductCardData} from '@/lib/discount-display';
import {fetchDealProducts} from '@/lib/deal-products';
import {cacheLife, cacheTag} from 'next/cache';
import {FlashDealsSection} from '@/components/commerce/flash-deals-section';
import {isPrerenderAbortError} from '@/lib/prerender';

async function getDealProductsCached(currencyCode: string): Promise<DealProductCardData[]> {
    'use cache';
    cacheLife('seconds');

    const locale = await getRouteLocale();
    cacheTag(`deals-${locale}-${currencyCode}`);
    cacheTag(`products-${locale}-${currencyCode}`);

    return fetchDealProducts(locale, currencyCode, {superDealOnly: true, take: 100});
}

export async function FlashDealsLoader() {
    await connection();

    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();

    let products: DealProductCardData[] = [];
    try {
        products = await withLiveFallback(
            () => getDealProductsCached(currencyCode),
            () => fetchDealProducts(locale, currencyCode, {superDealOnly: true, take: 100}),
            () => false,
        );
    } catch (error) {
        if (!isPrerenderAbortError(error)) {
            console.error('Error fetching deal products:', error);
        }
    }

    return <FlashDealsSection products={products} />;
}
