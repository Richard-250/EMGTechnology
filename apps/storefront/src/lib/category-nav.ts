import {STORE_IMAGES} from '@/lib/store-images';

export type CategorySlug =
    | 'featured'
    | 'cardio'
    | 'strength'
    | 'home-gyms'
    | 'accessories';

export interface CategoryNavMeta {
    slug: CategorySlug;
    image: string;
    descriptionKey: CategorySlug;
}

/** Static visuals + i18n keys for the All Categories mega menu. */
export const CATEGORY_NAV_META: CategoryNavMeta[] = [
    {
        slug: 'featured',
        image: STORE_IMAGES.hero,
        descriptionKey: 'featured',
    },
    {
        slug: 'cardio',
        image: STORE_IMAGES.cardio,
        descriptionKey: 'cardio',
    },
    {
        slug: 'strength',
        image: STORE_IMAGES.strength,
        descriptionKey: 'strength',
    },
    {
        slug: 'home-gyms',
        image: STORE_IMAGES.homeGyms,
        descriptionKey: 'home-gyms',
    },
    {
        slug: 'accessories',
        image: STORE_IMAGES.accessories,
        descriptionKey: 'accessories',
    },
];

export function getCategoryNavImage(slug: string): string {
    const meta = CATEGORY_NAV_META.find(c => c.slug === slug);
    return meta?.image ?? STORE_IMAGES.hero;
}
