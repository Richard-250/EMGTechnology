import {
    Asset,
    AssetTranslation,
    AssetType,
    ChannelService,
    ID,
    Logger,
    ProductService,
    RequestContext,
    TransactionalConnection,
    TranslatorService,
} from '@vendure/core';
import {Injectable} from '@nestjs/common';

import {CloudinaryClientService} from './cloudinary-client.service';
import type {CloudinaryMediaFolderKey} from './cloudinary.constants';
import type {
    CloudinaryMediaMetadata,
    CloudinaryUploadResult,
    CreateCloudinaryMediaOptions,
    GraphqlUploadFile,
} from './cloudinary-media.types';

const loggerCtx = 'EmgCloudinaryAssetService';

@Injectable()
export class EmgCloudinaryAssetService {
    constructor(
        private connection: TransactionalConnection,
        private channelService: ChannelService,
        private productService: ProductService,
        private translator: TranslatorService,
        private cloudinaryClient: CloudinaryClientService,
    ) {}

    async createAssetFromImageUrl(ctx: RequestContext, url: string, options: CreateCloudinaryMediaOptions) {
        const sourceUrl = await this.cloudinaryClient.validateRemoteUrl(url);
        const folder = this.cloudinaryClient.resolveFolder(options.folder, options.productId);
        const upload = await this.cloudinaryClient.uploadFromUrl(sourceUrl, folder);
        return this.persistUpload(ctx, upload, {...options, sourceUrl});
    }

    async uploadMediaFile(ctx: RequestContext, file: GraphqlUploadFile, options: CreateCloudinaryMediaOptions) {
        const folder = this.cloudinaryClient.resolveFolder(options.folder, options.productId);
        const upload = await this.cloudinaryClient.uploadFromFile(file, folder);
        return this.persistUpload(ctx, upload, options);
    }

    private async persistUpload(
        ctx: RequestContext,
        upload: CloudinaryUploadResult,
        options: CreateCloudinaryMediaOptions,
    ) {
        const metadata = this.buildMetadata(upload, options);
        let savedAsset: Asset | undefined;

        try {
            savedAsset = await this.saveAssetRecord(ctx, upload, metadata);
            let assignedToProduct = false;

            if (options.productId) {
                assignedToProduct = await this.assignAssetToProduct(
                    ctx,
                    options.productId,
                    savedAsset.id,
                    options.featured ?? false,
                );
            }

            Logger.info(
                `Cloudinary media saved as Asset ${savedAsset.id} (${upload.resource_type}: ${upload.public_id})`,
                loggerCtx,
            );

            return {
                asset: this.translator.translate(savedAsset, ctx),
                assignedToProduct,
            };
        } catch (error) {
            await this.cloudinaryClient.destroy(upload.public_id, upload.resource_type);
            throw error;
        }
    }

    private buildMetadata(
        upload: CloudinaryUploadResult,
        options: CreateCloudinaryMediaOptions,
    ): CloudinaryMediaMetadata {
        const secureUrl = upload.secure_url || upload.url;
        return {
            cloudinaryPublicId: upload.public_id,
            cloudinarySecureUrl: secureUrl,
            cloudinaryResourceType: upload.resource_type,
            cloudinaryFormat: upload.format,
            cloudinaryFolder: upload.folder ?? this.cloudinaryClient.resolveFolder(options.folder, options.productId),
            cloudinaryDuration: upload.duration ?? null,
            sourceImageUrl: options.sourceUrl ?? null,
        };
    }

    private async saveAssetRecord(
        ctx: RequestContext,
        upload: CloudinaryUploadResult,
        metadata: CloudinaryMediaMetadata,
    ): Promise<Asset> {
        const isVideo = upload.resource_type === 'video';
        const mimeType = isVideo
            ? `video/${upload.format}`
            : `image/${upload.format === 'jpg' ? 'jpeg' : upload.format}`;

        const assetType = isVideo ? AssetType.VIDEO : AssetType.IMAGE;
        const sourceUrl = this.cloudinaryClient.buildDeliveryUrl(upload.public_id, upload.resource_type, 'source');
        const previewUrl = this.cloudinaryClient.buildDeliveryUrl(
            upload.public_id,
            upload.resource_type,
            isVideo ? 'thumbnail' : 'preview',
        );
        const fileName = upload.public_id.split('/').pop() || upload.public_id;

        const asset = new Asset({
            type: assetType,
            width: upload.width ?? 0,
            height: upload.height ?? 0,
            fileSize: upload.bytes ?? 0,
            mimeType,
            source: sourceUrl,
            preview: previewUrl,
            focalPoint: null,
            customFields: metadata,
        });

        await this.channelService.assignToCurrentChannel(asset, ctx);
        const savedAsset = await this.connection.getRepository(ctx, Asset).save(asset);

        const translation = new AssetTranslation({
            languageCode: ctx.languageCode,
            name: fileName,
            base: savedAsset,
        });
        await this.connection.getRepository(ctx, AssetTranslation).save(translation);
        savedAsset.translations = [translation];

        return savedAsset;
    }

    async deleteCloudinaryAssetIfManaged(asset: Asset): Promise<void> {
        const fields = asset.customFields as CloudinaryMediaMetadata | undefined;
        const publicId = fields?.cloudinaryPublicId;
        if (!publicId) {
            return;
        }
        await this.cloudinaryClient.destroy(publicId, fields.cloudinaryResourceType || 'image');
    }

    /**
     * When admin uses native Vendure asset upload (local disk), mirror the file to Cloudinary
     * and rewrite Asset source/preview + metadata so the DB never remains the binary source of truth.
     */
    async migrateLocalAssetToCloudinary(ctx: RequestContext, asset: Asset, fileBuffer: Buffer): Promise<void> {
        if (!this.cloudinaryClient.isConfigured()) {
            return;
        }

        const fields = asset.customFields as CloudinaryMediaMetadata | undefined;
        if (fields?.cloudinaryPublicId) {
            return;
        }

        if (asset.source?.startsWith('http://') || asset.source?.startsWith('https://')) {
            return;
        }

        const filename = asset.source.split('/').pop() || `asset-${asset.id}`;
        const folder = this.cloudinaryClient.resolveFolder('products');
        const upload = await this.cloudinaryClient.uploadFromBuffer(
            fileBuffer,
            filename,
            asset.mimeType || 'application/octet-stream',
            folder,
        );

        const metadata = this.buildMetadata(upload, {folder: 'products'});
        const isVideo = upload.resource_type === 'video';
        asset.source = this.cloudinaryClient.buildDeliveryUrl(upload.public_id, upload.resource_type, 'source');
        asset.preview = this.cloudinaryClient.buildDeliveryUrl(
            upload.public_id,
            upload.resource_type,
            isVideo ? 'thumbnail' : 'preview',
        );
        asset.customFields = {
            ...(asset.customFields as object),
            ...metadata,
        };
        asset.width = upload.width ?? asset.width;
        asset.height = upload.height ?? asset.height;
        asset.fileSize = upload.bytes ?? asset.fileSize;

        await this.connection.getRepository(ctx, Asset).save(asset);
        Logger.info(`Migrated local Asset ${asset.id} to Cloudinary (${upload.public_id})`, loggerCtx);
    }

    private async assignAssetToProduct(
        ctx: RequestContext,
        productId: ID,
        assetId: ID,
        featured: boolean,
    ): Promise<boolean> {
        const product = await this.productService.findOne(ctx, productId, ['assets', 'featuredAsset']);
        if (!product) {
            throw new Error('Product not found.');
        }

        const existingAssetIds = product.assets?.map(row => row.assetId) ?? [];
        const assetIds = existingAssetIds.includes(assetId)
            ? existingAssetIds
            : [...existingAssetIds, assetId];

        await this.productService.update(ctx, {
            id: productId,
            assetIds,
            featuredAssetId: featured ? assetId : product.featuredAsset?.id ?? assetId,
        });

        return true;
    }

    parseFolder(value?: string | null): CloudinaryMediaFolderKey {
        switch (value?.toUpperCase()) {
            case 'CATEGORIES':
                return 'categories';
            case 'BANNERS':
                return 'banners';
            case 'USER_AVATARS':
                return 'userAvatars';
            case 'BLOG':
                return 'blog';
            case 'PRODUCTS':
            default:
                return 'products';
        }
    }
}
