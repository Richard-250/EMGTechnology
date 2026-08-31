import {cacheLife, cacheTag} from 'next/cache';
import {query} from './api';
import {GetActiveChannelQuery, GetAvailableCountriesQuery, GetTopCollectionsQuery} from './queries';

type CollectionNavItem = {
    id: string;
    name: string;
    slug: string;
};

const COLLECTION_NAV_ORDER = ['Featured', 'Cardio', 'Strength', 'Home Gyms', 'Accessories'];

const FALLBACK_CHANNEL = {
    id: '__default_channel__',
    code: '__default_channel__',
    defaultLanguageCode: 'en' as const,
    availableLanguageCodes: ['en'] as string[],
    defaultCurrencyCode: 'USD' as const,
    availableCurrencyCodes: ['USD', 'EUR', 'GBP', 'RWF'] as string[],
};

/**
 * Hardcoded fallback collections so the navigation always renders,
 * even when the API is unreachable during build.
 */
const FALLBACK_COLLECTIONS: CollectionNavItem[] = [
    {id: 'fb-featured', name: 'Featured', slug: 'featured'},
    {id: 'fb-cardio', name: 'Cardio', slug: 'cardio'},
    {id: 'fb-strength', name: 'Strength', slug: 'strength'},
    {id: 'fb-home-gyms', name: 'Home Gyms', slug: 'home-gyms'},
    {id: 'fb-accessories', name: 'Accessories', slug: 'accessories'},
];

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

    try {
        const result = await query(GetActiveChannelQuery);
        return result.data.activeChannel ?? FALLBACK_CHANNEL;
    } catch {
        // Return default channel gracefully if API is unreachable (e.g. during build)
        return FALLBACK_CHANNEL;
    }
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

    try {
        const result = await query(GetAvailableCountriesQuery, undefined, {languageCode: locale});
        return result.data.availableCountries || [];
    } catch {
        // Return empty array gracefully if API is unreachable (e.g. during build)
        return [];
    }
}

/**
 * Get top-level collections with caching enabled.
 * Collections rarely change, so we cache them for 1 day.
 * Collection names are translatable, so locale is required.
 * Falls back to hardcoded collections if the API is unreachable.
 */
export async function getTopCollections(locale: string) {
    'use cache';
    cacheLife('days');
    cacheTag(`collections-${locale}`);

    try {
        const result = await query(GetTopCollectionsQuery, undefined, {languageCode: locale});
        const collections = dedupeCollections(result.data.collections.items);
        // If the API returned an empty list, use the fallback so the nav always shows
        return collections.length > 0 ? collections : FALLBACK_COLLECTIONS;
    } catch {
        // Return fallback collections so the navigation always renders
        return FALLBACK_COLLECTIONS;
    }
}
