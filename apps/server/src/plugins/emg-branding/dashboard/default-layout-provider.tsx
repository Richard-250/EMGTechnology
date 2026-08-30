import { useEffect, useRef, type ReactNode } from 'react';

import logoUrl from './assets/logo.png';

const LS_KEY = 'vendure-user-settings';

/** EMG dark dashboard layout — welcome + featured at top, stats below. */
export const EMG_DEFAULT_WIDGET_LAYOUT: Record<
    string,
    { x: number; y: number; w: number; h: number }
> = {
    'emg-welcome-widget': { x: 0, y: 0, w: 8, h: 3 },
    'emg-featured-widget': { x: 8, y: 0, w: 4, h: 3 },
    'emg-stats-widget': { x: 0, y: 3, w: 12, h: 2 },
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

    // 1. Remove/disable the forced vendor branding stylesheet
    const styleEl = document.getElementById('vendure-branding-style');
    if (styleEl) {
        styleEl.remove();
    }

    // 2. Hide or remove any [data-vendure-branding] elements
    const brandingNodes = document.querySelectorAll('[data-vendure-branding]');
    brandingNodes.forEach(node => {
        (node as HTMLElement).style.setProperty('display', 'none', 'important');
        (node as HTMLElement).style.setProperty('visibility', 'hidden', 'important');
        (node as HTMLElement).style.setProperty('height', '0px', 'important');
        (node as HTMLElement).style.setProperty('overflow', 'hidden', 'important');
    });

    // 3. Remove external platform upsell links (e.g., Explore Platform & Cloud / pricing)
    const links = document.querySelectorAll('a[href*="vendure.io"]');
    links.forEach(link => {
        const item = link.closest('[data-slot="dropdown-menu-item"]') || link.parentElement;
        if (item && item.parentElement) {
            item.remove();
        } else {
            (link as HTMLElement).style.setProperty('display', 'none', 'important');
        }
    });

    // 4. Sanitize meta tags
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', 'EMG Technology Admin Dashboard');
    }
    const metaAuthor = document.querySelector('meta[name="author"]');
    if (metaAuthor) {
        metaAuthor.setAttribute('content', 'EMG Technology Ltd');
    }

    // 5. Sanitize document title
    sanitizeTitle();
}

/** Applies dark theme, removes legacy platform text, and enforces EMG layout. */
export function EmgDefaultLayoutProvider({ children }: { children: ReactNode }) {
    const appliedRef = useRef(false);

    useEffect(() => {
        if (appliedRef.current) {
            return;
        }
        appliedRef.current = true;

        document.documentElement.classList.add('dark');
        sanitizeTitle();

        // Update favicon to EMG logo
        const icon =
            document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
            document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]');
        if (icon) {
            icon.href = logoUrl;
            icon.type = 'image/png';
        }

        // Layout reset if needed
        try {
            const raw = localStorage.getItem(LS_KEY);
            const settings = raw ? JSON.parse(raw) : {};
            const currentLayout = settings.widgetLayout ?? {};
            const hasCharts =
                currentLayout['metrics-widget']?.w > 0 ||
                currentLayout['orders-summary-widget']?.w > 0 ||
                settings.emgLayoutVersion !== 3;
            const needsLayout = !currentLayout['emg-welcome-widget'] || hasCharts;

            if (needsLayout || settings.theme !== 'dark') {
                localStorage.setItem(
                    LS_KEY,
                    JSON.stringify({
                        ...settings,
                        theme: 'dark',
                        emgLayoutVersion: 3,
                        widgetLayout: EMG_DEFAULT_WIDGET_LAYOUT,
                    }),
                );
                if (hasCharts && typeof window !== 'undefined') {
                    window.location.reload();
                }
            }
        } catch {
            // ignore storage errors
        }

        // Initial DOM cleanse
        cleanVendureFromDOM();

        // Observer to sanitize on dynamic route transitions or DOM insertions
        const observer = new MutationObserver(() => {
            cleanVendureFromDOM();
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
        });

        const titleObserver = new MutationObserver(() => {
            sanitizeTitle();
        });
        const titleEl = document.querySelector('title');
        if (titleEl) {
            titleObserver.observe(titleEl, { childList: true });
        }

        const interval = setInterval(cleanVendureFromDOM, 1000);

        return () => {
            observer.disconnect();
            titleObserver.disconnect();
            clearInterval(interval);
        };
    }, []);

    return <>{children}</>;
}
