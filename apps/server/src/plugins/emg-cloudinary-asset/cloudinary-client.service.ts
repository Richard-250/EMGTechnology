import {Logger} from '@vendure/core';
import {Injectable, OnModuleInit} from '@nestjs/common';
import {v2 as cloudinary} from 'cloudinary';
import {Readable} from 'stream';

import {
    ALLOWED_IMAGE_MIMES,
    ALLOWED_VIDEO_MIMES,
    CLOUDINARY_FOLDER_PREFIX,
    MAX_IMAGE_BYTES,
    MAX_VIDEO_BYTES,
    MEDIA_FOLDERS,
    type CloudinaryMediaFolderKey,
} from './cloudinary.constants';
import type {CloudinaryUploadResult, GraphqlUploadFile} from './cloudinary-media.types';

const loggerCtx = 'CloudinaryClientService';

@Injectable()
export class CloudinaryClientService implements OnModuleInit {
    private configured = false;

    onModuleInit() {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            Logger.warn(
                'Cloudinary credentials missing — media uploads disabled until CLOUDINARY_* env vars are set.',
                loggerCtx,
            );
            return;
        }

        cloudinary.config({cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true});
        this.configured = true;
        Logger.info(`Cloudinary media storage ready (cloud: ${cloudName})`, loggerCtx);
    }

    isConfigured(): boolean {
        return this.configured;
    }

    assertConfigured(): void {
        if (!this.configured) {
            throw new Error(
                'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET on the server.',
            );
        }
    }

    resolveFolder(folder: CloudinaryMediaFolderKey, productId?: string | number): string {
        const base = `${CLOUDINARY_FOLDER_PREFIX}/${MEDIA_FOLDERS[folder]}`;
        if (folder === 'products' && productId) {
            return `${base}/${productId}`;
        }
        return base;
    }

    validateRemoteUrl(url: string): string {
        const trimmed = url.trim();
        let parsed: URL;
        try {
            parsed = new URL(trimmed);
        } catch {
            throw new Error('Enter a valid media URL (must start with http:// or https://).');
        }
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Only http and https URLs are supported.');
        }
        return trimmed;
    }

    validateFileMeta(filename: string, mimetype: string, bytes: number): 'image' | 'video' {
        const normalizedMime = mimetype.toLowerCase();
        if (ALLOWED_IMAGE_MIMES.has(normalizedMime)) {
            if (bytes > MAX_IMAGE_BYTES) {
                throw new Error(`Image is too large. Maximum size is ${MAX_IMAGE_BYTES / (1024 * 1024)} MB.`);
            }
            return 'image';
        }
        if (ALLOWED_VIDEO_MIMES.has(normalizedMime)) {
            if (bytes > MAX_VIDEO_BYTES) {
                throw new Error(`Video is too large. Maximum size is ${MAX_VIDEO_BYTES / (1024 * 1024)} MB.`);
            }
            return 'video';
        }
        throw new Error(
            `Unsupported file type "${mimetype}" for "${filename}". Allowed: images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, MOV).`,
        );
    }

    buildDeliveryUrl(publicId: string, resourceType: string, variant: 'source' | 'preview' | 'thumbnail' = 'preview'): string {
        if (resourceType === 'video') {
            if (variant === 'thumbnail') {
                return cloudinary.url(publicId, {
                    secure: true,
                    resource_type: 'video',
                    format: 'jpg',
                    transformation: [{width: 800, height: 800, crop: 'limit', quality: 'auto'}],
                });
            }
            return cloudinary.url(publicId, {secure: true, resource_type: 'video'});
        }

        const transforms =
            variant === 'source'
                ? [{quality: 'auto', fetch_format: 'auto'}]
                : [{width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto'}];

        return cloudinary.url(publicId, {secure: true, transformation: transforms});
    }

    buildResponsiveUrl(publicId: string, width: number): string {
        return cloudinary.url(publicId, {
            secure: true,
            transformation: [{width, crop: 'limit', quality: 'auto', fetch_format: 'auto'}],
        });
    }

    async uploadFromUrl(sourceUrl: string, folder: string): Promise<CloudinaryUploadResult> {
        this.assertConfigured();
        const result = await cloudinary.uploader.upload(sourceUrl, {
            folder,
            resource_type: 'auto',
            overwrite: false,
            unique_filename: true,
        });
        return result as CloudinaryUploadResult;
    }

    async uploadFromFile(file: GraphqlUploadFile, folder: string): Promise<CloudinaryUploadResult> {
        this.assertConfigured();
        const stream = file.createReadStream();
        const chunks: Buffer[] = [];
        let totalBytes = 0;

        for await (const chunk of stream) {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            totalBytes += buffer.length;
            chunks.push(buffer);
        }

        const resourceType = this.validateFileMeta(file.filename, file.mimetype, totalBytes);
        const buffer = Buffer.concat(chunks);

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: resourceType,
                    overwrite: false,
                    unique_filename: true,
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    if (!result) {
                        reject(new Error('Cloudinary upload returned no result.'));
                        return;
                    }
                    resolve(result as CloudinaryUploadResult);
                },
            );
            Readable.from(buffer).pipe(uploadStream);
        });
    }

    async destroy(publicId: string, resourceType: string): Promise<void> {
        this.assertConfigured();
        try {
            await cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType === 'video' ? 'video' : 'image',
                invalidate: true,
            });
            Logger.info(`Deleted Cloudinary asset: ${publicId}`, loggerCtx);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            Logger.error(`Failed to delete Cloudinary asset ${publicId}: ${message}`, loggerCtx);
        }
    }
}
