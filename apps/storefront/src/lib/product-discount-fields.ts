import {graphql} from '@/graphql';
import {query} from '@/lib/vendure/api';
import type {ProductDiscountFields} from '@/lib/discount-display';

const GetProductsDiscountFieldsQuery = graphql(`
    query GetProductsDiscountFields($options: ProductListOptions) {
        products(options: $options) {
            items {
                id
                customFields {
                    isDiscounted
                    discountType
                    discountPercentage
                    discountAmount
                    originalPrice
                }
            }
        }
    }
`);

export async function fetchDiscountFieldsByProductIds(
    productIds: string[],
    locale: string,
    currencyCode: string,
): Promise<Map<string, ProductDiscountFields>> {
    const map = new Map<string, ProductDiscountFields>();
    if (!productIds.length) return map;

    const uniqueIds = [...new Set(productIds)];
    const result = await query(
        GetProductsDiscountFieldsQuery,
        {
            options: {
                take: uniqueIds.length,
                filter: {
                    id: {
                        in: uniqueIds,
                    },
                },
            },
        },
        {languageCode: locale, currencyCode},
    );

    for (const item of result.data.products?.items ?? []) {
        const cf = item.customFields as ProductDiscountFields | null | undefined;
        if (!cf) continue;
        map.set(String(item.id), {
            isDiscounted: cf.isDiscounted === true,
            discountType: cf.discountType ?? 'percentage',
            discountPercentage: cf.discountPercentage ?? null,
            discountAmount: cf.discountAmount ?? null,
            originalPrice: cf.originalPrice ?? null,
        });
    }

    return map;
}
