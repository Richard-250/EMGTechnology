import {Injectable, OnModuleInit} from '@nestjs/common';
import {Asset, ConfigService, EventBus, Logger, RequestContext} from '@vendure/core';
import {AssetEvent} from '@vendure/core/dist/event-bus/events/asset-event';

import {EmgCloudinaryAssetService} from './emg-cloudinary-asset.service';
import type {CloudinaryMediaMetadata} from './cloudinary-media.types';
import {CloudinaryClientService} from './cloudinary-client.service';

const loggerCtx = 'CloudinaryAssetListener';

@Injectable()
export class CloudinaryAssetListener implements OnModuleInit {
    constructor(
        private eventBus: EventBus,
        private cloudinaryAssetService: EmgCloudinaryAssetService,
        private cloudinaryClient: CloudinaryClientService,
        private configService: ConfigService,
    ) {}

    onModuleInit() {
        this.eventBus.ofType(AssetEvent).subscribe(event => {
            if (event.type === 'deleted') {
                void this.handleDeleted(event.entity);
                return;
            }
            if (event.type === 'created') {
                void this.handleCreated(event.ctx, event.entity);
            }
        });
    }

    private async handleDeleted(asset: Asset) {
        const fields = asset.customFields as CloudinaryMediaMetadata | undefined;
        if (!fields?.cloudinaryPublicId) {
            return;
        }
        Logger.info(`Removing Cloudinary file for deleted Asset ${asset.id}`, loggerCtx);
        await this.cloudinaryAssetService.deleteCloudinaryAssetIfManaged(asset);
    }

    private async handleCreated(ctx: RequestContext, asset: Asset) {
        if (!this.cloudinaryClient.isConfigured()) {
            return;
        }

        const fields = asset.customFields as CloudinaryMediaMetadata | undefined;
        if (fields?.cloudinaryPublicId) {
            // Already created via Cloudinary panel / API — nothing to migrate.
            return;
        }

        if (!asset.source) {
            return;
        }

        try {
            if (asset.source.startsWith('http://') || asset.source.startsWith('https://')) {
                if (asset.source.includes('res.cloudinary.com')) {
                    return;
                }
                // External pasted URL via native UI → pull into Cloudinary, keep Asset visible with CDN URL.
                await this.cloudinaryAssetService.migrateExternalUrlAssetToCloudinary(ctx, asset);
                return;
            }

            // Native local disk upload → Cloudinary, then delete local binary.
            const localIdentifier = asset.source;
            const buffer = await this.configService.assetOptions.assetStorageStrategy.readFileToBuffer(
                localIdentifier,
            );
            await this.cloudinaryAssetService.migrateLocalAssetToCloudinary(ctx, asset, buffer);
            try {
                await this.configService.assetOptions.assetStorageStrategy.deleteFile(localIdentifier);
            } catch {
                // ignore cleanup failures
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            Logger.error(
                `Could not migrate Asset ${asset.id} to Cloudinary (original source kept): ${message}`,
                loggerCtx,
            );
        }
    }
}
