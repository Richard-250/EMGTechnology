import { useEffect, useRef, type ReactNode } from 'react';

import logoUrl from './assets/logo.png';

const LS_KEY = 'vendure-user-settings';
const LAYOUT_VERSION = 27;

/** EMG dark dashboard layout — welcome + featured at top, stats below. */
export const EMG_DEFAULT_WIDGET_LAYOUT: Record<
    string,
    { x: number; y: number; w: number; h: number }
> = {
    'emg-welcome-widget': { x: 0, y: 0, w: 7, h: 3 },
    'emg-featured-widget': { x: 7, y: 0, w: 5, h: 3 },
    'emg-stats-widget': { x: 0, y: 3, w: 12, h: 4 },
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

    document.querySelectorAll('.react-grid-item').forEach(item => {
        if (item.querySelector('[data-emg-hidden-widget]') || item.querySelector('.hidden')) {
            (item as HTMLElement).style.setProperty('display', 'none', 'important');
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

function applyLayoutSettings(): boolean {
    try {
        const raw = localStorage.getItem(LS_KEY);
        const settings = raw ? JSON.parse(raw) : {};
        const currentLayout = settings.widgetLayout ?? {};
        const welcomeY = currentLayout['emg-welcome-widget']?.y;
        const needsLayout =
            welcomeY !== 0 ||
            settings.emgLayoutVersion !== LAYOUT_VERSION ||
            !currentLayout['emg-welcome-widget'] ||
            currentLayout['metrics-widget']?.w > 0 ||
            currentLayout['orders-summary-widget']?.w > 0;

        if (needsLayout || settings.theme !== 'dark') {
            localStorage.setItem(
                LS_KEY,
                JSON.stringify({
                    ...settings,
                    theme: 'dark',
                    emgLayoutVersion: LAYOUT_VERSION,
                    widgetLayout: EMG_DEFAULT_WIDGET_LAYOUT,
                }),
            );
            return true;
        }
    } catch {
        // ignore storage errors
    }
    return false;
}

/** Applies dark theme, removes legacy platform text, and enforces EMG layout without full-page reloads. */
export function EmgDefaultLayoutProvider({ children }: { children: ReactNode }) {
    const observerRef = useRef<MutationObserver | null>(null);

    useEffect(() => {
        document.documentElement.classList.add('dark');
        sanitizeTitle();

        const icon =
            document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
            document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]');
        if (icon) {
            icon.href = logoUrl;
            icon.type = 'image/png';
        }

        applyLayoutSettings();
        cleanVendureFromDOM();

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;
        const observer = new MutationObserver(() => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(cleanVendureFromDOM, 150);
        });
        observerRef.current = observer;

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });

        return () => {
            observer.disconnect();
            observerRef.current = null;
            if (debounceTimer) clearTimeout(debounceTimer);
        };
    }, []);

    return <>{children}</>;
}
