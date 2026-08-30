import { PluginCommonModule, VendurePlugin } from '@vendure/core';

/**
 * EMG Technology branding for the Admin Dashboard
 * (login logo, Insights chart widgets).
 */
@VendurePlugin({
    imports: [PluginCommonModule],
    dashboard: './dashboard/index.tsx',
})
export class EmgBrandingPlugin {}
