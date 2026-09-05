import {useEffect, useRef, type ReactNode} from 'react';
import {useUserSettings} from '@vendure/dashboard';

import logoUrl from './assets/logo.png';

const LAYOUT_VERSION_KEY = 'emg-layout-version';
const LAYOUT_VERSION = 30;

/** EMG analytics layout — welcome, full-width insights, operations. Uses built-in widget IDs. */
export const EMG_DEFAULT_WIDGET_LAYOUT: Record<
    string,
    { x: number; y: number; w: number; h: number }
> = {
    'latest-orders-widget': { x: 0, y: 0, w: 12, h: 2 },
    'metrics-widget': { x: 0, y: 2, w: 12, h: 10 },
    'orders-summary-widget': { x: 0, y: 12, w: 12, h: 6 },
};

function sanitizeTitle() {
    if (typeof document === 'undefined') return;
    const raw = document.title;
    if (raw && /vendure/i.test(raw)) {
        document.title = raw.replace(/vendure/gi, 'EMG Technology');
    } else if (!raw || raw === 'Insights' || raw.trim() === '') {
        document.title = 'EMG Admin';
    }
}

function cleanVendureFromDOM() {
    if (typeof document === 'undefined') return;

    const styleEl = document.getElementById('vendure-branding-style');
    if (styleEl) {
        styleEl.remove();
    }

    document.querySelectorAll('[data-vendure-branding]').forEach(node => {
        (node as HTMLElement).style.setProperty('display', 'none', 'important');
    });

    document.querySelectorAll('h1').forEach(h1 => {
        if (h1.textContent?.trim() === 'Insights') {
            h1.style.setProperty('display', 'none', 'important');
        }
    });

    document.querySelectorAll('a[href*="vendure.io"]').forEach(link => {
        const item = link.closest('[data-slot="dropdown-menu-item"]') || link.parentElement;
        if (item?.parentElement) {
            item.remove();
        }
    });

    sanitizeTitle();
}

/**
 * Applies light-by-default theme and a stable EMG Insights layout via the
 * dashboard settings API (no off-screen / zero-size hide hacks).
 */
export function EmgDefaultLayoutProvider({ children }: { children: ReactNode }) {
    const { setTheme, setWidgetLayout } = useUserSettings();
    const observerRef = useRef<MutationObserver | null>(null);
    const lastCleanAt = useRef(0);
    const layoutApplied = useRef(false);

    useEffect(() => {
        document.documentElement.classList.add('emg-dashboard-stable');
        sanitizeTitle();

        const icon =
            document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
            document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]');
        if (icon) {
            icon.href = logoUrl;
            icon.type = 'image/png';
        }

        if (!layoutApplied.current) {
            layoutApplied.current = true;
            const storedVersion = Number(localStorage.getItem(LAYOUT_VERSION_KEY) || '0');
            if (storedVersion !== LAYOUT_VERSION) {
                // Migrate from forced-dark / hidden-widget layouts to light + constant cards.
                setTheme('light');
                setWidgetLayout(EMG_DEFAULT_WIDGET_LAYOUT);
                localStorage.setItem(LAYOUT_VERSION_KEY, String(LAYOUT_VERSION));
            }
        }

        cleanVendureFromDOM();

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const scheduleClean = () => {
            const now = Date.now();
            if (debounceTimer) clearTimeout(debounceTimer);
            const wait = Math.max(200, 400 - (now - lastCleanAt.current));
            debounceTimer = setTimeout(() => {
                lastCleanAt.current = Date.now();
                cleanVendureFromDOM();
            }, wait);
        };

        const observer = new MutationObserver(mutations => {
            const meaningful = mutations.some(
                m => m.type === 'childList' && (m.addedNodes.length > 0 || m.removedNodes.length > 0),
            );
            if (!meaningful) return;
            scheduleClean();
        });
        observerRef.current = observer;

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
        });

        return () => {
            observer.disconnect();
            observerRef.current = null;
            if (debounceTimer) clearTimeout(debounceTimer);
            document.documentElement.classList.remove('emg-dashboard-stable');
        };
    }, [setTheme, setWidgetLayout]);

    return <>{children}</>;
}
