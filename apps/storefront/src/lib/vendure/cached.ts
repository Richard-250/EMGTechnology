import {cacheLife, cacheTag} from 'next/cache';
import {query} from './api';
import {GetActiveChannelQuery, GetAvailableCountriesQuery, GetTopCollectionsQuery} from './queries';

type CollectionNavItem = {
    id: string;
    name: string;
    slug: string;
};

const COLLECTION_NAV_ORDER = ['Featured', 'Cardio', 'Strength', 'Home Gyms', 'Accessories'];

/** Remove duplicate collections created by repeated seed runs. */
export function dedupeCollections(collections: CollectionNavItem[]): CollectionNavItem[] {
    const byName = new Map<string, CollectionNavItem>();

    for (const collection of collections) {
        const existing = byName.get(collection.name);
        if (!existing || collection.slug.length < existing.slug.length) {
            byName.set(collection.name, collection);
        }
    }

    return Array.from(byName.values()).sort((a, b) => {
        const ai = COLLECTION_NAV_ORDER.indexOf(a.name);
        const bi = COLLECTION_NAV_ORDER.indexOf(b.name);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.name.localeCompare(b.name);
    });
}

/**
 * Get the active channel with caching enabled.
 * Channel configuration rarely changes, so we cache it for 1 hour.
 * Channel config is language-independent, so no locale parameter needed.
 */
export async function getActiveChannelCached() {
    'use cache';
    cacheLife('hours');

    const result = await query(GetActiveChannelQuery);
    return result.data.activeChannel;
}

/**
 * Get available countries with caching enabled.
 * Countries list rarely changes, so we cache it with max duration.
 * Country names are translatable, so locale is required.
 */
export async function getAvailableCountriesCached(locale: string) {
    'use cache';
    cacheLife('max');
    cacheTag(`countries-${locale}`);

    const result = await query(GetAvailableCountriesQuery, undefined, {languageCode: locale});
    return result.data.availableCountries || [];
}

/**
 * Get top-level collections with caching enabled.
 * Collections rarely change, so we cache them for 1 day.
 * Collection names are translatable, so locale is required.
 */
export async function getTopCollections(locale: string) {
    'use cache';
    cacheLife('days');
    cacheTag(`collections-${locale}`);

    const result = await query(GetTopCollectionsQuery, undefined, {languageCode: locale});
    return dedupeCollections(result.data.collections.items);
}
