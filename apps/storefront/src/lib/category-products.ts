import {getTopCollections} from '@/lib/vendure/cached';
import {query} from '@/lib/vendure/api';
import {GetCollectionProductsQuery} from '@/lib/vendure/queries';
import {serializeProductCard, type SerializedProductCard} from '@/lib/product-price';import {cacheLife, cacheTag} from 'next/cache';

export type CategoryProductsMap = Record<string, SerializedProductCard[]>;

export async function getCategoryProductsMap(
    locale: string,
    currencyCode: string,
): Promise<CategoryProductsMap> {
    'use cache';
    cacheLife('hours');
    cacheTag(`category-products-${locale}-${currencyCode}`);
    cacheTag('products');

    const collections = await getTopCollections(locale);
    const entries = await Promise.all(
        collections.map(async collection => {
            try {
                const result = await query(
                    GetCollectionProductsQuery,
                    {
                        slug: collection.slug,
                        input: {
                            collectionSlug: collection.slug,
                            take: 10,
                            skip: 0,
                            groupByProduct: true,
                        },
                    },
                    {languageCode: locale, currencyCode},
                );

                const products = (result.data?.search?.items || []).map(item => serializeProductCard(item));
                return [collection.slug, products] as const;
            } catch {
                return [collection.slug, []] as const;
            }
        }),
    );

    return Object.fromEntries(entries);
}
