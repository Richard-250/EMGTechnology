'use client';

import {useEffect} from 'react';

export default function LocaleError({
    error,
    reset,
}: {
    error: Error & {digest?: string};
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Storefront error:', error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="text-muted-foreground max-w-md">
                We could not load this page. This usually clears after a refresh once the store API is ready.
            </p>
            <button
                type="button"
                onClick={() => reset()}
                className="inline-flex items-center justify-center rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 transition-opacity"
            >
                Try again
            </button>
            {error.digest ? (
                <p className="text-xs text-muted-foreground/70">Reference: {error.digest}</p>
            ) : null}
        </div>
    );
}
