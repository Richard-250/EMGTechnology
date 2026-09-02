const STORAGE_KEY = 'emg-search-history';
const MAX_HISTORY = 8;

export interface SearchHistoryEntry {
    query: string;
    timestamp: number;
}

export function getSearchHistory(): SearchHistoryEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as SearchHistoryEntry[];
        return Array.isArray(parsed) ? parsed.slice(0, MAX_HISTORY) : [];
    } catch {
        return [];
    }
}

export function addSearchHistory(query: string): SearchHistoryEntry[] {
    const trimmed = query.trim();
    if (!trimmed || typeof window === 'undefined') return getSearchHistory();

    const normalized = trimmed.toLowerCase();
    const next: SearchHistoryEntry[] = [
        {query: trimmed, timestamp: Date.now()},
        ...getSearchHistory().filter(entry => entry.query.toLowerCase() !== normalized),
    ].slice(0, MAX_HISTORY);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
}

export function removeSearchHistoryItem(query: string): SearchHistoryEntry[] {
    if (typeof window === 'undefined') return [];
    const normalized = query.trim().toLowerCase();
    const next = getSearchHistory().filter(entry => entry.query.toLowerCase() !== normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
}

export function clearSearchHistory(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
}
