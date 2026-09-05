/**
 * Customer search history (client-only).
 *
 * Isolation:
 * - Guests use a stable anonymous guest id in localStorage
 * - Logged-in customers use their Vendure customer id
 * - Histories never mix across customers; switching accounts switches keys
 *
 * Privacy:
 * - Stores only sanitized query strings + timestamps
 * - Rejects emails, phone-like strings, and overlong input
 */

const LEGACY_KEY = 'emg-search-history';
const GUEST_ID_KEY = 'emg-search-guest-id';
const MAX_HISTORY = 10;
const MAX_QUERY_LENGTH = 80;
const MIN_QUERY_LENGTH = 2;

export interface SearchHistoryEntry {
    query: string;
    timestamp: number;
}

/** Active storage owner key for this tab (guest or customer). */
let activeStorageKey: string | null = null;

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

function keyForGuest(): string {
    return `emg-search-history:guest:${getGuestId()}`;
}

function keyForCustomer(customerId: string): string {
    return `emg-search-history:customer:${customerId}`;
}

/**
 * Bind history reads/writes to the current visitor.
 * Call with customer id when logged in, or null for guests.
 */
export function setSearchHistoryOwner(customerId: string | null | undefined): void {
    if (typeof window === 'undefined') return;
    activeStorageKey = customerId?.trim()
        ? keyForCustomer(customerId.trim())
        : keyForGuest();
    migrateLegacyHistoryOnce();
}

function currentKey(): string {
    if (!activeStorageKey) {
        activeStorageKey = keyForGuest();
        migrateLegacyHistoryOnce();
    }
    return activeStorageKey;
}

function migrateLegacyHistoryOnce(): void {
    if (typeof window === 'undefined') return;
    try {
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (!legacy) return;
        const key = currentKey();
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, legacy);
        }
        localStorage.removeItem(LEGACY_KEY);
    } catch {
        // ignore quota / private mode
    }
}

/** Strip and reject queries that look like sensitive or useless data. */
export function sanitizeSearchQuery(query: string): string | null {
    const trimmed = query.trim().replace(/\s+/g, ' ');
    if (trimmed.length < MIN_QUERY_LENGTH) return null;

    const clipped = trimmed.slice(0, MAX_QUERY_LENGTH);
    const lower = clipped.toLowerCase();

    // Emails
    if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(clipped)) return null;
    // Phone / card-like digit runs
    if (/^\+?[\d\s()./-]{7,}$/.test(clipped)) return null;
    if ((clipped.replace(/\D/g, '').length >= 10) && clipped.replace(/\D/g, '').length / clipped.length > 0.7) {
        return null;
    }
    // Password / token-ish
    if (/(password|passwd|secret|token|api[_-]?key)/i.test(lower)) return null;

    return clipped;
}

function readRaw(key: string): SearchHistoryEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map(item => {
                if (!item || typeof item !== 'object') return null;
                const query = sanitizeSearchQuery(String((item as SearchHistoryEntry).query ?? ''));
                const timestamp = Number((item as SearchHistoryEntry).timestamp);
                if (!query || !Number.isFinite(timestamp)) return null;
                return {query, timestamp} satisfies SearchHistoryEntry;
            })
            .filter((entry): entry is SearchHistoryEntry => entry != null)
            .slice(0, MAX_HISTORY);
    } catch {
        return [];
    }
}

function writeRaw(key: string, entries: SearchHistoryEntry[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(entries.slice(0, MAX_HISTORY)));
    } catch {
        // ignore
    }
}

export function getSearchHistory(): SearchHistoryEntry[] {
    return readRaw(currentKey());
}

export function addSearchHistory(query: string): SearchHistoryEntry[] {
    const sanitized = sanitizeSearchQuery(query);
    if (!sanitized || typeof window === 'undefined') return getSearchHistory();

    const normalized = sanitized.toLowerCase();
    const next: SearchHistoryEntry[] = [
        {query: sanitized, timestamp: Date.now()},
        ...getSearchHistory().filter(entry => entry.query.toLowerCase() !== normalized),
    ].slice(0, MAX_HISTORY);

    writeRaw(currentKey(), next);
    return next;
}

export function removeSearchHistoryItem(query: string): SearchHistoryEntry[] {
    if (typeof window === 'undefined') return [];
    const normalized = query.trim().toLowerCase();
    const next = getSearchHistory().filter(entry => entry.query.toLowerCase() !== normalized);
    writeRaw(currentKey(), next);
    return next;
}

export function clearSearchHistory(): SearchHistoryEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        localStorage.removeItem(currentKey());
    } catch {
        // ignore
    }
    return [];
}

/** Recent query strings for ranking / recommendations (no timestamps). */
export function getSearchHistoryTerms(): string[] {
    return getSearchHistory().map(entry => entry.query);
}

/**
 * Score how well a product name matches recent search terms.
 * Pure / sync — safe to run on already-fetched product lists (does not hit the network).
 */
export function scoreProductNameAgainstHistory(
    productName: string,
    historyTerms: string[],
): number {
    if (!historyTerms.length || !productName) return 0;
    const name = productName.toLowerCase();
    let score = 0;

    for (let i = 0; i < historyTerms.length; i += 1) {
        const recencyWeight = historyTerms.length - i;
        const words = historyTerms[i]
            .toLowerCase()
            .split(/\s+/)
            .filter(w => w.length > 2);

        for (const word of words) {
            if (name.includes(word)) {
                score += recencyWeight;
            }
        }
        if (name.includes(historyTerms[i].toLowerCase())) {
            score += recencyWeight * 2;
        }
    }

    return score;
}

/**
 * Soft-boost history-relevant products toward the front while keeping variety.
 * Does not remove items — every product remains visible.
 */
export function blendProductsWithSearchHistory<T>(
    products: T[],
    getName: (item: T) => string,
    historyTerms: string[],
): T[] {
    if (!products.length || !historyTerms.length) return products;

    const scored = products.map((item, index) => ({
        item,
        index,
        score: scoreProductNameAgainstHistory(getName(item), historyTerms),
    }));

    const boosted = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score || a.index - b.index);
    const rest = scored.filter(s => s.score === 0);

    if (boosted.length === 0) return products;

    // Interleave: up to ~30% slots from history matches at the start, then the rest
    const leadCount = Math.min(boosted.length, Math.max(2, Math.ceil(products.length * 0.3)));
    const lead = boosted.slice(0, leadCount).map(s => s.item);
    const leadSet = new Set(lead);
    const remainder = [...boosted.slice(leadCount), ...rest]
        .sort((a, b) => a.index - b.index)
        .map(s => s.item)
        .filter(item => !leadSet.has(item));

    return [...lead, ...remainder];
}
