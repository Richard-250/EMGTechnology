import {HomeFitnessCatalog} from "@/components/commerce/home-fitness-catalog";
import {getRouteLocale} from "@/i18n/server";
import {getActiveCurrencyCode} from "@/lib/currency-server";
import {query} from "@/lib/vendure/api";
import {SearchProductsQuery} from "@/lib/vendure/queries";
import {sortProductsNewestFirst} from "@/lib/product-sort";
import {cacheLife, cacheTag} from "next/cache";
import {getTranslations} from "next-intl/server";

/** Fetch every product in the catalog (headroom for growth). */
const PRODUCTS_TAKE = 200;

async function getAllProducts(currencyCode: string) {
    "use cache";
    cacheLife("hours");

    const locale = await getRouteLocale();
    cacheTag(`home-catalog-${locale}-${currencyCode}`);
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

export async function HomeFitnessCatalogSection() {
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const t = await getTranslations({locale, namespace: "Home"});

    const {items: allProducts, totalItems} = await getAllProducts(currencyCode);

    if (!allProducts || allProducts.length === 0) {
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
            }}
        />
    );
}

