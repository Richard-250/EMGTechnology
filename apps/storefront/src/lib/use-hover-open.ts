'use client';

import {useEffect, useRef, useState} from 'react';

const DEFAULT_DELAY_MS = 120;

/** Open on hover with a short close delay so the pointer can reach portaled panels. */
export function useHoverOpen(delayMs = DEFAULT_DELAY_MS) {
    const [open, setOpen] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const clearTimer = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = undefined;
        }
    };

    const onEnter = () => {
        clearTimer();
        setOpen(true);
    };

    const onLeave = () => {
        clearTimer();
        timerRef.current = setTimeout(() => setOpen(false), delayMs);
    };

    useEffect(() => () => clearTimer(), []);

    return {open, setOpen, onEnter, onLeave};
}
