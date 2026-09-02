import { bootstrap, runMigrations } from '@vendure/core';
import { config } from './vendure-config';
import { configureShippingMethods } from './configure-shipping-methods';
import { configureSuperDeals } from './configure-super-deals';
import { configurePaymentMethods } from './configure-payment-methods';

runMigrations(config)
    .then(() => bootstrap(config))
    .then(async (app) => {
        try {
            await configureShippingMethods(app);
        } catch (e) {
            console.error('Failed to configure shipping methods:', e);
        }
        try {
            await configurePaymentMethods(app);
        } catch (e) {
            console.error('Failed to configure payment methods:', e);
        }
        try {
            await configureSuperDeals(app);
        } catch (e) {
            console.error('Failed to configure super deals:', e);
        }
        return app;
    })
    .catch(err => {
        console.log(err);
    });
