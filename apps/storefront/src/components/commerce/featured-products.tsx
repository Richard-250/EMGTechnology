import {ProductCarousel} from "@/components/commerce/product-carousel";
import {getRouteLocale} from "@/i18n/server";
import {cacheLife, cacheTag} from "next/cache";
import {connection} from 'next/server';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {withLiveFallback} from '@/lib/vendure/live-fallback';
import {query} from "@/lib/vendure/api";
import {GetCollectionProductsQuery} from "@/lib/vendure/queries";
import { Link } from '@/i18n/navigation';
import {ArrowRight} from "lucide-react";
import {getTranslations} from 'next-intl/server';
import {isPrerenderAbortError} from '@/lib/prerender';
import type {FragmentOf} from '@/graphql';
import type {ProductCardFragment} from '@/lib/vendure/fragments';

async function fetchFeaturedProducts(locale: string, currencyCode: string) {
    const result = await query(GetCollectionProductsQuery, {
        slug: "featured",
        input: {
            collectionSlug: "featured",
            take: 15,
            skip: 0,
            groupByProduct: true,
        },
    }, {languageCode: locale, currencyCode});

    return result.data.search.items;
}

async function getFeaturedCollectionProductsCached(currencyCode: string) {
    'use cache'
    cacheLife('days')

    const locale = await getRouteLocale();
    cacheTag(`featured-${locale}-${currencyCode}`);
    cacheTag(`products-${locale}-${currencyCode}`);

    return fetchFeaturedProducts(locale, currencyCode);
}


export async function FeaturedProducts() {
    await connection();

    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const t = await getTranslations({locale, namespace: 'Product'});

    let products: FragmentOf<typeof ProductCardFragment>[] = [];
    try {
        products = await withLiveFallback(
            () => getFeaturedCollectionProductsCached(currencyCode),
            () => fetchFeaturedProducts(locale, currencyCode),
            (items) => items.length === 0,
        );
    } catch (error) {
        if (!isPrerenderAbortError(error)) {
            console.error('Error fetching featured products:', error);
        }
    }

    if (!products.length) {
        return null;
    }

    return (
        <div>
            <ProductCarousel
                title={t('featuredProducts')}
                products={products}
            />
            <div className="container mx-auto px-4 -mt-6 mb-8">
                <div className="flex justify-center">
                    <Link
                        href="/collection/featured"
                        className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-electric underline-offset-4 hover:underline transition-colors"
                    >
                        {t('viewAllProducts')}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
