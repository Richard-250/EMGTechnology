/** True when Next.js aborted a dynamic API during static prerender/PPR shell generation. */
export function isPrerenderAbortError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }
    return (
        error.message.includes('During prerendering') ||
        error.message.includes('Connection closed') ||
        (error as Error & {digest?: string}).digest === 'HANGING_PROMISE_REJECTION'
    );
}
