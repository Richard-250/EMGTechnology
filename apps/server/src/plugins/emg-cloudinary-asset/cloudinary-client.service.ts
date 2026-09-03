import {Logger} from '@vendure/core';
import {Injectable, OnModuleInit} from '@nestjs/common';
import {v2 as cloudinary} from 'cloudinary';
import {lookup as dnsLookup} from 'node:dns/promises';
import {isIP} from 'node:net';
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

const BLOCKED_HOSTNAMES = new Set([
    'localhost',
    'metadata.google.internal',
    'metadata',
]);

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

    /**
     * Validate a remote media URL before asking Cloudinary to fetch it.
     * Blocks non-http(s), credentialed URLs, and common private/SSRF targets.
     */
    async validateRemoteUrl(url: string): Promise<string> {
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

        if (parsed.username || parsed.password) {
            throw new Error('URLs with embedded credentials are not allowed.');
        }

        const hostname = parsed.hostname.toLowerCase();
        if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
            throw new Error('That host cannot be used for media import.');
        }

        if (hostname === '0.0.0.0' || hostname === '::' || hostname === '[::1]' || hostname === '::1') {
            throw new Error('That host cannot be used for media import.');
        }

        const literalIp = isIP(hostname.replace(/^\[|\]$/g, ''));
        if (literalIp && this.isPrivateIp(hostname.replace(/^\[|\]$/g, ''))) {
            throw new Error('Private or local network URLs are not allowed.');
        }

        if (!literalIp) {
            try {
                const records = await dnsLookup(hostname, {all: true});
                for (const record of records) {
                    if (this.isPrivateIp(record.address)) {
                        throw new Error('That URL resolves to a private network address and cannot be imported.');
                    }
                }
            } catch (error) {
                if (error instanceof Error && error.message.includes('private network')) {
                    throw error;
                }
                // DNS failures are left to Cloudinary; we only hard-fail private resolutions.
            }
        }

        const pathname = parsed.pathname.toLowerCase();
        const looksLikeMedia =
            /\.(jpe?g|png|gif|webp|avif|mp4|webm|mov|m4v)(\?|$)/i.test(pathname) ||
            hostname.includes('cloudinary.com') ||
            hostname.includes('googleusercontent.com') ||
            hostname.includes('ggpht.com') ||
            hostname.includes('fbcdn.net') ||
            hostname.includes('cdninstagram.com');

        if (!looksLikeMedia && !pathname.includes('/image') && !pathname.includes('/media')) {
            // Soft guidance only — Cloudinary will still validate content type.
            Logger.warn(`Importing URL without a clear media extension: ${trimmed}`, loggerCtx);
        }

        return trimmed;
    }

    private isPrivateIp(address: string): boolean {
        const ip = address.replace(/^\[|\]$/g, '');
        if (ip === '127.0.0.1' || ip === '::1') return true;
        if (ip.startsWith('10.')) return true;
        if (ip.startsWith('192.168.')) return true;
        if (ip.startsWith('169.254.')) return true;
        if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
        if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) return true;
        return false;
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
            `Unsupported file type "${mimetype}" for "${filename}". Allowed: images (JPEG, PNG, WebP, GIF, AVIF) and videos (MP4, WebM, MOV).`,
        );
    }

    buildDeliveryUrl(
        publicId: string,
        resourceType: string,
        variant: 'source' | 'preview' | 'thumbnail' = 'preview',
    ): string {
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

    async uploadFromBuffer(
        buffer: Buffer,
        filename: string,
        mimetype: string,
        folder: string,
    ): Promise<CloudinaryUploadResult> {
        this.assertConfigured();
        const resourceType = this.validateFileMeta(filename, mimetype, buffer.length);

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

        return this.uploadFromBuffer(Buffer.concat(chunks), file.filename, file.mimetype, folder);
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
