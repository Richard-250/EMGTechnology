import type {Metadata} from 'next';
import {getTranslations} from 'next-intl/server';
import {connection} from 'next/server';
import {cacheLife, cacheTag} from 'next/cache';
import {getRouteLocale} from '@/i18n/server';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {withLiveFallback} from '@/lib/vendure/live-fallback';
import {fetchDealProducts} from '@/lib/deal-products';
import type {DealProductCardData} from '@/lib/discount-display';
import {DealProductCard} from '@/components/commerce/deal-product-card';
import {ProductCardInteractive} from '@/components/commerce/product-card-interactive';
import {resolveProductImage} from '@/lib/product-images';
import {RelatedProducts} from '@/components/commerce/related-products';
import {isPrerenderAbortError} from '@/lib/prerender';
import {SITE_NAME} from '@/lib/metadata';
import {Link} from '@/i18n/navigation';

async function getDealsCached(currencyCode: string) {
    'use cache';
    cacheLife('minutes');
    const locale = await getRouteLocale();
    cacheTag(`deals-${locale}-${currencyCode}`);
    cacheTag(`products-${locale}-${currencyCode}`);
    return fetchDealProducts(locale, currencyCode, {superDealOnly: true, take: 100});
}

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Deals'});
    return {
        title: t('pageTitle'),
        description: t('pageDescription', {siteName: SITE_NAME}),
    };
}

export default async function DealsPage() {
    await connection();
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const t = await getTranslations({locale, namespace: 'Deals'});

    let products: DealProductCardData[] = [];
    try {
        products = await withLiveFallback(
            () => getDealsCached(currencyCode),
            () => fetchDealProducts(locale, currencyCode, {superDealOnly: true, take: 100}),
            items => items.length === 0,
        );
    } catch (error) {
        if (!isPrerenderAbortError(error)) {
            console.error('Error loading Super Deals page:', error);
        }
    }

    const firstProduct = products[0];

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-muted/30 via-background to-background">
            <section className="border-b border-border bg-[#0C1210] text-white">
                <div className="container mx-auto px-4 py-10 md:py-14">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-electric mb-3">
                        {t('superDeals')}
                    </p>
                    <h1 className="font-display text-4xl md:text-5xl tracking-[0.03em]">{t('pageTitle')}</h1>
                    <p className="mt-3 max-w-xl text-sm md:text-base text-white/75 leading-relaxed">
                        {t('pageDescription', {siteName: SITE_NAME})}
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-10 md:py-14 space-y-12">
                {products.length === 0 ? (
                    <div className="text-center space-y-4 py-16">
                        <p className="text-muted-foreground">{t('empty')}</p>
                        <Link
                            href="/search"
                            className="inline-flex items-center justify-center rounded-xl bg-electric px-5 py-2.5 text-sm font-bold text-electric-foreground"
                        >
                            {t('browseCatalog')}
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 overflow-visible relative z-10">
                            {products.map(product => (
                                <ProductCardInteractive
                                    key={product.productId}
                                    data={{
                                        productId: product.productId,
                                        productVariantId: product.productVariantId,
                                        productName: product.productName,
                                        slug: product.slug,
                                        imageSrc: resolveProductImage(product.image, product.slug),
                                        currencyCode: product.currencyCode,
                                        price: product.price,
                                        priceMin: product.priceMin,
                                        priceMax: product.priceMax,
                                        isPriceRange: false,
                                        customFields: product.customFields,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Compact deal strip for mobile-friendly scanning */}
                        <div className="lg:hidden flex gap-3 overflow-x-auto pb-2">
                            {products.slice(0, 8).map(product => (
                                <DealProductCard key={`strip-${product.productId}`} product={product} />
                            ))}
                        </div>
                    </>
                )}

                {firstProduct?.collectionSlug && (
                    <RelatedProducts
                        collectionSlug={firstProduct.collectionSlug}
                        currentProductId={firstProduct.productId}
                    />
                )}
            </div>
        </div>
    );
}
