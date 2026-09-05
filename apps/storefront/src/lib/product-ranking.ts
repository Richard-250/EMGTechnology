import {FragmentOf, readFragment} from '@/graphql';
import {ProductCardFragment} from '@/lib/vendure/fragments';
import {
    getDiscountPercent,
    getProductRating,
    getSoldCount,
} from '@/lib/product-badges';
import {scoreProductNameAgainstHistory} from '@/lib/search-history';
import {
    getInteractionScore,
    getProductInteractions,
    type ProductInteractionMap,
} from '@/lib/product-interactions';

/**
 * Controlled product ranking for storefront grids.
 *
 * Stability contract:
 * - Primary score is deterministic from product attributes + visitor signals.
 * - A small diversity term rotates only on a multi-hour time bucket (default 6h),
 *   so a hard refresh within the same bucket keeps the same order.
 * - Explicit sorts (newest, price, name) bypass this algorithm entirely.
 *
 * See docs/PRODUCT_RANKING.md for the full signal weights and rationale.
 */

/** Hours between gentle diversity rotations (not every refresh). */
export const RANKING_ROTATION_HOURS = 6;

export interface RankableProductFields {
    productId: string;
    productName: string;
    slug: string;
    /** Vendure search relevance score when a query term was used. */
    score?: number | null;
    /** Optional stock signal when available from API. */
    inStock?: boolean | null;
}

export interface RankProductsOptions {
    /** Scope string so home / search / carousel can diverge slightly. */
    scope?: string;
    /** Active search query for relevance boosting. */
    searchTerm?: string;
    /** Recent search queries for this visitor only. */
    historyTerms?: string[];
    /** Pre-loaded interactions (avoids repeated localStorage reads). */
    interactions?: ProductInteractionMap;
    /**
     * Override rotation bucket (tests). Default: floor(now / RANKING_ROTATION_HOURS).
     */
    rotationBucket?: number;
}

const WEIGHTS = {
    newness: 0.18,
    popularity: 0.22,
    deal: 0.14,
    history: 0.16,
    relevance: 0.18,
    interaction: 0.08,
    stock: 0.06,
    diversity: 0.08,
} as const;

function hashString(input: string): number {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

/** Current multi-hour rotation bucket (UTC). Stable across refreshes inside the window. */
export function getRankingRotationBucket(nowMs: number = Date.now()): number {
    const msPerBucket = RANKING_ROTATION_HOURS * 60 * 60 * 1000;
    return Math.floor(nowMs / msPerBucket);
}

function clamp01(n: number): number {
    if (Number.isNaN(n)) return 0;
    return Math.min(1, Math.max(0, n));
}

/** Newer catalog items (higher productId) score higher. */
function newnessSignal(productId: string, maxId: number, minId: number): number {
    const id = Number(productId);
    if (!Number.isFinite(id) || maxId <= minId) return 0.5;
    return clamp01((id - minId) / (maxId - minId));
}

/** Popularity from deterministic sold + rating badges (until live analytics exist). */
function popularitySignal(slug: string): number {
    const sold = getSoldCount(slug); // 50–999
    const {stars, count} = getProductRating(slug);
    const soldNorm = clamp01((sold - 50) / 950);
    const ratingNorm = clamp01((stars - 4) / 0.9) * 0.6 + clamp01(count / 500) * 0.4;
    return clamp01(soldNorm * 0.65 + ratingNorm * 0.35);
}

/** Super-deal / discount boost. */
function dealSignal(slug: string): number {
    const discount = getDiscountPercent(slug);
    if (discount == null) return 0;
    // Stronger boost for deeper discounts
    return clamp01(discount / 50);
}

/** Search-history personalization (visitor-local). */
function historySignal(productName: string, historyTerms: string[]): number {
    if (!historyTerms.length) return 0;
    const raw = scoreProductNameAgainstHistory(productName, historyTerms);
    // Typical raw scores are small integers; normalize softly
    return clamp01(raw / 12);
}

/** Query relevance from Vendure `score` and/or term overlap. */
function relevanceSignal(
    fields: RankableProductFields,
    searchTerm: string | undefined,
): number {
    const apiScore = typeof fields.score === 'number' ? fields.score : 0;
    // Vendure scores vary; squash into 0–1
    const fromApi = clamp01(Math.log1p(Math.max(0, apiScore)) / 5);

    if (!searchTerm?.trim()) return fromApi;

    const term = searchTerm.trim().toLowerCase();
    const name = fields.productName.toLowerCase();
    let overlap = 0;
    if (name.includes(term)) overlap = 1;
    else {
        const words = term.split(/\s+/).filter(w => w.length > 2);
        if (words.length) {
            const hits = words.filter(w => name.includes(w)).length;
            overlap = hits / words.length;
        }
    }
    return clamp01(fromApi * 0.55 + overlap * 0.45);
}

/**
 * Stock availability.
 * Uses API `inStock` when provided; otherwise a soft slug heuristic so ranking
 * still prefers “healthy” catalog items without claiming live inventory.
 */
function stockSignal(fields: RankableProductFields): number {
    if (fields.inStock === true) return 1;
    if (fields.inStock === false) return 0.15;
    // Soft proxy: avoid always-identical scores
    const h = hashString(`stock:${fields.slug}`) % 100;
    return clamp01(0.55 + h / 250);
}

/** Small, bucket-stable noise so ties break differently every RANKING_ROTATION_HOURS. */
function diversitySignal(
    productId: string,
    scope: string,
    rotationBucket: number,
): number {
    const h = hashString(`${scope}:${rotationBucket}:${productId}`);
    return (h % 10_000) / 10_000;
}

export function scoreProductForRanking(
    fields: RankableProductFields,
    ctx: {
        maxId: number;
        minId: number;
        scope: string;
        searchTerm?: string;
        historyTerms: string[];
        interactions: ProductInteractionMap;
        rotationBucket: number;
    },
): number {
    const parts = {
        newness: newnessSignal(fields.productId, ctx.maxId, ctx.minId),
        popularity: popularitySignal(fields.slug),
        deal: dealSignal(fields.slug),
        history: historySignal(fields.productName, ctx.historyTerms),
        relevance: relevanceSignal(fields, ctx.searchTerm),
        interaction: getInteractionScore(fields.productId, ctx.interactions),
        stock: stockSignal(fields),
        diversity: diversitySignal(fields.productId, ctx.scope, ctx.rotationBucket),
    };

    return (
        WEIGHTS.newness * parts.newness +
        WEIGHTS.popularity * parts.popularity +
        WEIGHTS.deal * parts.deal +
        WEIGHTS.history * parts.history +
        WEIGHTS.relevance * parts.relevance +
        WEIGHTS.interaction * parts.interaction +
        WEIGHTS.stock * parts.stock +
        WEIGHTS.diversity * parts.diversity
    );
}

/**
 * Rank a product list for default “Featured mix” display.
 * Does not drop items — every product remains visible, only order changes.
 */
export function rankProductsForDisplay<T extends FragmentOf<typeof ProductCardFragment>>(
    products: T[],
    options: RankProductsOptions = {},
): T[] {
    if (products.length <= 1) return products;

    const scope = options.scope ?? 'catalog';
    const historyTerms = options.historyTerms ?? [];
    const interactions = options.interactions ?? getProductInteractions();
    const rotationBucket = options.rotationBucket ?? getRankingRotationBucket();

    const fieldsList = products.map(p => {
        const data = readFragment(ProductCardFragment, p);
        return {
            product: p,
            fields: {
                productId: data.productId,
                productName: data.productName,
                slug: data.slug,
                score: data.score,
            } satisfies RankableProductFields,
        };
    });

    const ids = fieldsList.map(f => Number(f.fields.productId)).filter(Number.isFinite);
    const maxId = ids.length ? Math.max(...ids) : 1;
    const minId = ids.length ? Math.min(...ids) : 0;

    const ctx = {
        maxId,
        minId,
        scope,
        searchTerm: options.searchTerm,
        historyTerms,
        interactions,
        rotationBucket,
    };

    return [...fieldsList]
        .map(entry => ({
            product: entry.product,
            rank: scoreProductForRanking(entry.fields, ctx),
            id: entry.fields.productId,
        }))
        .sort((a, b) => b.rank - a.rank || Number(b.id) - Number(a.id))
        .map(entry => entry.product);
}

/**
 * Rank serialized / plain product cards (search suggest dropdown, etc.).
 */
export function rankPlainProductsForDisplay<T extends RankableProductFields>(
    products: T[],
    options: RankProductsOptions = {},
): T[] {
    if (products.length <= 1) return products;

    const scope = options.scope ?? 'plain';
    const historyTerms = options.historyTerms ?? [];
    const interactions = options.interactions ?? getProductInteractions();
    const rotationBucket = options.rotationBucket ?? getRankingRotationBucket();

    const ids = products.map(p => Number(p.productId)).filter(Number.isFinite);
    const maxId = ids.length ? Math.max(...ids) : 1;
    const minId = ids.length ? Math.min(...ids) : 0;

    const ctx = {
        maxId,
        minId,
        scope,
        searchTerm: options.searchTerm,
        historyTerms,
        interactions,
        rotationBucket,
    };

    return [...products]
        .map(product => ({
            product,
            rank: scoreProductForRanking(product, ctx),
        }))
        .sort(
            (a, b) =>
                b.rank - a.rank || Number(b.product.productId) - Number(a.product.productId),
        )
        .map(entry => entry.product);
}
