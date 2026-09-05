import {Injectable} from '@nestjs/common';
import {
    ChannelService,
    CurrencyCode,
    GlobalSettingsService,
    Logger,
    ProductVariantService,
    RequestContext,
} from '@vendure/core';

import {DEFAULT_RWF_PER_USD, rwfMinorToUsdMinor, usdMinorToRwfMinor} from './currency-convert';

export type EmgExchangeRecalcDirection = 'RWF_TO_USD' | 'USD_TO_RWF';

@Injectable()
export class EmgExchangeRateService {
    private readonly logger = new Logger();

    constructor(
        private readonly globalSettingsService: GlobalSettingsService,
        private readonly productVariantService: ProductVariantService,
        private readonly channelService: ChannelService,
    ) {}

    async getRwfPerUsd(ctx: RequestContext): Promise<number> {
        const settings = await this.globalSettingsService.getSettings(ctx);
        const rate = Number((settings.customFields as {rwfPerUsd?: number} | null)?.rwfPerUsd);
        return rate > 0 ? rate : DEFAULT_RWF_PER_USD;
    }

    async setRwfPerUsd(ctx: RequestContext, rwfPerUsd: number): Promise<number> {
        if (!Number.isFinite(rwfPerUsd) || rwfPerUsd < 1) {
            throw new Error('Exchange rate must be a number greater than or equal to 1');
        }

        const rounded = Math.round(rwfPerUsd * 100) / 100;
        await this.globalSettingsService.updateSettings(ctx, {
            customFields: {rwfPerUsd: rounded},
        });
        return rounded;
    }

    /**
     * Save the rate and recalculate every variant's opposite currency from the source currency.
     */
    async saveRateAndRecalculate(
        ctx: RequestContext,
        rwfPerUsd: number,
        direction: EmgExchangeRecalcDirection = 'RWF_TO_USD',
    ): Promise<{rate: number; updated: number}> {
        const rate = await this.setRwfPerUsd(ctx, rwfPerUsd);
        const updated = await this.recalculateAllPrices(ctx, rate, direction);
        return {rate, updated};
    }

    async recalculateAllPrices(
        ctx: RequestContext,
        rwfPerUsd?: number,
        direction: EmgExchangeRecalcDirection = 'RWF_TO_USD',
    ): Promise<number> {
        const rate = rwfPerUsd && rwfPerUsd > 0 ? rwfPerUsd : await this.getRwfPerUsd(ctx);
        const channel = await this.channelService.getDefaultChannel(ctx);

        let skip = 0;
        const take = 50;
        let updated = 0;

        while (true) {
            const {items, totalItems} = await this.productVariantService.findAll(ctx, {take, skip});
            if (!items.length) break;

            for (const variant of items) {
                const prices = await this.productVariantService.getProductVariantPrices(ctx, variant.id);
                const rwf = prices.find(p => p.currencyCode === CurrencyCode.RWF)?.price;
                const usd = prices.find(p => p.currencyCode === CurrencyCode.USD)?.price;

                if (direction === 'RWF_TO_USD') {
                    const source = rwf ?? (variant.currencyCode === CurrencyCode.RWF ? variant.price : null);
                    if (source == null || source <= 0) continue;
                    const usdMinor = rwfMinorToUsdMinor(source, rate);
                    await this.productVariantService.createOrUpdateProductVariantPrice(
                        ctx,
                        variant.id,
                        usdMinor,
                        channel.id,
                        CurrencyCode.USD,
                    );
                    updated += 1;
                } else {
                    const source = usd ?? (variant.currencyCode === CurrencyCode.USD ? variant.price : null);
                    if (source == null || source <= 0) continue;
                    const rwfMinor = usdMinorToRwfMinor(source, rate);
                    await this.productVariantService.createOrUpdateProductVariantPrice(
                        ctx,
                        variant.id,
                        rwfMinor,
                        channel.id,
                        CurrencyCode.RWF,
                    );
                    updated += 1;
                }
            }

            skip += take;
            if (skip >= totalItems) break;
        }

        this.logger.info(
            `Recalculated ${updated} variant price(s) at rate ${rate} RWF/USD (${direction})`,
            'EmgExchangeRateService',
        );
        return updated;
    }
}
