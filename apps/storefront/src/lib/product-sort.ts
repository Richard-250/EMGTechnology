import {FragmentOf, readFragment} from '@/graphql';
import {ProductCardFragment} from '@/lib/vendure/fragments';

/** Newest Vendure products first (higher productId = added later). */
export function sortProductsNewestFirst<T extends FragmentOf<typeof ProductCardFragment>>(
    products: T[],
): T[] {
    return [...products].sort((a, b) => {
        const aId = Number(readFragment(ProductCardFragment, a).productId);
        const bId = Number(readFragment(ProductCardFragment, b).productId);
        return bId - aId;
    });
}

/** Deterministic pseudo-random order from a numeric seed (stable per page load). */
function seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}

function hashString(input: string): number {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

/**
 * Seed for product shuffle.
 * - New seed on every full page refresh (in-memory for this document load)
 * - Stable during client-side navigations within the same load
 * So users see a fresh mix after refresh without layout jumping while browsing.
 */
let pageLoadSeed: number | null = null;

export function getShuffleSeed(scope: string): number {
    if (typeof window === 'undefined') {
        return hashString(scope);
    }
    if (pageLoadSeed === null) {
        pageLoadSeed = Math.floor(Date.now() + Math.random() * 100000);
    }
    return hashString(`${scope}:${pageLoadSeed}`);
}

/** Fisher-Yates shuffle with a page-load seed. */
export function shuffleProducts<T extends FragmentOf<typeof ProductCardFragment>>(
    products: T[],
    seed: number,
): T[] {
    const items = [...products];
    const random = seededRandom(seed);
    for (let i = items.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
}
