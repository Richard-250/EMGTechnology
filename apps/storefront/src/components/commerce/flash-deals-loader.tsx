import {getRouteLocale} from '@/i18n/server';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {query} from '@/lib/vendure/api';
import {GetDiscountedProductsQuery} from '@/lib/vendure/queries';
import type {DealProductCardData, ProductDiscountFields} from '@/lib/discount-display';
import {cacheLife, cacheTag} from 'next/cache';
import {FlashDealsSection} from '@/components/commerce/flash-deals-section';

async function getDealProducts(currencyCode: string): Promise<DealProductCardData[]> {
    'use cache';
    cacheLife('seconds');

    const locale = await getRouteLocale();
    cacheTag(`deals-${locale}-${currencyCode}`);
    cacheTag(`products-${locale}-${currencyCode}`);

    try {
        const result = await query(
            GetDiscountedProductsQuery,
            {
                options: {
                    take: 100,
                },
            },
            {languageCode: locale, currencyCode},
        );

        const items = (result.data.products?.items || []).filter(item => {
            const cf = item.customFields as ProductDiscountFields | null | undefined;
            return cf?.isDiscounted === true;
        });

        return items.map(item => {
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
                currencyCode: firstVariant?.currencyCode || currencyCode,
                price: firstVariant?.priceWithTax ?? null,
                priceMin: null,
                priceMax: null,
                customFields: mergedCustomFields,
            };
        });
    } catch (error) {
        console.error('Error fetching deal products:', error);
        return [];
    }
}

export async function FlashDealsLoader() {
    const currencyCode = await getActiveCurrencyCode();
    const products = await getDealProducts(currencyCode);
    return <FlashDealsSection products={products} />;
}
