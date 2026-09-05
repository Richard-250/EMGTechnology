import {useEffect, type ReactNode} from 'react';
import {defineDashboardExtension} from '@vendure/dashboard';

import logoUrl from './assets/logo.png';
import {EmgDefaultLayoutProvider} from './default-layout-provider';
import {EmgLoadingStabilityProvider} from './emg-loading-provider';
import {
    EmgFeaturedWidget,
    EmgStatsWidget,
    EmgWelcomeWidget,
} from './widgets';

function EmgLoginLogo() {
    return (
        <div className="flex flex-col items-center gap-2">
            <img
                src={logoUrl}
                alt="EMG Technology Ltd"
                className="h-20 w-auto max-w-[300px] object-contain"
            />
        </div>
    );
}

function EmgLoginWelcome() {
    return (
        <div className="w-full text-center space-y-1 mb-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                EMG Technology Ltd
            </h1>
            <p className="text-sm text-muted-foreground">
                Admin dashboard: manage products, orders and customers
            </p>
        </div>
    );
}

function EmgToolbarBrand() {
    return (
        <div className="emg-toolbar-brand flex items-center gap-2 pr-2 border-r border-border mr-1">
            <img src={logoUrl} alt="EMG Technology" className="h-6 md:h-7 w-auto object-contain" />
            <span className="text-xs md:text-sm font-semibold text-foreground hidden sm:inline">EMG Admin</span>
        </div>
    );
}

/** Sets EMG favicon/title and passes through dashboard children (required for custom providers). */
function EmgFaviconSetter({children}: {children: ReactNode}) {
    useEffect(() => {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.type = 'image/png';
        link.href = logoUrl;
        document.title = 'EMG Technology Ltd Admin';
    }, []);

    return <>{children}</>;
}

defineDashboardExtension({
    login: {
        logo: { component: EmgLoginLogo },
        beforeForm: { component: EmgLoginWelcome },
    },
    toolbarItems: [
        {
            id: 'emg-toolbar-brand',
            component: EmgToolbarBrand,
        },
    ],
    customProviders: [
        {
            id: 'emg-favicon-setter',
            component: EmgFaviconSetter,
            location: 'app',
            order: 1,
        },
        {
            id: 'emg-loading-stability',
            component: EmgLoadingStabilityProvider,
            location: 'app',
            order: 50,
        },
        {
            id: 'emg-default-layout',
            component: EmgDefaultLayoutProvider,
            location: 'app',
            order: 100,
        },
    ],
    // Override built-in Insights widgets (same IDs) so the grid stays constant —
    // no off-screen / zero-size placeholders.
    widgets: [
        {
            id: 'latest-orders-widget',
            name: 'EMG Welcome',
            component: EmgWelcomeWidget,
            defaultSize: { w: 12, h: 2, x: 0, y: 0 },
            minSize: { w: 6, h: 2 },
            requiresPermissions: ['ReadOrder'],
        },
        {
            id: 'metrics-widget',
            name: 'EMG Analytics',
            component: EmgStatsWidget,
            defaultSize: { w: 12, h: 10, x: 0, y: 2 },
            minSize: { w: 6, h: 6 },
            requiresPermissions: ['ReadOrder'],
        },
        {
            id: 'orders-summary-widget',
            name: 'EMG Operations',
            component: EmgFeaturedWidget,
            defaultSize: { w: 12, h: 6, x: 0, y: 12 },
            minSize: { w: 6, h: 4 },
            requiresPermissions: ['ReadOrder'],
        },
    ],
});
