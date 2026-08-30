import {HomeFitnessCatalog} from "@/components/commerce/home-fitness-catalog";
import {buildCategoryMenuItems} from "@/components/layout/category-nav-bar";
import {getRouteLocale} from "@/i18n/server";
import {getActiveCurrencyCode} from "@/lib/currency-server";
import {query} from "@/lib/vendure/api";
import {GetCollectionProductsQuery, SearchProductsQuery} from "@/lib/vendure/queries";
import {sortProductsNewestFirst} from "@/lib/product-sort";
import {getCategoryProductsMap} from "@/lib/category-products";
import {cacheLife, cacheTag} from "next/cache";
import {getTranslations} from "next-intl/server";

const CATEGORY_SLUGS = [
    {slug: "cardio" as const, nameKey: "cardio"},
    {slug: "strength" as const, nameKey: "strength"},
    {slug: "home-gyms" as const, nameKey: "homeGyms"},
    {slug: "accessories" as const, nameKey: "accessories"},
] as const;

/** Fetch every product in the catalog (15 in seed; headroom for growth). */
const PRODUCTS_TAKE = 200;

async function getCategoryProducts(slug: string, currencyCode: string) {
    "use cache";
    cacheLife("hours");

    const locale = await getRouteLocale();
    cacheTag(`home-catalog-${locale}-${currencyCode}`);
    const result = await query(
        GetCollectionProductsQuery,
        {
            slug,
            input: {
                collectionSlug: slug,
                take: PRODUCTS_TAKE,
                skip: 0,
                groupByProduct: true,
            },
        },
        {languageCode: locale, currencyCode},
    );
    return sortProductsNewestFirst(result.data.search.items);
}

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
    const tNav = await getTranslations({locale, namespace: "Navigation"});

    const [{items: allProducts, totalItems}, categoryMenuItems, categoryProducts, ...categoryResults] = await Promise.all([
        getAllProducts(currencyCode),
        buildCategoryMenuItems(locale),
        getCategoryProductsMap(locale, currencyCode),
        ...CATEGORY_SLUGS.map(async ({slug, nameKey}) => ({
            slug,
            label: t(`categories.${nameKey}`),
            products: await getCategoryProducts(slug, currencyCode),
        })),
    ]);

    const categories = categoryResults;
    const hasProducts = allProducts.length > 0 || categories.some(c => c.products.length > 0);
    if (!hasProducts) {
        return null;
    }

    return (
        <HomeFitnessCatalog
            categories={[
                {slug: "all", label: t("allProducts"), products: allProducts},
                ...categories,
            ]}
            totalProducts={totalItems}
            categoryMenuItems={categoryMenuItems}
            categoryProducts={categoryProducts}
            categoryMenuLabels={{
                allCategories: tNav("allCategories"),
                shopAll: tNav("shopAll"),
                viewAll: tNav("viewAllInCategory"),
                recommended: tNav("recommended"),
            }}
            labels={{
                title: t("fitnessCatalog"),
                subtitle: t("fitnessCatalogSubtitle"),
                all: t("allProducts"),
                showing: t("showingProducts"),
            }}
        />
    );
}
