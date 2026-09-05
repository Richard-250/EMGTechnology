import {PluginCommonModule, VendurePlugin} from '@vendure/core';

import {emgExchangeRateAdminApiExtensions} from './api-extensions';
import {EmgExchangeRateResolver} from './emg-exchange-rate.resolver';
import {EmgExchangeRateService} from './emg-exchange-rate.service';
import {EmgSkuService} from './emg-sku.service';
import {EmgStorefrontRevalidationService} from './emg-storefront-revalidation.service';

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [EmgSkuService, EmgStorefrontRevalidationService, EmgExchangeRateService],
    adminApiExtensions: {
        schema: emgExchangeRateAdminApiExtensions,
        resolvers: [EmgExchangeRateResolver],
    },
    dashboard: './dashboard/index.tsx',
})
export class EmgProductAdminPlugin {}
