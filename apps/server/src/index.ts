import { bootstrap, runMigrations } from '@vendure/core';
import { config } from './vendure-config';
import { configureAdministratorRoles } from './configure-administrator-roles';
import { configureShippingMethods } from './configure-shipping-methods';
import { configureSuperDeals } from './configure-super-deals';
import { configurePaymentMethods } from './configure-payment-methods';
import { ensureCustomFieldColumns } from './ensure-custom-field-columns';

runMigrations(config)
    .then(() => bootstrap(config))
    .then(async (app) => {
        try {
            await ensureCustomFieldColumns(app);
        } catch (e) {
            console.error('Failed to ensure custom field columns:', e);
        }
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
            await configureAdministratorRoles(app);
        } catch (e) {
            console.error('Failed to configure administrator roles:', e);
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
