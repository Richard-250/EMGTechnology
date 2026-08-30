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

    // 3. Hide redundant "Insights" page title so welcome card is at the very top
    const h1s = document.querySelectorAll('h1');
    h1s.forEach(h1 => {
        if (h1.textContent?.trim() === 'Insights') {
            h1.style.setProperty('display', 'none', 'important');
        }
    });

    // 4. Hide any react-grid-item containers that hold hidden widgets
    const hiddenItems = document.querySelectorAll('.react-grid-item');
    hiddenItems.forEach(item => {
        if (item.querySelector('[data-emg-hidden-widget]') || item.querySelector('.hidden')) {
            (item as HTMLElement).style.setProperty('display', 'none', 'important');
            (item as HTMLElement).style.setProperty('height', '0px', 'important');
            (item as HTMLElement).style.setProperty('width', '0px', 'important');
            (item as HTMLElement).style.setProperty('position', 'absolute', 'important');
            (item as HTMLElement).style.setProperty('top', '-9999px', 'important');
        }
    });

    // 5. Remove external platform upsell links (e.g., Explore Platform & Cloud / pricing)
    const links = document.querySelectorAll('a[href*="vendure.io"]');
    links.forEach(link => {
        const item = link.closest('[data-slot="dropdown-menu-item"]') || link.parentElement;
        if (item && item.parentElement) {
            item.remove();
        } else {
            (link as HTMLElement).style.setProperty('display', 'none', 'important');
        }
    });

    // 6. Sanitize meta tags
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', 'EMG Technology Admin Dashboard');
    }
    const metaAuthor = document.querySelector('meta[name="author"]');
    if (metaAuthor) {
        metaAuthor.setAttribute('content', 'EMG Technology Ltd');
    }

    // 7. Sanitize document title
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

        // Layout reset if needed — force Welcome widget at y: 0
        try {
            const raw = localStorage.getItem(LS_KEY);
            const settings = raw ? JSON.parse(raw) : {};
            const currentLayout = settings.widgetLayout ?? {};
            const welcomeY = currentLayout['emg-welcome-widget']?.y;
            const needsLayout =
                welcomeY !== 0 ||
                settings.emgLayoutVersion !== 25 ||
                !currentLayout['emg-welcome-widget'] ||
                currentLayout['metrics-widget']?.w > 0 ||
                currentLayout['orders-summary-widget']?.w > 0;

            if (needsLayout || settings.theme !== 'dark') {
                localStorage.setItem(
                    LS_KEY,
                    JSON.stringify({
                        ...settings,
                        theme: 'dark',
                        emgLayoutVersion: 25,
                        widgetLayout: EMG_DEFAULT_WIDGET_LAYOUT,
                    }),
                );
                if (typeof window !== 'undefined') {
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

        const interval = setInterval(cleanVendureFromDOM, 500);

        return () => {
            observer.disconnect();
            titleObserver.disconnect();
            clearInterval(interval);
        };
    }, []);

    return <>{children}</>;
}
