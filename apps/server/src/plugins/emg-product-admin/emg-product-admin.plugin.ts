import {PluginCommonModule, VendurePlugin} from '@vendure/core';

import {
    emgExchangeRateAdminApiExtensions,
    emgStorefrontShopApiExtensions,
} from './api-extensions';
import {ConfirmOrderPaymentService, confirmOrderPaymentPermission} from './confirm-order-payment.service';
import {EmgExchangeRateResolver} from './emg-exchange-rate.resolver';
import {EmgExchangeRateService} from './emg-exchange-rate.service';
import {EmgOrderOpsResolver} from './emg-order-ops.resolver';
import {EmgSkuService} from './emg-sku.service';
import {EmgStorefrontExchangeRateResolver} from './emg-storefront-exchange-rate.resolver';
import {EmgPaymentProofUploadResolver} from './emg-payment-proof-upload.resolver';
import {EmgStorefrontRevalidationService} from './emg-storefront-revalidation.service';
import {OrderNotifyService} from './order-notify.service';
import {PaymentConfirmedByListener} from './payment-confirmed-by.listener';

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [
        EmgSkuService,
        EmgStorefrontRevalidationService,
        EmgExchangeRateService,
        OrderNotifyService,
        ConfirmOrderPaymentService,
        PaymentConfirmedByListener,
    ],
    shopApiExtensions: {
        schema: emgStorefrontShopApiExtensions,
        resolvers: [EmgStorefrontExchangeRateResolver, EmgPaymentProofUploadResolver],
    },
    adminApiExtensions: {
        schema: emgExchangeRateAdminApiExtensions,
        resolvers: [EmgExchangeRateResolver, EmgOrderOpsResolver],
    },
    configuration: config => {
        config.authOptions.customPermissions.push(confirmOrderPaymentPermission);
        return config;
    },
    exports: [OrderNotifyService, ConfirmOrderPaymentService],
    dashboard: './dashboard/index.tsx',
})
export class EmgProductAdminPlugin {}
