import {getRouteLocale} from '@/i18n/server';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {query} from '@/lib/vendure/api';
import {GetDiscountedProductsQuery, SearchProductsQuery} from '@/lib/vendure/queries';
import {serializeProductCard, type SerializedProductCard} from '@/lib/product-price';
import {getDiscountPercent} from '@/lib/product-badges';
import {cacheLife, cacheTag} from 'next/cache';
import {FlashDealsSection} from '@/components/commerce/flash-deals-section';

async function getDealProducts(currencyCode: string): Promise<SerializedProductCard[]> {
    'use cache';
    cacheLife('seconds');

    const locale = await getRouteLocale();
    cacheTag(`deals-${locale}-${currencyCode}`);
    cacheTag('products');

    try {
        // Query products with customFields directly from Vendure database
        const result = await query(
            GetDiscountedProductsQuery,
            {
                options: {
                    take: 50,
                },
            },
            {languageCode: locale, currencyCode},
        );

        const items = result.data.products?.items || [];
        
        // Filter products that admin explicitly marked as discounted in Vendure Admin Dashboard
        const adminDiscounted = items.filter(item => {
            const cf = (item as any).customFields;
            return cf?.isDiscounted === true || (typeof cf?.discountPercentage === 'number' && cf.discountPercentage > 0);
        });

        if (adminDiscounted.length > 0) {
            return adminDiscounted.map(item => {
                const firstVariant = item.variants?.[0];
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
                };
            });
        }

        // Fallback: If no products have been explicitly discounted by admin yet, show featured deal items
        const searchResult = await query(
            SearchProductsQuery,
            {
                input: {
                    take: 24,
                    skip: 0,
                    groupByProduct: true,
                },
            },
            {languageCode: locale, currencyCode},
        );

        return searchResult.data.search.items
            .map(item => serializeProductCard(item))
            .filter(product => getDiscountPercent(product.slug) != null);
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
