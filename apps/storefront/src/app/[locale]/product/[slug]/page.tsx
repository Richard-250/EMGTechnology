import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { connection } from 'next/server';
import { withLiveFallback } from '@/lib/vendure/live-fallback';
import { GetProductDetailQuery } from '@/lib/vendure/queries';
import { ProductDetailView } from '@/components/commerce/product-detail-view';
import { RelatedProducts } from '@/components/commerce/related-products';
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { notFound } from 'next/navigation';
import { cacheLife, cacheTag } from 'next/cache';
import { routing } from '@/i18n/routing';
import {
    SITE_NAME,
    truncateDescription,
    buildCanonicalUrl,
    buildOgImages,
} from '@/lib/metadata';
import {getTranslations} from 'next-intl/server';
import {toOgLocale} from '@/i18n/locale-utils';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {getRouteLocale} from '@/i18n/server';
import {resolveProductCarouselImages} from '@/lib/product-images';
import {getDisplayOptionGroups} from '@/lib/vendure/product-options';
import {query} from '@/lib/vendure/api';

async function fetchProductData(slug: string, locale: string, currencyCode: string) {
    return query(GetProductDetailQuery, {slug}, {languageCode: locale, currencyCode});
}

async function getProductDataCached(slug: string, currencyCode: string) {
    'use cache';
    // Short TTL so admin price edits show on the PDP quickly even if revalidation lags.
    cacheLife({stale: 30, revalidate: 60, expire: 300});

    const locale = await getRouteLocale();
    cacheTag(`product-${slug}-${locale}-${currencyCode}`);
    cacheTag(`products-${locale}-${currencyCode}`);

    return fetchProductData(slug, locale, currencyCode);
}

async function loadProductData(slug: string, locale: string, currencyCode: string) {
    // Prefer live product data for accurate prices; fall back to short-lived cache on failure.
    try {
        const live = await fetchProductData(slug, locale, currencyCode);
        if (live.data.product) {
            return live;
        }
    } catch {
        // fall through to cached
    }

    return withLiveFallback(
        () => getProductDataCached(slug, currencyCode),
        () => fetchProductData(slug, locale, currencyCode),
        (result) => !result.data.product,
    );
}

export async function generateMetadata({
    params,
}: PageProps<'/[locale]/product/[slug]'>): Promise<Metadata> {
    const { slug } = await params;
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const result = await loadProductData(slug, locale, currencyCode);
    const product = result.data.product;

    const t = await getTranslations({locale, namespace: 'Product'});

    if (!product) {
        return {
            title: t('notFound'),
        };
    }

    const description = truncateDescription(product.description);
    const fallbackDescription = t('shopProductAt', {name: product.name, siteName: SITE_NAME});
    const ogImage = product.assets?.[0]?.preview;
    const ogLocale = toOgLocale(locale);
    const productPath = `/product/${product.slug}`;

    return {
        title: product.name,
        description: description || fallbackDescription,
        alternates: {
            canonical: buildCanonicalUrl(`/${locale}${productPath}`),
            languages: Object.fromEntries(
                routing.locales.map((l) => [l, buildCanonicalUrl(`/${l}${productPath}`)])
            ),
        },
        openGraph: {
            title: product.name,
            description: description || fallbackDescription,
            type: 'website',
            locale: ogLocale,
            url: buildCanonicalUrl(`/${locale}${productPath}`),
            images: buildOgImages(ogImage, product.name),
        },
        twitter: {
            card: 'summary_large_image',
            title: product.name,
            description: description || fallbackDescription,
            images: ogImage ? [ogImage] : undefined,
        },
    };
}

export default async function ProductDetailPage({params, searchParams}: PageProps<'/[locale]/product/[slug]'>) {
    await connection();

    const { slug } = await params;
    const searchParamsResolved = await searchParams;
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const t = await getTranslations({locale, namespace: 'Product'});

    const result = await loadProductData(slug, locale, currencyCode);

    const product = result.data.product;

    if (!product) {
        notFound();
    }

    // Get the primary collection (prefer deepest nested / most specific)
    const primaryCollection = product.collections?.find(c => c.parent?.id) ?? product.collections?.[0];

    // Hide options that belong to a shared option group but have no variant on
    // this product (Vendure 3.6 shared/global option groups).
    const productForDisplay = {...product, optionGroups: getDisplayOptionGroups(product)};
    const carouselImages = resolveProductCarouselImages(product.assets, slug);

    return (
        <>
            <div className="container mx-auto px-4 py-8">
                {/* Breadcrumb Navigation */}
                <Breadcrumb className="mb-6">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink render={<Link href="/" />}>{t('home')}</BreadcrumbLink>
                        </BreadcrumbItem>
                        {primaryCollection && (
                            <>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink render={<Link href={`/collection/${primaryCollection.slug}`} />}>
                                        {primaryCollection.name}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </>
                        )}
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{product.name}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <ProductDetailView
                    product={productForDisplay}
                    searchParams={searchParamsResolved}
                    currencyCode={currencyCode}
                    carouselImages={carouselImages}
                />
            </div>

            {primaryCollection && (
                <RelatedProducts
                    collectionSlug={primaryCollection.slug}
                    currentProductId={product.id}
                />
            )}
        </>
    );
}
