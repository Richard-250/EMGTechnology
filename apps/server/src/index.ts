import { bootstrap, runMigrations } from '@vendure/core';
import { config } from './vendure-config';
import { configureShippingMethods } from './configure-shipping-methods';

runMigrations(config)
    .then(() => bootstrap(config))
    .then(async (app) => {
        try {
            await configureShippingMethods(app);
        } catch (e) {
            console.error('Failed to configure shipping methods:', e);
        }
        return app;
    })
    .catch(err => {
        console.log(err);
    });
