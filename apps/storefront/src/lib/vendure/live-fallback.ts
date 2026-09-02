import {isPrerenderAbortError} from '@/lib/prerender';

/**
 * Try a cached fetch first; if it fails or looks empty, run the live fetch.
 * Prevents stale empty `'use cache'` results from a bad build from breaking the storefront.
 */
export async function withLiveFallback<T>(
    cached: () => Promise<T>,
    live: () => Promise<T>,
    isEmpty: (value: T) => boolean,
): Promise<T> {
    try {
        const cachedValue = await cached();
        if (!isEmpty(cachedValue)) {
            return cachedValue;
        }
    } catch (error) {
        if (!isPrerenderAbortError(error)) {
            console.error('Cached fetch failed, retrying live:', error);
        }
    }

    try {
        return await live();
    } catch (error) {
        if (!isPrerenderAbortError(error)) {
            console.error('Live fetch failed:', error);
        }
        throw error;
    }
}
