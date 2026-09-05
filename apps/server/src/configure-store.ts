import {
    bootstrap,
    ChannelService,
    CurrencyCode,
    DefaultJobQueuePlugin,
    LanguageCode,
    Logger,
    ProductVariantService,
    RequestContextService,
} from '@vendure/core';
import { config } from './vendure-config';
import { configurePaymentMethods } from './configure-payment-methods';
import { configureShippingMethods } from './configure-shipping-methods';

const loggerCtx = 'ConfigureStore';

/** Approximate RWF → USD conversion for catalog display prices. */
import {DEFAULT_RWF_PER_USD, rwfMinorToUsdMinor} from './plugins/emg-product-admin/currency-convert';

const RWF_PER_USD = DEFAULT_RWF_PER_USD;

export async function configureChannelAndUsdPrices(app: Awaited<ReturnType<typeof bootstrap>>) {
    const requestContextService = app.get(RequestContextService);
    const channelService = app.get(ChannelService);
    const productVariantService = app.get(ProductVariantService);

    const ctx = await requestContextService.create({ apiType: 'admin' });
    const defaultChannel = await channelService.getDefaultChannel(ctx);

    await channelService.update(ctx, {
        id: defaultChannel.id,
        defaultCurrencyCode: CurrencyCode.RWF,
        currencyCode: CurrencyCode.RWF,
        availableCurrencyCodes: [CurrencyCode.RWF, CurrencyCode.USD],
        defaultLanguageCode: LanguageCode.en,
        availableLanguageCodes: [LanguageCode.en, LanguageCode.fr, LanguageCode.rw],
    });
    Logger.info('Channel configured: RWF + USD, languages en/fr/rw', loggerCtx);

    let skip = 0;
    const take = 50;
    let updated = 0;

    while (true) {
        const { items, totalItems } = await productVariantService.findAll(ctx, { take, skip });
        if (!items.length) {
            break;
        }

        for (const variant of items) {
            const prices = await productVariantService.getProductVariantPrices(ctx, variant.id);
            const rwfPrice = prices.find(p => p.currencyCode === CurrencyCode.RWF)?.price ?? variant.price;
            const usdMinor = rwfMinorToUsdMinor(rwfPrice, RWF_PER_USD);

            await productVariantService.createOrUpdateProductVariantPrice(
                ctx,
                variant.id,
                usdMinor,
                defaultChannel.id,
                CurrencyCode.USD,
            );
            updated += 1;
        }

        skip += take;
        if (skip >= totalItems) {
            break;
        }
    }

    Logger.info(`USD prices set for ${updated} product variant(s)`, loggerCtx);
}

async function run() {
    process.env.PORT = process.env.SEED_PORT || '3101';

    const app = await bootstrap({
        ...config,
        apiOptions: {
            ...config.apiOptions,
            port: +(process.env.PORT || 3101),
        },
        plugins: (config.plugins || []).filter(plugin => plugin !== DefaultJobQueuePlugin),
    });

    await configureChannelAndUsdPrices(app);
    await configurePaymentMethods(app);
    await configureShippingMethods(app);
    await app.close();
    process.exit(0);
}

if (require.main === module) {
    run().catch(err => {
        Logger.error(err?.message || String(err), loggerCtx, err?.stack);
        process.exit(1);
    });
}
