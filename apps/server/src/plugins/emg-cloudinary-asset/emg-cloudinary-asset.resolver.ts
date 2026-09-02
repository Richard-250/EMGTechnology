import {Args, Mutation, Resolver} from '@nestjs/graphql';
import {Allow, Ctx, ID, Permission, RequestContext, Transaction} from '@vendure/core';

import {EmgCloudinaryAssetService} from './emg-cloudinary-asset.service';
import type {GraphqlUploadFile} from './cloudinary-media.types';

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
        @Args('folder', {nullable: true}) folder?: string,
    ) {
        return this.cloudinaryAssetService.createAssetFromImageUrl(ctx, url, {
            productId,
            featured,
            folder: this.cloudinaryAssetService.parseFolder(folder),
        });
    }

    @Transaction()
    @Mutation()
    @Allow(Permission.CreateAsset, Permission.UpdateCatalog)
    async uploadMediaToCloudinary(
        @Ctx() ctx: RequestContext,
        @Args() args: {file: GraphqlUploadFile | Promise<GraphqlUploadFile>},
        @Args('folder') folder: string,
        @Args('productId', {nullable: true}) productId?: ID,
        @Args('featured', {nullable: true}) featured?: boolean,
    ) {
        const file = await Promise.resolve(args.file);
        return this.cloudinaryAssetService.uploadMediaFile(ctx, file, {
            productId,
            featured,
            folder: this.cloudinaryAssetService.parseFolder(folder),
        });
    }
}
