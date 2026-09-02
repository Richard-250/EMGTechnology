import {Injectable, OnModuleInit} from '@nestjs/common';
import {Asset, EventBus, Logger} from '@vendure/core';
import {AssetEvent} from '@vendure/core/dist/event-bus/events/asset-event';

import {EmgCloudinaryAssetService} from './emg-cloudinary-asset.service';
import type {CloudinaryMediaMetadata} from './cloudinary-media.types';

const loggerCtx = 'CloudinaryAssetListener';

@Injectable()
export class CloudinaryAssetListener implements OnModuleInit {
    constructor(
        private eventBus: EventBus,
        private cloudinaryAssetService: EmgCloudinaryAssetService,
    ) {}

    onModuleInit() {
        this.eventBus.ofType(AssetEvent).subscribe(event => {
            if (event.type !== 'deleted') {
                return;
            }
            void this.handleDeleted(event.entity);
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
}
