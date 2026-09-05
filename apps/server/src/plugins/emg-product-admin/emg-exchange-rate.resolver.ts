import {Args, Mutation, Query, Resolver} from '@nestjs/graphql';
import {Allow, Ctx, Permission, RequestContext, Transaction} from '@vendure/core';

import {EmgExchangeRateService} from './emg-exchange-rate.service';

@Resolver()
export class EmgExchangeRateResolver {
    constructor(private readonly exchangeRateService: EmgExchangeRateService) {}

    @Query()
    @Allow(Permission.ReadSettings, Permission.UpdateCatalog, Permission.UpdateProduct)
    async emgExchangeRate(@Ctx() ctx: RequestContext) {
        const rwfPerUsd = await this.exchangeRateService.getRwfPerUsd(ctx);
        return {rwfPerUsd};
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.UpdateSettings, Permission.UpdateCatalog, Permission.UpdateProduct)
    async emgUpdateExchangeRate(
        @Ctx() ctx: RequestContext,
        @Args()
        args: {
            rwfPerUsd: number;
            recalculate?: boolean;
            direction?: string;
        },
    ) {
        const direction = args.direction === 'USD_TO_RWF' ? 'USD_TO_RWF' : 'RWF_TO_USD';
        if (args.recalculate === false) {
            const rate = await this.exchangeRateService.setRwfPerUsd(ctx, args.rwfPerUsd);
            return {rwfPerUsd: rate, updatedVariants: 0};
        }

        const result = await this.exchangeRateService.saveRateAndRecalculate(
            ctx,
            args.rwfPerUsd,
            direction,
        );
        return {rwfPerUsd: result.rate, updatedVariants: result.updated};
    }
}
