import Image from 'next/image';
import {getTranslations} from 'next-intl/server';
import {ArrowLeft, ShoppingBag} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {query} from '@/lib/vendure/api';
import {GetCollectionProductsQuery, SearchProductsQuery} from '@/lib/vendure/queries';
import {readFragment} from '@/graphql';
import {ProductCardFragment} from '@/lib/vendure/fragments';
import {Button} from '@/components/ui/button';
import {ProductCard} from '@/components/commerce/product-card';
import {SITE_LOGO_LIGHT, SITE_NAME} from '@/lib/metadata';
import {ProductNotFoundSearch} from './product-not-found-search';

async function getRecommendedProducts(locale: string, currencyCode: string) {
    try {
        const featured = await query(
            GetCollectionProductsQuery,
            {
                slug: 'featured',
                input: {
                    collectionSlug: 'featured',
                    take: 8,
                    skip: 0,
                    groupByProduct: true,
                },
            },
            {languageCode: locale, currencyCode},
        );

        if (featured.data.search.items.length > 0) {
            return featured.data.search.items;
        }
    } catch {
        // Fall through
    }

    try {
        const fallback = await query(
            SearchProductsQuery,
            {
                input: {
                    take: 8,
                    skip: 0,
                    groupByProduct: true,
                },
            },
            {languageCode: locale, currencyCode},
        );
        return fallback.data.search.items;
    } catch {
        return [];
    }
}

export default async function ProductNotFound() {
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const t = await getTranslations({locale, namespace: 'ProductNotFound'});
    const products = await getRecommendedProducts(locale, currencyCode);

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-muted/40 via-background to-background">
            <section className="border-b border-border/60 bg-[#0C1210] text-white">
                <div className="container mx-auto px-4 py-12 md:py-16">
                    <div className="mx-auto max-w-2xl text-center space-y-5">
                        <Image
                            src={SITE_LOGO_LIGHT}
                            alt={SITE_NAME}
                            width={160}
                            height={56}
                            className="mx-auto h-11 w-auto object-contain"
                        />
                        <p className="font-display text-5xl md:text-6xl tracking-[0.04em] text-electric">
                            404
                        </p>
                        <h1 className="font-display text-3xl md:text-4xl tracking-[0.03em]">
                            {t('title')}
                        </h1>
                        <p className="text-sm md:text-base text-white/75 leading-relaxed max-w-lg mx-auto">
                            {t('message')}
                        </p>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-10 md:py-14 space-y-12 md:space-y-16">
                <div className="mx-auto max-w-xl space-y-4">
                    <p className="text-sm font-medium text-muted-foreground text-center">
                        {t('searchHeading')}
                    </p>
                    <ProductNotFoundSearch />
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-2">
                        <Button
                            nativeButton={false}
                            render={<Link href="/search" />}
                            size="lg"
                            className="justify-center"
                        >
                            <ShoppingBag className="mr-2 size-4" />
                            {t('backToShop')}
                        </Button>
                        <Button
                            nativeButton={false}
                            render={<Link href="/" />}
                            variant="outline"
                            size="lg"
                            className="justify-center"
                        >
                            <ArrowLeft className="mr-2 size-4" />
                            {t('backHome')}
                        </Button>
                    </div>
                    <p className="text-center text-xs text-muted-foreground pt-1">{t('helpHint')}</p>
                </div>

                {products.length > 0 && (
                    <section className="space-y-6">
                        <div className="text-center space-y-2">
                            <h2 className="font-display text-3xl md:text-4xl tracking-[0.03em]">
                                {t('recommended')}
                            </h2>
                            <p className="text-sm text-muted-foreground">{t('recommendedHint')}</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                            {products.slice(0, 8).map(product => {
                                const card = readFragment(ProductCardFragment, product);
                                return (
                                    <ProductCard key={card.productId} product={product} />
                                );
                            })}
                        </div>
                        <div className="flex justify-center pt-2">
                            <Button
                                nativeButton={false}
                                render={<Link href="/collection/featured" />}
                                variant="outline"
                            >
                                {t('browseFeatured')}
                            </Button>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
