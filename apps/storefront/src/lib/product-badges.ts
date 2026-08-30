/** Deterministic AliExpress-style display badges from product slug (no backend reviews yet). */

function hashSlug(slug: string): number {
    let h = 0;
    for (let i = 0; i < slug.length; i++) {
        h = (h << 5) - h + slug.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}

export function getProductRating(slug: string): { stars: number; count: number } {
    const h = hashSlug(slug);
    const stars = 4 + (h % 10) / 10; // 4.0 – 4.9
    const count = 12 + (h % 480);
    return { stars: Math.round(stars * 10) / 10, count };
}

export function getSoldCount(slug: string): number {
    const h = hashSlug(slug);
    return 50 + (h % 950);
}

export function getDiscountPercent(slug: string): number | null {
    const h = hashSlug(slug);
    // ~60% of products show a deal badge
    if (h % 5 === 0) return null;
    return 10 + (h % 41); // 10–50% off display
}

export function getWasPrice(currentPrice: number, discountPercent: number): number {
    return Math.round(currentPrice / (1 - discountPercent / 100));
}
