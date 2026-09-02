import {ProductCard} from "@/components/commerce/product-card";
import {getRouteLocale} from "@/i18n/server";
import {cacheLife, cacheTag} from "next/cache";
import {getActiveCurrencyCode} from "@/lib/currency-server";
import {query} from "@/lib/vendure/api";
import {SearchProductsQuery} from "@/lib/vendure/queries";
import {Link} from "@/i18n/navigation";
import {ArrowRight} from "lucide-react";
import {getTranslations} from "next-intl/server";

async function getCatalogProducts(currencyCode: string) {
    "use cache";
    cacheLife("hours");

    const locale = await getRouteLocale();
    cacheTag(`home-catalog-${locale}-${currencyCode}`);
    cacheTag(`products-${locale}-${currencyCode}`);

    const result = await query(
        SearchProductsQuery,
        {
            input: {
                take: 8,
                skip: 0,
                groupByProduct: true,
                sort: {name: "ASC"},
            },
        },
        {languageCode: locale, currencyCode},
    );

    return result.data.search.items;
}

/**
 * ShopIt-style product listing strip on the homepage.
 */
export async function HomeCatalogSection() {
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const t = await getTranslations({locale, namespace: "Home"});
    const products = await getCatalogProducts(currencyCode);

    if (!products.length) {
        return null;
    }

    return (
        <section className="border-t border-border py-16 md:py-20 bg-muted/20">
            <div className="container mx-auto px-4">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 md:mb-12">
                    <div className="max-w-xl">
                        <h2 className="font-display text-4xl md:text-5xl tracking-[0.03em]">
                            {t("fitnessCatalog")}
                        </h2>
                        <p className="mt-3 text-muted-foreground text-base md:text-lg leading-relaxed">
                            {t("fitnessCatalogSubtitle")}
                        </p>
                    </div>
                    <Link
                        href="/search"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-electric hover:underline underline-offset-4"
                    >
                        {t("viewFullCatalog")}
                        <ArrowRight className="size-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                    {products.map((product, i) => (
                        <ProductCard key={`home-catalog-${i}`} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
