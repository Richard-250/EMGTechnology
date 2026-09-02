import {ProductCarousel} from "@/components/commerce/product-carousel";
import {getRouteLocale} from "@/i18n/server";
import {cacheLife, cacheTag} from "next/cache";
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {query} from "@/lib/vendure/api";
import {GetCollectionProductsQuery} from "@/lib/vendure/queries";
import { Link } from '@/i18n/navigation';
import {ArrowRight} from "lucide-react";
import {getTranslations} from 'next-intl/server';

async function getFeaturedCollectionProducts(currencyCode: string) {
    'use cache'
    cacheLife('days')

    const locale = await getRouteLocale();
    cacheTag(`featured-${locale}-${currencyCode}`);
    cacheTag(`products-${locale}-${currencyCode}`);

    try {
        const result = await query(GetCollectionProductsQuery, {
            slug: "featured",
            input: {
                collectionSlug: "featured",
                take: 15,
                skip: 0,
                groupByProduct: true
            }
        }, {languageCode: locale, currencyCode});

        return result.data.search.items;
    } catch (error) {
        console.error('Error fetching featured products:', error);
        return [];
    }
}


export async function FeaturedProducts() {
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const t = await getTranslations({locale, namespace: 'Product'});
    const products = await getFeaturedCollectionProducts(currencyCode);

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
