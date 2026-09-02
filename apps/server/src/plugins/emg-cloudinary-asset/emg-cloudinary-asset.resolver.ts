import {Args, Mutation, Resolver} from '@nestjs/graphql';
import {Allow, Ctx, ID, Permission, RequestContext, Transaction} from '@vendure/core';

import {EmgCloudinaryAssetService} from './emg-cloudinary-asset.service';

@Resolver()
export class EmgCloudinaryAssetResolver {
    constructor(private cloudinaryAssetService: EmgCloudinaryAssetService) {}

    @Transaction()
    @Mutation()
    @Allow(Permission.CreateAsset, Permission.UpdateCatalog)
    async createAssetFromImageUrl(
        @Ctx() ctx: RequestContext,
        @Args('url') url: string,
        @Args('productId', {nullable: true}) productId?: ID,
        @Args('featured', {nullable: true}) featured?: boolean,
    ) {
        return this.cloudinaryAssetService.createAssetFromImageUrl(ctx, url, {
            productId,
            featured,
        });
    }
}
