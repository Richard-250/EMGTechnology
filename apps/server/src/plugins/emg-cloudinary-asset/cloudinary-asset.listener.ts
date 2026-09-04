import {Injectable, OnModuleInit} from '@nestjs/common';
import {Asset, EventBus, Logger, RequestContext, TransactionalConnection} from '@vendure/core';
import {AssetEvent} from '@vendure/core/dist/event-bus/events/asset-event';

import type {CloudinaryMediaMetadata} from './cloudinary-media.types';

const loggerCtx = 'CloudinaryAssetListener';

/**
 * After native uploads, Asset.source/preview already hold Cloudinary CDN URLs
 * (via CloudinaryAssetStorageStrategy). This listener only fills Asset custom fields
 * for admin visibility — it does not re-upload or change the user flow.
 */
@Injectable()
export class CloudinaryAssetListener implements OnModuleInit {
    constructor(
        private eventBus: EventBus,
        private connection: TransactionalConnection,
    ) {}

    onModuleInit() {
        this.eventBus.ofType(AssetEvent).subscribe(event => {
            if (event.type === 'created') {
                void this.enrichMetadata(event.ctx, event.entity);
            }
        });
    }

    private async enrichMetadata(ctx: RequestContext, asset: Asset) {
        const fields = asset.customFields as CloudinaryMediaMetadata | undefined;
        if (fields?.cloudinaryPublicId) {
            return;
        }

        const source = asset.source?.trim();
        if (!source || !source.includes('res.cloudinary.com')) {
            return;
        }

        const parsed = parseCloudinaryUrl(source);
        if (!parsed) {
            return;
        }

        try {
            asset.customFields = {
                ...(asset.customFields as object),
                cloudinaryPublicId: parsed.publicId,
                cloudinarySecureUrl: source,
                cloudinaryResourceType: parsed.resourceType,
                cloudinaryFormat: parsed.format ?? asset.mimeType?.split('/')[1] ?? '',
                cloudinaryFolder: parsed.folder,
                cloudinaryDuration: null,
                sourceImageUrl: null,
            };
            await this.connection.getRepository(ctx, Asset).save(asset);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            Logger.warn(`Could not enrich Cloudinary metadata for Asset ${asset.id}: ${message}`, loggerCtx);
        }
    }
}

function parseCloudinaryUrl(url: string): {
    publicId: string;
    resourceType: string;
    folder: string;
    format?: string;
} | null {
    try {
        const parsed = new URL(url);
        const segments = parsed.pathname.split('/').filter(Boolean);
        const resourceType = segments[1] || 'image';
        const uploadIdx = segments.indexOf('upload');
        if (uploadIdx < 0) {
            return null;
        }

        let rest = segments.slice(uploadIdx + 1);
        while (rest.length > 0) {
            const part = rest[0];
            if (/^v\d+$/.test(part)) {
                rest = rest.slice(1);
                break;
            }
            if (part.includes('_') || part.includes(',')) {
                rest = rest.slice(1);
                continue;
            }
            break;
        }
        if (rest.length > 0 && /^v\d+$/.test(rest[0])) {
            rest = rest.slice(1);
        }
        if (!rest.length) {
            return null;
        }

        const last = rest[rest.length - 1];
        const formatMatch = last.match(/\.([a-z0-9]+)$/i);
        const format = formatMatch?.[1];
        const publicId = rest.join('/').replace(/\.[a-z0-9]+$/i, '');
        const folder = publicId.includes('/') ? publicId.slice(0, publicId.lastIndexOf('/')) : '';
        return {publicId, resourceType, folder, format};
    } catch {
        return null;
    }
}
