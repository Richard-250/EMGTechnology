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
import {v2 as cloudinary} from 'cloudinary';
import {Injectable, OnModuleInit} from '@nestjs/common';

const loggerCtx = 'EmgCloudinaryAssetService';

export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    url: string;
    format: string;
    width: number;
    height: number;
    bytes: number;
    resource_type: string;
    folder?: string;
}

@Injectable()
export class EmgCloudinaryAssetService implements OnModuleInit {
    private configured = false;

    constructor(
        private connection: TransactionalConnection,
        private channelService: ChannelService,
        private productService: ProductService,
        private translator: TranslatorService,
    ) {}

    onModuleInit() {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            Logger.warn(
                'Cloudinary credentials missing — paste-URL asset import will be unavailable until CLOUDINARY_* env vars are set.',
                loggerCtx,
            );
            return;
        }

        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true,
        });
        this.configured = true;
        Logger.info(`Cloudinary asset import ready (cloud: ${cloudName})`, loggerCtx);
    }

    isConfigured(): boolean {
        return this.configured;
    }

    private validateImageUrl(url: string): string {
        const trimmed = url.trim();
        let parsed: URL;
        try {
            parsed = new URL(trimmed);
        } catch {
            throw new Error('Enter a valid image URL (must start with http:// or https://).');
        }

        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Only http and https image URLs are supported.');
        }

        return trimmed;
    }

    private buildPreviewUrl(publicId: string): string {
        return cloudinary.url(publicId, {
            secure: true,
            transformation: [{width: 800, height: 800, crop: 'limit', quality: 'auto'}],
        });
    }

    async uploadFromUrl(sourceUrl: string): Promise<CloudinaryUploadResult> {
        if (!this.configured) {
            throw new Error(
                'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
            );
        }

        const folder = process.env.CLOUDINARY_FOLDER || 'emg-products';
        const result = await cloudinary.uploader.upload(sourceUrl, {
            folder,
            resource_type: 'auto',
            overwrite: false,
            unique_filename: true,
        });

        return result as CloudinaryUploadResult;
    }

    async createAssetFromImageUrl(
        ctx: RequestContext,
        url: string,
        options?: {productId?: ID; featured?: boolean},
    ) {
        const sourceUrl = this.validateImageUrl(url);
        const upload = await this.uploadFromUrl(sourceUrl);

        const mimeType =
            upload.resource_type === 'image'
                ? `image/${upload.format === 'jpg' ? 'jpeg' : upload.format}`
                : `${upload.resource_type}/${upload.format}`;

        const assetType = mimeType.startsWith('image/') ? AssetType.IMAGE : AssetType.BINARY;
        const secureUrl = upload.secure_url || upload.url;
        const previewUrl = this.buildPreviewUrl(upload.public_id);
        const fileName = upload.public_id.split('/').pop() || upload.public_id;

        const asset = new Asset({
            type: assetType,
            width: upload.width ?? 0,
            height: upload.height ?? 0,
            fileSize: upload.bytes ?? 0,
            mimeType,
            source: secureUrl,
            preview: previewUrl,
            focalPoint: null,
            customFields: {
                cloudinaryPublicId: upload.public_id,
                cloudinarySecureUrl: secureUrl,
                sourceImageUrl: sourceUrl,
                cloudinaryFormat: upload.format,
                cloudinaryFolder: upload.folder ?? process.env.CLOUDINARY_FOLDER ?? 'emg-products',
            },
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

        let assignedToProduct = false;
        if (options?.productId) {
            assignedToProduct = await this.assignAssetToProduct(
                ctx,
                options.productId,
                savedAsset.id,
                options.featured ?? false,
            );
        }

        Logger.info(
            `Created Cloudinary asset ${savedAsset.id} from ${sourceUrl} (public_id: ${upload.public_id})`,
            loggerCtx,
        );

        return {
            asset: this.translator.translate(savedAsset, ctx),
            assignedToProduct,
        };
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
}
