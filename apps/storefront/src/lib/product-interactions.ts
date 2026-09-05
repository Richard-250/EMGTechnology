/**
 * Lightweight per-visitor product interaction signals (client-only).
 * Stores only product IDs + timestamps — no PII.
 * Scoped like search history: guest id vs customer id.
 */

const GUEST_ID_KEY = 'emg-search-guest-id';
const MAX_ENTRIES = 40;

export interface ProductInteractionMap {
    /** productId -> last interaction timestamp */
    views: Record<string, number>;
    clicks: Record<string, number>;
}

function createId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getGuestId(): string {
    if (typeof window === 'undefined') return 'ssr';
    try {
        const existing = localStorage.getItem(GUEST_ID_KEY);
        if (existing) return existing;
        const id = createId();
        localStorage.setItem(GUEST_ID_KEY, id);
        return id;
    } catch {
        return 'local';
    }
}

let activeOwnerKey: string | null = null;

function storageKey(): string {
    if (!activeOwnerKey) {
        activeOwnerKey = `emg-product-interactions:guest:${getGuestId()}`;
    }
    return activeOwnerKey;
}

/** Align interaction storage with the same owner as search history. */
export function setProductInteractionOwner(customerId: string | null | undefined): void {
    if (typeof window === 'undefined') return;
    activeOwnerKey = customerId?.trim()
        ? `emg-product-interactions:customer:${customerId.trim()}`
        : `emg-product-interactions:guest:${getGuestId()}`;
}

function emptyMap(): ProductInteractionMap {
    return {views: {}, clicks: {}};
}

function readMap(): ProductInteractionMap {
    if (typeof window === 'undefined') return emptyMap();
    try {
        const raw = localStorage.getItem(storageKey());
        if (!raw) return emptyMap();
        const parsed = JSON.parse(raw) as ProductInteractionMap;
        return {
            views: parsed.views && typeof parsed.views === 'object' ? parsed.views : {},
            clicks: parsed.clicks && typeof parsed.clicks === 'object' ? parsed.clicks : {},
        };
    } catch {
        return emptyMap();
    }
}

function prune(map: Record<string, number>): Record<string, number> {
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return Object.fromEntries(entries.slice(0, MAX_ENTRIES));
}

function writeMap(map: ProductInteractionMap): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(
            storageKey(),
            JSON.stringify({
                views: prune(map.views),
                clicks: prune(map.clicks),
            }),
        );
    } catch {
        // ignore
    }
}

export function recordProductView(productId: string): void {
    if (!productId || typeof window === 'undefined') return;
    const map = readMap();
    map.views[productId] = Date.now();
    writeMap(map);
}

export function recordProductClick(productId: string): void {
    if (!productId || typeof window === 'undefined') return;
    const map = readMap();
    map.clicks[productId] = Date.now();
    map.views[productId] = Date.now();
    writeMap(map);
}

export function getProductInteractions(): ProductInteractionMap {
    return readMap();
}

/** Recency-weighted interaction score in [0, 1]. */
export function getInteractionScore(productId: string, interactions?: ProductInteractionMap): number {
    const map = interactions ?? getProductInteractions();
    const now = Date.now();
    const day = 86_400_000;
    let score = 0;

    const clickAt = map.clicks[productId];
    if (clickAt) {
        const ageDays = Math.max(0, (now - clickAt) / day);
        score += Math.max(0, 1 - ageDays / 14) * 1.0;
    }

    const viewAt = map.views[productId];
    if (viewAt) {
        const ageDays = Math.max(0, (now - viewAt) / day);
        score += Math.max(0, 1 - ageDays / 7) * 0.45;
    }

    return Math.min(1, score);
}
