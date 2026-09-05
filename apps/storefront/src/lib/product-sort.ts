import {FragmentOf, readFragment} from '@/graphql';
import {ProductCardFragment} from '@/lib/vendure/fragments';
import {
    rankProductsForDisplay,
    type RankProductsOptions,
} from '@/lib/product-ranking';

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

/**
 * Default catalog ordering: controlled multi-signal ranking.
 * Prefer this over raw shuffle — see docs/PRODUCT_RANKING.md.
 */
export function orderProductsForDisplay<T extends FragmentOf<typeof ProductCardFragment>>(
    products: T[],
    options?: RankProductsOptions,
): T[] {
    return rankProductsForDisplay(products, options);
}

/**
 * @deprecated Use orderProductsForDisplay / rankProductsForDisplay.
 * Kept as a thin alias so older call sites keep compiling during migration.
 */
export function shuffleProducts<T extends FragmentOf<typeof ProductCardFragment>>(
    products: T[],
    _seed?: number,
): T[] {
    return rankProductsForDisplay(products, {scope: 'legacy-shuffle'});
}

/**
 * @deprecated Ranking uses a 6-hour rotation bucket instead of per-load seeds.
 * Returns a stable hash for callers that still pass a seed argument.
 */
export function getShuffleSeed(scope: string): number {
    let hash = 2166136261;
    for (let i = 0; i < scope.length; i += 1) {
        hash ^= scope.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}
