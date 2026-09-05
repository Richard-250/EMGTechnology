'use client';

import {useCallback, useEffect, useRef, useState} from 'react';

const DEFAULT_DELAY_MS = 120;

/** Open on hover with a short close delay so the pointer can reach portaled panels. */
export function useHoverOpen(delayMs = DEFAULT_DELAY_MS) {
    const [open, setOpen] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    /** When true, ignore mouse-leave closes so link navigation is not interrupted. */
    const navigatingRef = useRef(false);

    const clearTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = undefined;
        }
    };

    const onEnter = () => {
        if (navigatingRef.current) return;
        clearTimer();
        setOpen(true);
    };

    const onLeave = () => {
        if (navigatingRef.current) return;
        clearTimer();
        timerRef.current = setTimeout(() => setOpen(false), delayMs);
    };

    const beginNavigation = useCallback(() => {
        navigatingRef.current = true;
        clearTimer();
        setOpen(false);
        // Allow hover menu to open again after soft navigation settles
        window.setTimeout(() => {
            navigatingRef.current = false;
        }, 1500);
    }, []);

    useEffect(() => () => clearTimer(), []);

    return {open, setOpen, onEnter, onLeave, beginNavigation};
}
