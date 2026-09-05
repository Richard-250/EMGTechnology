import {query} from '@/lib/vendure/api';
import {GetDiscountedProductsQuery} from '@/lib/vendure/queries';
import type {DealProductCardData, ProductDiscountFields} from '@/lib/discount-display';

export function mapDealProducts(
    items: Array<{
        id: string;
        name: string;
        slug: string;
        featuredAsset?: {preview?: string | null} | null;
        collections?: Array<{
            id: string;
            slug: string;
            parent?: {id: string} | null;
        }> | null;
        variants?: Array<{
            id: string;
            currencyCode: string;
            priceWithTax?: number | null;
            customFields?: Record<string, unknown> | null;
        }> | null;
        customFields?: Record<string, unknown> | null;
    }>,
    currencyCode: string,
    options?: {superDealOnly?: boolean},
): DealProductCardData[] {
    const superDealOnly = options?.superDealOnly ?? true;

    return items
        .filter(item => {
            const cf = item.customFields as ProductDiscountFields | null | undefined;
            if (superDealOnly) {
                return cf?.isDiscounted === true;
            }
            return (
                cf?.isDiscounted === true ||
                (cf?.discountPercentage != null && cf.discountPercentage > 0) ||
                (cf?.discountAmount != null && cf.discountAmount > 0) ||
                (cf?.originalPrice != null && cf.originalPrice > 0)
            );
        })
        .map(item => {
            const cf = item.customFields as ProductDiscountFields | null | undefined;
            const firstVariant = item.variants?.[0];
            const variantCf = firstVariant?.customFields as {
                variantDiscountPercentage?: number | null;
                variantDiscountAmount?: number | null;
                variantOriginalPrice?: number | null;
            } | undefined;

            const primaryCollection =
                item.collections?.find(c => c.parent?.id) ?? item.collections?.[0];

            const mergedCustomFields: ProductDiscountFields = {
                isDiscounted: cf?.isDiscounted === true,
                discountType: cf?.discountType ?? 'percentage',
                discountPercentage:
                    variantCf?.variantDiscountPercentage ?? cf?.discountPercentage ?? null,
                discountAmount: variantCf?.variantDiscountAmount ?? cf?.discountAmount ?? null,
                originalPrice: variantCf?.variantOriginalPrice ?? cf?.originalPrice ?? null,
            };

            return {
                productId: item.id,
                productVariantId: firstVariant?.id || item.id,
                productName: item.name,
                slug: item.slug,
                image: item.featuredAsset?.preview ?? null,
                currencyCode: (firstVariant?.currencyCode ||
                    currencyCode) as DealProductCardData['currencyCode'],
                price: firstVariant?.priceWithTax ?? null,
                priceMin: null,
                priceMax: null,
                customFields: mergedCustomFields,
                collectionSlug: primaryCollection?.slug,
            };
        });
}

export async function fetchDealProducts(
    locale: string,
    currencyCode: string,
    options?: {superDealOnly?: boolean; take?: number},
): Promise<DealProductCardData[]> {
    const result = await query(
        GetDiscountedProductsQuery,
        {
            options: {
                take: options?.take ?? 100,
            },
        },
        {languageCode: locale, currencyCode},
    );

    return mapDealProducts(result.data.products?.items || [], currencyCode, {
        superDealOnly: options?.superDealOnly ?? true,
    });
}
