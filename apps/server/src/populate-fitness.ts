import { bootstrap, DefaultJobQueuePlugin, Logger } from '@vendure/core';
import { populate } from '@vendure/core/cli';
import path from 'path';
import { config } from './vendure-config';
import { initialData } from './initial-data';

const loggerCtx = 'PopulateFitness';

async function run() {
    process.env.PORT = process.env.SEED_PORT || '3101';

    const productsCsv = path.join(__dirname, '../assets/products.csv');

    Logger.info('Populating initial commerce data + fitness catalog...', loggerCtx);

    const app = await populate(
        () =>
            bootstrap({
                ...config,
                apiOptions: {
                    ...config.apiOptions,
                    port: +(process.env.PORT || 3101),
                },
                plugins: (config.plugins || []).filter(
                    // Job queue interferes with one-shot populate scripts
                    plugin => plugin !== DefaultJobQueuePlugin,
                ),
            }),
        initialData,
        productsCsv,
    );

    Logger.info('Fitness catalog populate complete', loggerCtx);
    await app.close();
    process.exit(0);
}

run().catch(err => {
    Logger.error(err?.message || String(err), loggerCtx, err?.stack);
    process.exit(1);
});
