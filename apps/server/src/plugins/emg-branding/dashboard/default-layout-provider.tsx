import {useEffect, useRef, type ReactNode} from 'react';

import logoUrl from './assets/logo.png';

const LS_KEY = 'vendure-user-settings';
const LAYOUT_VERSION = 29;

/** EMG analytics layout — header, full-width insights, operations row. */
export const EMG_DEFAULT_WIDGET_LAYOUT: Record<
    string,
    { x: number; y: number; w: number; h: number }
> = {
    'emg-welcome-widget': { x: 0, y: 0, w: 12, h: 2 },
    'emg-stats-widget': { x: 0, y: 2, w: 12, h: 9 },
    'emg-featured-widget': { x: 0, y: 11, w: 12, h: 5 },
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

function applyLayoutSettings(): void {
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

        // Write once when needed — never trigger a hard reload.
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
        }
    } catch {
        // ignore storage errors
    }
}

/**
 * Applies dark theme and EMG layout without full-page reloads.
 * DOM cleanup is debounced heavily to avoid layout thrash ("gutitira").
 */
export function EmgDefaultLayoutProvider({ children }: { children: ReactNode }) {
    const observerRef = useRef<MutationObserver | null>(null);
    const lastCleanAt = useRef(0);

    useEffect(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.add('emg-dashboard-stable');
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
        const scheduleClean = () => {
            const now = Date.now();
            // Rate-limit: at most one clean every 400ms after the last mutation burst
            if (debounceTimer) clearTimeout(debounceTimer);
            const wait = Math.max(200, 400 - (now - lastCleanAt.current));
            debounceTimer = setTimeout(() => {
                lastCleanAt.current = Date.now();
                cleanVendureFromDOM();
            }, wait);
        };

        const observer = new MutationObserver(mutations => {
            // Ignore attribute-only noise (class toggles) that caused flicker loops
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
    }, []);

    return <>{children}</>;
}
