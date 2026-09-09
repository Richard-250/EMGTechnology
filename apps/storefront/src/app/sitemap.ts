import type {MetadataRoute} from 'next';
import {routing} from '@/i18n/routing';
import {SITE_URL} from '@/lib/metadata';
import {query} from '@/lib/vendure/api';
import {GetSitemapCollectionsQuery, GetSitemapProductsQuery} from '@/lib/vendure/queries';

const PAGE_SIZE = 100;

const STATIC_PATHS = [
    '',
    '/deals',
    '/privacy-policy',
    '/terms-of-service',
] as const;

function absoluteUrl(path: string): string {
    const base = SITE_URL.replace(/\/$/, '');
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `${base}${clean}`;
}

async function fetchAllProductSlugs(): Promise<Array<{slug: string; updatedAt: string}>> {
    const items: Array<{slug: string; updatedAt: string}> = [];
    let skip = 0;

    for (;;) {
        const result = await query(GetSitemapProductsQuery, {
            options: {
                skip,
                take: PAGE_SIZE,
                filter: {enabled: {eq: true}},
            },
        });
        const page = result.data.products;
        items.push(...page.items.map((item) => ({slug: item.slug, updatedAt: item.updatedAt})));
        if (items.length >= page.totalItems || page.items.length === 0) break;
        skip += PAGE_SIZE;
    }

    return items;
}

async function fetchAllCollectionSlugs(): Promise<Array<{slug: string; updatedAt: string}>> {
    const items: Array<{slug: string; updatedAt: string}> = [];
    let skip = 0;

    for (;;) {
        const result = await query(GetSitemapCollectionsQuery, {
            options: {
                skip,
                take: PAGE_SIZE,
            },
        });
        const page = result.data.collections;
        items.push(
            ...page.items
                .filter((item) => item.slug && item.slug !== '__root_collection__')
                .map((item) => ({slug: item.slug, updatedAt: item.updatedAt})),
        );
        if (skip + page.items.length >= page.totalItems || page.items.length === 0) break;
        skip += PAGE_SIZE;
    }

    return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const entries: MetadataRoute.Sitemap = [];

    for (const locale of routing.locales) {
        for (const path of STATIC_PATHS) {
            entries.push({
                url: absoluteUrl(`/${locale}${path}`),
                lastModified: new Date(),
                changeFrequency: path === '' ? 'daily' : 'monthly',
                priority: path === '' ? 1 : 0.6,
            });
        }
    }

    try {
        const [products, collections] = await Promise.all([
            fetchAllProductSlugs(),
            fetchAllCollectionSlugs(),
        ]);

        for (const locale of routing.locales) {
            for (const collection of collections) {
                entries.push({
                    url: absoluteUrl(`/${locale}/collection/${collection.slug}`),
                    lastModified: new Date(collection.updatedAt),
                    changeFrequency: 'weekly',
                    priority: 0.8,
                });
            }

            for (const product of products) {
                entries.push({
                    url: absoluteUrl(`/${locale}/product/${product.slug}`),
                    lastModified: new Date(product.updatedAt),
                    changeFrequency: 'weekly',
                    priority: 0.7,
                });
            }
        }
    } catch {
        // Sitemap still returns static routes if the shop API is unavailable at build/request time.
    }

    return entries;
}
