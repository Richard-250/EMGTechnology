import {getRouteLocale} from '@/i18n/server';
import {connection} from 'next/server';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {withLiveFallback} from '@/lib/vendure/live-fallback';
import {query} from '@/lib/vendure/api';
import {GetDiscountedProductsQuery} from '@/lib/vendure/queries';
import type {DealProductCardData, ProductDiscountFields} from '@/lib/discount-display';
import {cacheLife, cacheTag} from 'next/cache';
import {FlashDealsSection} from '@/components/commerce/flash-deals-section';
import {isPrerenderAbortError} from '@/lib/prerender';

function mapDealProducts(
    items: Array<{
        id: string;
        name: string;
        slug: string;
        featuredAsset?: {preview?: string | null} | null;
        variants?: Array<{
            id: string;
            currencyCode: string;
            priceWithTax?: number | null;
            customFields?: Record<string, unknown> | null;
        }> | null;
        customFields?: Record<string, unknown> | null;
    }>,
    currencyCode: string,
): DealProductCardData[] {
    return items
        .filter(item => {
            const cf = item.customFields as ProductDiscountFields | null | undefined;
            return cf?.isDiscounted === true;
        })
        .map(item => {
            const cf = item.customFields as ProductDiscountFields | null | undefined;
            const firstVariant = item.variants?.[0];
            const variantCf = firstVariant?.customFields as {
                variantDiscountPercentage?: number | null;
                variantDiscountAmount?: number | null;
                variantOriginalPrice?: number | null;
            } | undefined;

            const mergedCustomFields: ProductDiscountFields = {
                isDiscounted: cf?.isDiscounted === true,
                discountType: cf?.discountType ?? 'percentage',
                discountPercentage: variantCf?.variantDiscountPercentage ?? cf?.discountPercentage ?? null,
                discountAmount: variantCf?.variantDiscountAmount ?? cf?.discountAmount ?? null,
                originalPrice: variantCf?.variantOriginalPrice ?? cf?.originalPrice ?? null,
            };

            return {
                productId: item.id,
                productVariantId: firstVariant?.id || item.id,
                productName: item.name,
                slug: item.slug,
                image: item.featuredAsset?.preview ?? null,
                currencyCode: (firstVariant?.currencyCode || currencyCode) as DealProductCardData['currencyCode'],
                price: firstVariant?.priceWithTax ?? null,
                priceMin: null,
                priceMax: null,
                customFields: mergedCustomFields,
            };
        });
}

async function fetchDealProducts(locale: string, currencyCode: string): Promise<DealProductCardData[]> {
    const result = await query(
        GetDiscountedProductsQuery,
        {
            options: {
                take: 100,
            },
        },
        {languageCode: locale, currencyCode},
    );

    return mapDealProducts(result.data.products?.items || [], currencyCode);
}

async function getDealProductsCached(currencyCode: string): Promise<DealProductCardData[]> {
    'use cache';
    cacheLife('seconds');

    const locale = await getRouteLocale();
    cacheTag(`deals-${locale}-${currencyCode}`);
    cacheTag(`products-${locale}-${currencyCode}`);

    return fetchDealProducts(locale, currencyCode);
}

export async function FlashDealsLoader() {
    await connection();

    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();

    let products: DealProductCardData[] = [];
    try {
        products = await withLiveFallback(
            () => getDealProductsCached(currencyCode),
            () => fetchDealProducts(locale, currencyCode),
            () => false,
        );
    } catch (error) {
        if (!isPrerenderAbortError(error)) {
            console.error('Error fetching deal products:', error);
        }
    }

    return <FlashDealsSection products={products} />;
}
