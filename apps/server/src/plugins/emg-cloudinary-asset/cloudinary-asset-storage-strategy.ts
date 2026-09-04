import {
    defaultAssetStorageStrategyFactory,
    type AssetServerOptions,
} from '@vendure/asset-server-plugin';
import {AssetStorageStrategy, Logger} from '@vendure/core';
import {v2 as cloudinary} from 'cloudinary';
import {Readable, Stream} from 'stream';

import {CLOUDINARY_FOLDER_PREFIX, MEDIA_FOLDERS} from './cloudinary.constants';

const loggerCtx = 'CloudinaryAssetStorageStrategy';

/**
 * Vendure AssetStorageStrategy that uploads binaries to Cloudinary and stores
 * the resulting secure CDN URL as the Asset source/preview identifier in the DB.
 * The admin upload UX is unchanged — only where files are persisted changes.
 */
export class CloudinaryAssetStorageStrategy implements AssetStorageStrategy {
    readonly toAbsoluteUrl: NonNullable<AssetStorageStrategy['toAbsoluteUrl']>;

    constructor(
        private readonly folder: string,
        private readonly fallback: AssetStorageStrategy,
    ) {
        this.toAbsoluteUrl = (request, identifier) => {
            if (!identifier) {
                return '';
            }
            if (identifier.startsWith('http://') || identifier.startsWith('https://')) {
                return identifier;
            }
            return this.fallback.toAbsoluteUrl?.(request, identifier) ?? identifier;
        };
    }

    async init(...args: Parameters<NonNullable<AssetStorageStrategy['init']>>) {
        await this.fallback.init?.(...args);
    }

    async writeFileFromBuffer(fileName: string, data: Buffer): Promise<string> {
        return this.uploadBuffer(fileName, data);
    }

    async writeFileFromStream(fileName: string, data: Stream): Promise<string> {
        const buffer = await streamToBuffer(data);
        return this.uploadBuffer(fileName, buffer);
    }

    async readFileToBuffer(identifier: string): Promise<Buffer> {
        if (isHttpUrl(identifier)) {
            const response = await fetch(identifier);
            if (!response.ok) {
                throw new Error(`Failed to read Cloudinary asset (${response.status}): ${identifier}`);
            }
            return Buffer.from(await response.arrayBuffer());
        }
        return this.fallback.readFileToBuffer(identifier);
    }

    async readFileToStream(identifier: string): Promise<Stream> {
        const buffer = await this.readFileToBuffer(identifier);
        return Readable.from(buffer);
    }

    async deleteFile(identifier: string): Promise<void> {
        if (isHttpUrl(identifier) && identifier.includes('res.cloudinary.com')) {
            const parsed = extractCloudinaryPublicId(identifier);
            if (!parsed) {
                Logger.warn(`Could not parse Cloudinary public_id from ${identifier}`, loggerCtx);
                return;
            }
            try {
                await cloudinary.uploader.destroy(parsed.publicId, {
                    resource_type: parsed.resourceType,
                    invalidate: true,
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                Logger.error(`Failed to delete Cloudinary file ${parsed.publicId}: ${message}`, loggerCtx);
            }
            return;
        }
        await this.fallback.deleteFile(identifier);
    }

    async fileExists(fileName: string): Promise<boolean> {
        const publicId = this.toPublicId(fileName);
        try {
            await cloudinary.api.resource(publicId, {resource_type: 'image'});
            return true;
        } catch {
            try {
                await cloudinary.api.resource(publicId, {resource_type: 'video'});
                return true;
            } catch {
                return false;
            }
        }
    }

    private toPublicId(fileName: string): string {
        const normalized = fileName.replace(/\\/g, '/').replace(/^\/+/, '');
        const withoutExt = normalized.replace(/\.[^.]+$/, '');
        return `${this.folder}/${withoutExt}`;
    }

    private async uploadBuffer(fileName: string, data: Buffer): Promise<string> {
        const publicId = this.toPublicId(fileName);
        const resourceType = guessResourceType(fileName);

        const result = await new Promise<{public_id: string; secure_url?: string; url?: string}>(
            (resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        public_id: publicId,
                        resource_type: resourceType,
                        overwrite: false,
                        unique_filename: false,
                    },
                    (error, uploadResult) => {
                        if (error) {
                            reject(error);
                            return;
                        }
                        if (!uploadResult) {
                            reject(new Error('Cloudinary upload returned no result.'));
                            return;
                        }
                        resolve(uploadResult);
                    },
                );
                Readable.from(data).pipe(uploadStream);
            },
        );

        const url = result.secure_url || result.url;
        if (!url) {
            throw new Error(`Cloudinary upload for "${fileName}" did not return a URL.`);
        }

        Logger.debug(`Stored asset on Cloudinary: ${result.public_id}`, loggerCtx);
        // DB identifier = CDN URL (binary stays on Cloudinary, not on this server).
        return url;
    }
}

/**
 * Use Cloudinary when credentials exist; otherwise keep Vendure's local disk strategy.
 */
export function configureCloudinaryAssetStorage(): (
    options: AssetServerOptions,
) => AssetStorageStrategy | Promise<AssetStorageStrategy> {
    return options => {
        const fallback = defaultAssetStorageStrategyFactory(options);
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
        const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
        const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

        if (!cloudName || !apiKey || !apiSecret) {
            Logger.warn(
                'CLOUDINARY_* env vars missing — assets will be stored on local disk.',
                loggerCtx,
            );
            return fallback;
        }

        cloudinary.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
            secure: true,
        });

        const folder =
            process.env.CLOUDINARY_FOLDER?.trim() ||
            `${CLOUDINARY_FOLDER_PREFIX}/${MEDIA_FOLDERS.products}`;

        Logger.info(`Asset storage → Cloudinary (folder: ${folder})`, loggerCtx);
        return new CloudinaryAssetStorageStrategy(folder, fallback);
    };
}

function isHttpUrl(value: string): boolean {
    return value.startsWith('http://') || value.startsWith('https://');
}

function guessResourceType(fileName: string): 'image' | 'video' | 'raw' {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    if (['mp4', 'webm', 'mov', 'm4v', 'avi'].includes(ext)) {
        return 'video';
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp', 'tiff'].includes(ext)) {
        return 'image';
    }
    return 'raw';
}

function extractCloudinaryPublicId(
    url: string,
): {publicId: string; resourceType: 'image' | 'video' | 'raw'} | null {
    try {
        const parsed = new URL(url);
        const segments = parsed.pathname.split('/').filter(Boolean);
        // /{cloud}/{resourceType}/upload/...
        const resourceTypeRaw = segments[1];
        const resourceType =
            resourceTypeRaw === 'video' || resourceTypeRaw === 'raw' ? resourceTypeRaw : 'image';
        const uploadIdx = segments.indexOf('upload');
        if (uploadIdx < 0) {
            return null;
        }

        let rest = segments.slice(uploadIdx + 1);
        // Drop transformation segments and version prefix (v123456).
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

        const publicId = rest.join('/').replace(/\.[a-z0-9]+$/i, '');
        return {publicId, resourceType};
    } catch {
        return null;
    }
}

async function streamToBuffer(data: Stream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
        data.on('data', (chunk: Buffer | string) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        data.on('end', () => resolve());
        data.on('error', reject);
    });
    return Buffer.concat(chunks);
}
