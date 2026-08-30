import type {CategorySlug} from '@/lib/category-nav';

export interface SearchBrowseCategory {
    slug: CategorySlug | string;
    collectionSlug: string;
}

export interface CategorySubLink {
    label: string;
    href: string;
}

/** Left-rail categories in the search mega panel (AliExpress-style). */
export const SEARCH_BROWSE_CATEGORIES: SearchBrowseCategory[] = [
    {slug: 'cardio', collectionSlug: 'cardio'},
    {slug: 'strength', collectionSlug: 'strength'},
    {slug: 'home-gyms', collectionSlug: 'home-gyms'},
    {slug: 'accessories', collectionSlug: 'accessories'},
    {slug: 'featured', collectionSlug: 'featured'},
];

/** Quick sub-links shown in the All Categories mega menu per collection. */
export const CATEGORY_SUB_LINKS: Record<string, CategorySubLink[]> = {
    cardio: [
        {label: 'Elliptical', href: '/search?q=elliptical'},
        {label: 'Indoor cycle', href: '/search?q=indoor+cycle'},
        {label: 'Rowing machine', href: '/search?q=rowing'},
        {label: 'Recumbent bike', href: '/search?q=recumbent'},
        {label: 'Upright bike', href: '/search?q=upright+bike'},
    ],
    strength: [
        {label: 'Dumbbells', href: '/search?q=dumbbells'},
        {label: 'Barbell', href: '/search?q=barbell'},
        {label: 'Power rack', href: '/search?q=power+rack'},
        {label: 'Kettlebells', href: '/search?q=kettlebell'},
        {label: 'Functional trainer', href: '/search?q=functional'},
    ],
    'home-gyms': [
        {label: 'Home gym station', href: '/search?q=home+gym'},
        {label: 'Multi gym', href: '/search?q=multi+gym'},
        {label: 'Cable machine', href: '/search?q=cable'},
    ],
    accessories: [
        {label: 'Yoga mat', href: '/search?q=yoga+mat'},
        {label: 'Resistance bands', href: '/search?q=resistance'},
        {label: 'Jump rope', href: '/search?q=jump+rope'},
        {label: 'Ab roller', href: '/search?q=ab+roller'},
    ],
    featured: [
        {label: 'Best sellers', href: '/collection/featured'},
        {label: 'Cardio deals', href: '/collection/cardio'},
        {label: 'Strength gear', href: '/collection/strength'},
    ],
};
