import {getTopCollections} from '@/lib/vendure/cached';
import {withLiveFallback} from '@/lib/vendure/live-fallback';
import {query} from '@/lib/vendure/api';
import {GetCollectionProductsQuery} from '@/lib/vendure/queries';
import {serializeProductCard, type SerializedProductCard} from '@/lib/product-price';
import {cacheLife, cacheTag} from 'next/cache';

export type CategoryProductsMap = Record<string, SerializedProductCard[]>;

async function fetchCategoryProductsMap(
    locale: string,
    currencyCode: string,
): Promise<CategoryProductsMap> {
    const collections = await getTopCollections(locale);
    const entries = await Promise.all(
        collections.map(async collection => {
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
        }),
    );

    return Object.fromEntries(entries);
}

async function getCategoryProductsMapCached(
    locale: string,
    currencyCode: string,
): Promise<CategoryProductsMap> {
    'use cache';
    cacheLife('hours');
    cacheTag(`category-products-${locale}-${currencyCode}`);
    cacheTag(`products-${locale}-${currencyCode}`);

    return fetchCategoryProductsMap(locale, currencyCode);
}

function isCategoryMapEmpty(map: CategoryProductsMap): boolean {
    const values = Object.values(map);
    return values.length === 0 || values.every(products => products.length === 0);
}

export async function getCategoryProductsMap(
    locale: string,
    currencyCode: string,
): Promise<CategoryProductsMap> {
    return withLiveFallback(
        () => getCategoryProductsMapCached(locale, currencyCode),
        () => fetchCategoryProductsMap(locale, currencyCode),
        isCategoryMapEmpty,
    );
}
