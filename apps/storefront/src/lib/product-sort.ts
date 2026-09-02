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

/** Deterministic pseudo-random order from a numeric seed (stable per session/page). */
function seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}

export function getShuffleSeed(scope: string): number {
    if (typeof window === 'undefined') {
        return scope.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    }
    const key = `emg-shuffle-seed:${scope}`;
    const existing = sessionStorage.getItem(key);
    if (existing) {
        return Number(existing);
    }
    const seed = Math.floor(Date.now() + Math.random() * 100000);
    sessionStorage.setItem(key, String(seed));
    return seed;
}

/** Fisher–Yates shuffle with a session seed so order changes per visit but stays stable while browsing. */
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
