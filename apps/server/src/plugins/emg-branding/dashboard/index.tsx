import { defineDashboardExtension } from '@vendure/dashboard';

import logoUrl from './assets/logo.png';
import { EmgDefaultLayoutProvider } from './default-layout-provider';
import {
    EmgFeaturedWidget,
    EmgHiddenWidget,
    EmgStatsWidget,
    EmgWelcomeWidget,
} from './widgets';

function EmgLoginLogo() {
    return (
        <div className="flex flex-col items-center gap-2">
            <img
                src={logoUrl}
                alt="EMG Technology Ltd"
                className="h-20 w-auto max-w-[300px] object-contain rounded-lg bg-white/10 p-2"
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
                Admin dashboard — manage products, orders &amp; customers
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
            id: 'emg-default-layout',
            component: EmgDefaultLayoutProvider,
            location: 'app',
            order: 100,
        },
    ],
    widgets: [
        {
            id: 'emg-welcome-widget',
            name: 'EMG Welcome',
            component: EmgWelcomeWidget,
            defaultSize: { w: 8, h: 3, x: 0, y: 0 },
            minSize: { w: 4, h: 2 },
            requiresPermissions: ['ReadOrder'],
        },
        {
            id: 'emg-featured-widget',
            name: 'EMG Featured',
            component: EmgFeaturedWidget,
            defaultSize: { w: 4, h: 3, x: 8, y: 0 },
            minSize: { w: 3, h: 2 },
            requiresPermissions: ['ReadOrder'],
        },
        {
            id: 'emg-stats-widget',
            name: 'EMG Stats',
            component: EmgStatsWidget,
            defaultSize: { w: 12, h: 2, x: 0, y: 3 },
            minSize: { w: 6, h: 2 },
            requiresPermissions: ['ReadOrder'],
        },
        {
            id: 'metrics-widget',
            name: 'Hidden sales chart',
            component: EmgHiddenWidget,
            defaultSize: { w: 0, h: 0, x: 0, y: 99 },
            minSize: { w: 0, h: 0 },
            requiresPermissions: ['ReadOrder'],
        },
        {
            id: 'orders-summary-widget',
            name: 'Hidden orders chart',
            component: EmgHiddenWidget,
            defaultSize: { w: 0, h: 0, x: 0, y: 99 },
            minSize: { w: 0, h: 0 },
            requiresPermissions: ['ReadOrder'],
        },
        {
            id: 'latest-orders-widget',
            name: 'Hidden default overview',
            component: EmgHiddenWidget,
            defaultSize: { w: 0, h: 0, x: 0, y: 99 },
            minSize: { w: 0, h: 0 },
            requiresPermissions: ['ReadOrder'],
        },
    ],
});
