import {ProductCard} from '@/components/commerce/product-card';
import {getRouteLocale} from '@/i18n/server';
import {cacheLife, cacheTag} from 'next/cache';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {query} from '@/lib/vendure/api';
import {GetCollectionProductsQuery} from '@/lib/vendure/queries';
import {readFragment} from '@/graphql';
import {ProductCardFragment} from '@/lib/vendure/fragments';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {ArrowRight} from 'lucide-react';

interface RelatedProductsProps {
    collectionSlug: string;
    currentProductId: string;
}

const RELATED_TAKE = 16;

async function getRelatedProducts(
    collectionSlug: string,
    currentProductId: string,
    currencyCode: string,
) {
    'use cache';
    cacheLife('hours');

    const locale = await getRouteLocale();
    cacheTag(`related-products-${collectionSlug}-${locale}-${currencyCode}`);
    cacheTag(`products-${locale}-${currencyCode}`);

    const result = await query(
        GetCollectionProductsQuery,
        {
            slug: collectionSlug,
            input: {
                collectionSlug: collectionSlug,
                take: RELATED_TAKE + 4,
                skip: 0,
                groupByProduct: true,
            },
        },
        {languageCode: locale, currencyCode},
    );

    return result.data.search.items
        .filter(item => {
            const product = readFragment(ProductCardFragment, item);
            return product.productId !== currentProductId;
        })
        .slice(0, RELATED_TAKE);
}

export async function RelatedProducts({collectionSlug, currentProductId}: RelatedProductsProps) {
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const t = await getTranslations({locale, namespace: 'Product'});
    const products = await getRelatedProducts(collectionSlug, currentProductId, currencyCode);

    if (products.length === 0) {
        return null;
    }

    return (
        <section className="relative z-10 border-t border-border py-12 md:py-16 bg-muted/20 pb-24 md:pb-28">
            <div className="container mx-auto px-4">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 md:mb-10">
                    <div className="max-w-xl">
                        <h2 className="font-display text-3xl md:text-4xl tracking-[0.03em]">
                            {t('relatedProducts')}
                        </h2>
                        <p className="mt-2 text-sm md:text-base text-muted-foreground leading-relaxed">
                            {t('relatedProductsHint')}
                        </p>
                    </div>
                    <Link
                        href={`/collection/${collectionSlug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-electric hover:underline underline-offset-4"
                    >
                        {t('viewMoreRelated')}
                        <ArrowRight className="size-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 overflow-visible relative z-10">
                    {products.map(product => {
                        const card = readFragment(ProductCardFragment, product);
                        return <ProductCard key={card.productId} product={product} />;
                    })}
                </div>

                <div className="flex justify-center mt-10">
                    <Link
                        href={`/collection/${collectionSlug}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-electric/40 bg-background px-6 py-3 text-sm font-bold text-electric hover:bg-electric/10 transition-colors"
                    >
                        {t('viewMoreRelated')}
                        <ArrowRight className="size-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
