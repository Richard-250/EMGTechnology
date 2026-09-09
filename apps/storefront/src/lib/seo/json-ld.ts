import {COMPANY, companySocialLinks, formatCompanyAddress} from '@/lib/company';
import {SITE_LOGO, SITE_NAME, SITE_URL, buildCanonicalUrl, truncateDescription} from '@/lib/metadata';

type JsonLd = Record<string, unknown>;

export function jsonLdScript(data: JsonLd | JsonLd[]): string {
    return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function buildOrganizationJsonLd(): JsonLd {
    const base = SITE_URL.replace(/\/$/, '');
    const logoUrl = `${base}${SITE_LOGO.startsWith('/') ? SITE_LOGO : `/${SITE_LOGO}`}`;

    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: COMPANY.legalName,
        alternateName: COMPANY.shortName,
        url: base,
        logo: logoUrl,
        email: COMPANY.email,
        telephone: COMPANY.phone,
        address: {
            '@type': 'PostalAddress',
            streetAddress: `${COMPANY.address.building}, ${COMPANY.address.road}`,
            addressLocality: COMPANY.address.city,
            addressCountry: 'RW',
        },
        sameAs: companySocialLinks(),
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: COMPANY.phone,
            contactType: 'customer service',
            areaServed: 'RW',
            availableLanguage: ['en', 'fr', 'rw'],
        },
    };
}

export function buildLocalBusinessJsonLd(): JsonLd {
    const base = SITE_URL.replace(/\/$/, '');

    return {
        '@context': 'https://schema.org',
        '@type': 'SportingGoodsStore',
        name: COMPANY.legalName,
        image: `${base}${SITE_LOGO}`,
        url: base,
        telephone: COMPANY.phone,
        email: COMPANY.email,
        address: {
            '@type': 'PostalAddress',
            streetAddress: `${COMPANY.address.building}, ${COMPANY.address.road}`,
            addressLocality: COMPANY.address.city,
            addressCountry: 'RW',
        },
        hasMap: COMPANY.mapUrl,
        description: `Shop cardio, strength, and home gym equipment at ${SITE_NAME}. ${formatCompanyAddress()}.`,
        sameAs: companySocialLinks(),
        openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: [...COMPANY.openingHours.days],
            opens: COMPANY.openingHours.opens,
            closes: COMPANY.openingHours.closes,
        },
        priceRange: '$$',
        currenciesAccepted: 'RWF, USD',
        paymentAccepted: 'Cash, Mobile Money',
    };
}

type ProductForJsonLd = {
    name: string;
    description?: string | null;
    slug: string;
    assets?: Array<{preview?: string | null} | null> | null;
    variants?: Array<{
        sku?: string | null;
        priceWithTax: number;
        stockLevel: string;
        currencyCode?: string | null;
    } | null> | null;
    collections?: Array<{name: string; slug: string} | null> | null;
};

export function buildProductJsonLd(
    product: ProductForJsonLd,
    locale: string,
    currencyCode: string,
): JsonLd {
    const url = buildCanonicalUrl(`/${locale}/product/${product.slug}`);
    const images = (product.assets ?? [])
        .map((asset) => asset?.preview)
        .filter((src): src is string => Boolean(src));
    const variants = (product.variants ?? []).filter(
        (variant): variant is NonNullable<typeof variant> => Boolean(variant),
    );
    const primary = variants[0];
    const prices = variants.map((v) => v.priceWithTax).filter((p) => Number.isFinite(p));
    const minPrice = prices.length ? Math.min(...prices) : primary?.priceWithTax;
    const inStock = variants.some(
        (v) => v.stockLevel !== 'OUT_OF_STOCK' && v.stockLevel !== '0',
    );

    const offerCurrency = primary?.currencyCode || currencyCode || 'RWF';
    const priceMajor =
        typeof minPrice === 'number' ? (minPrice / 100).toFixed(offerCurrency === 'RWF' ? 0 : 2) : undefined;

    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: truncateDescription(product.description, 5000) || product.name,
        sku: primary?.sku || undefined,
        image: images.length ? images : undefined,
        brand: {
            '@type': 'Brand',
            name: SITE_NAME,
        },
        url,
        offers: {
            '@type': 'Offer',
            url,
            priceCurrency: offerCurrency,
            price: priceMajor,
            availability: inStock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            seller: {
                '@type': 'Organization',
                name: COMPANY.legalName,
            },
            itemCondition: 'https://schema.org/NewCondition',
        },
    };
}

export function buildBreadcrumbJsonLd(
    locale: string,
    crumbs: Array<{name: string; path?: string}>,
): JsonLd {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.name,
            ...(crumb.path
                ? {item: buildCanonicalUrl(`/${locale}${crumb.path.startsWith('/') ? crumb.path : `/${crumb.path}`}`)}
                : {}),
        })),
    };
}
