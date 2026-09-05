import {HomeFitnessCatalog} from "@/components/commerce/home-fitness-catalog";
import {getRouteLocale} from "@/i18n/server";
import {connection} from 'next/server';
import {getActiveCurrencyCode} from "@/lib/currency-server";
import {withLiveFallback} from '@/lib/vendure/live-fallback';
import {query} from "@/lib/vendure/api";
import {SearchProductsQuery} from "@/lib/vendure/queries";
import {sortProductsNewestFirst} from "@/lib/product-sort";
import {cacheLife, cacheTag} from "next/cache";
import {getTranslations} from "next-intl/server";
import {isPrerenderAbortError} from '@/lib/prerender';
import type {FragmentOf} from '@/graphql';
import type {ProductCardFragment} from '@/lib/vendure/fragments';

/** Fetch every product in the catalog (headroom for growth). */
const PRODUCTS_TAKE = 200;

async function fetchAllProducts(locale: string, currencyCode: string) {
    const result = await query(
        SearchProductsQuery,
        {
            input: {
                take: PRODUCTS_TAKE,
                skip: 0,
                groupByProduct: true,
            },
        },
        {languageCode: locale, currencyCode},
    );
    return {
        items: sortProductsNewestFirst(result.data.search.items),
        totalItems: result.data.search.totalItems,
    };
}

async function getAllProductsCached(currencyCode: string) {
    "use cache";
    // Short TTL so newly added catalog products appear soon after refresh
    cacheLife("minutes");

    const locale = await getRouteLocale();
    cacheTag(`home-catalog-${locale}-${currencyCode}`);
    cacheTag(`products-${locale}-${currencyCode}`);

    return fetchAllProducts(locale, currencyCode);
}

export async function HomeFitnessCatalogSection() {
    await connection();

    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const t = await getTranslations({locale, namespace: "Home"});

    let allProducts: FragmentOf<typeof ProductCardFragment>[] = [];
    let totalItems = 0;

    try {
        const catalog = await withLiveFallback(
            () => getAllProductsCached(currencyCode),
            () => fetchAllProducts(locale, currencyCode),
            (value) => value.items.length === 0,
        );
        allProducts = catalog.items;
        totalItems = catalog.totalItems;
    } catch (error) {
        if (!isPrerenderAbortError(error)) {
            console.error('Error fetching home catalog products:', error);
        }
    }

    if (!allProducts.length) {
        return null;
    }

    return (
        <HomeFitnessCatalog
            products={allProducts}
            totalProducts={totalItems}
            labels={{
                title: t("fitnessCatalog"),
                subtitle: t("fitnessCatalogSubtitle"),
                all: t("allProducts"),
                showing: t("showingProducts"),
                loadMore: t("loadMore"),
            }}
        />
    );
}
