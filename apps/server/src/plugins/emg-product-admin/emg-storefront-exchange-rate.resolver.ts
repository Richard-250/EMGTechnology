import {Query, Resolver} from '@nestjs/graphql';
import {Allow, Ctx, Permission, RequestContext} from '@vendure/core';

import {EmgExchangeRateService} from './emg-exchange-rate.service';

/**
 * Shop-only resolver. Must not include admin-only fields (emgExchangeRate),
 * or Nest GraphQL will crash the Shop API with “defined in resolvers, but not in schema”.
 */
@Resolver()
export class EmgStorefrontExchangeRateResolver {
    constructor(private readonly exchangeRateService: EmgExchangeRateService) {}

    @Query()
    @Allow(Permission.Public)
    async emgStorefrontRwfPerUsd(@Ctx() ctx: RequestContext) {
        return this.exchangeRateService.getRwfPerUsd(ctx);
    }
}
