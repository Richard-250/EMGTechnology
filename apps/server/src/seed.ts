import {
    bootstrap,
    CustomerService,
    DefaultJobQueuePlugin,
    isGraphQlErrorResult,
    Logger,
    RequestContextService,
} from '@vendure/core';
import { populate } from '@vendure/core/cli';
import path from 'path';
import { configureChannelAndUsdPrices } from './configure-store';
import { configurePaymentMethods } from './configure-payment-methods';
import { configureShippingMethods } from './configure-shipping-methods';
import { config } from './vendure-config';
import { initialData } from './initial-data';

const loggerCtx = 'Seed';

const TEST_CUSTOMERS = [
    {
        emailAddress: 'customer@example.com',
        firstName: 'Test',
        lastName: 'Customer',
        password: 'customer',
    },
];

async function seed() {
    // Avoid colliding with a running API server during seeding.
    process.env.PORT = process.env.SEED_PORT || '3101';

    const productsCsv = path.join(__dirname, '../assets/products.csv');

    Logger.info('Populating countries, tax, shipping, payment + fitness products...', loggerCtx);

    const app = await populate(
        () =>
            bootstrap({
                ...config,
                apiOptions: {
                    ...config.apiOptions,
                    port: +(process.env.PORT || 3101),
                },
                plugins: (config.plugins || []).filter(plugin => plugin !== DefaultJobQueuePlugin),
            }),
        initialData,
        productsCsv,
    );

    const requestContextService = app.get(RequestContextService);
    const customerService = app.get(CustomerService);

    await configureChannelAndUsdPrices(app);
    await configurePaymentMethods(app);
    await configureShippingMethods(app);

    const ctx = await requestContextService.create({
        apiType: 'admin',
    });

    for (const customerInput of TEST_CUSTOMERS) {
        const { password, ...input } = customerInput;
        const existing = await customerService.findAll(ctx, {
            filter: { emailAddress: { eq: input.emailAddress } },
            take: 1,
        });

        if (existing.items.length > 0) {
            Logger.info(`Customer already exists: ${input.emailAddress}`, loggerCtx);
            continue;
        }

        const result = await customerService.create(ctx, input, password);
        if (isGraphQlErrorResult(result)) {
            Logger.error(`Failed to create customer ${input.emailAddress}: ${result.message}`, loggerCtx);
            continue;
        }

        Logger.info(`Created customer: ${input.emailAddress} (password: ${password})`, loggerCtx);
    }

    Logger.info(
        `Admin login: ${process.env.SUPERADMIN_USERNAME} / ${process.env.SUPERADMIN_PASSWORD}`,
        loggerCtx,
    );
    Logger.info('Seed complete', loggerCtx);

    await app.close();
    process.exit(0);
}

seed().catch(err => {
    Logger.error(err.message, loggerCtx, err.stack);
    process.exit(1);
});
