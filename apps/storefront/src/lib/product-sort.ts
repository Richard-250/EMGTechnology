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
