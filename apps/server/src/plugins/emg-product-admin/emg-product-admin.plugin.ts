import {PluginCommonModule, VendurePlugin} from '@vendure/core';

import {EmgSkuService} from './emg-sku.service';
import {EmgStorefrontRevalidationService} from './emg-storefront-revalidation.service';

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [EmgSkuService, EmgStorefrontRevalidationService],
    dashboard: './dashboard/index.tsx',
})
export class EmgProductAdminPlugin {}
