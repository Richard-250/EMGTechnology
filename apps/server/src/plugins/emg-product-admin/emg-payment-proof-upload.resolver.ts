import {Args, Mutation, Resolver} from '@nestjs/graphql';
import {
    Allow,
    AssetService,
    Ctx,
    Logger,
    Permission,
    RequestContext,
    UserInputError,
} from '@vendure/core';
import {Readable} from 'stream';

const loggerCtx = 'EmgPaymentProofUpload';

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
]);

const MAX_PROOF_BYTES = 15 * 1024 * 1024; // 15MB

function bufferToStream(buffer: Buffer): Readable {
    let sent = false;
    return new Readable({
        read() {
            if (!sent) {
                this.push(buffer);
                this.push(null);
                sent = true;
            }
        },
    });
}

/**
 * Absolute base URL for AssetServerPlugin (`/assets/...`).
 * Must point at the Vendure API host that serves assets — NOT the Next.js storefront
 * when they run on different ports (e.g. API :3001 vs storefront :3002).
 */
function resolveAssetBaseUrl(): string {
    const fromEnv = process.env.ASSET_URL_PREFIX?.trim();
    if (fromEnv) {
        return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`;
    }

    const isDev =
        process.env.APP_ENV === 'dev' ||
        process.env.NODE_ENV === 'development' ||
        !process.env.NODE_ENV;

    if (isDev) {
        const port = process.env.PORT || '3001';
        return `http://localhost:${port}/assets/`;
    }

    // Production: same public origin usually reverse-proxies /assets → Vendure
    const storefront = process.env.STOREFRONT_URL?.replace(/\/$/, '');
    if (storefront) {
        return `${storefront}/assets/`;
    }

    return 'https://emgtechnologyltd.com/assets/';
}

function toAbsoluteAssetUrl(relativeOrAbsolute: string): string {
    const trimmed = relativeOrAbsolute.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    const base = resolveAssetBaseUrl();
    const path = trimmed.replace(/^\//, '');
    // Avoid /assets/assets/... if path already includes assets/
    if (path.startsWith('assets/')) {
        const origin = base.replace(/\/assets\/?$/, '');
        return `${origin}/${path}`;
    }
    return `${base.replace(/\/$/, '')}/${path}`;
}

@Resolver()
export class EmgPaymentProofUploadResolver {
    constructor(private assetService: AssetService) {}

    @Mutation()
    @Allow(Permission.Public)
    async emgUploadPaymentProof(
        @Ctx() ctx: RequestContext,
        @Args()
        args: {
            fileBase64: string;
            fileName: string;
            mimeType: string;
        },
    ): Promise<{url: string; assetId: string}> {
        const mimeType = (args.mimeType || 'image/jpeg').toLowerCase().trim();
        if (!ALLOWED_MIME_TYPES.has(mimeType)) {
            throw new UserInputError('Payment proof must be an image (JPEG, PNG, WebP, or GIF).');
        }

        const raw = args.fileBase64.includes(',')
            ? args.fileBase64.split(',').pop() || ''
            : args.fileBase64;

        let buffer: Buffer;
        try {
            buffer = Buffer.from(raw, 'base64');
        } catch {
            throw new UserInputError('Invalid payment proof image data.');
        }

        if (!buffer.length) {
            throw new UserInputError('Payment proof image is empty.');
        }

        if (buffer.length > MAX_PROOF_BYTES) {
            throw new UserInputError(
                `Payment proof is too large. Maximum size is ${MAX_PROOF_BYTES / (1024 * 1024)} MB.`,
            );
        }

        const safeFileName = (args.fileName || 'payment-proof.jpg')
            .replace(/[^\w.\-]+/g, '_')
            .slice(0, 100);

        const assetResult = await this.assetService.create(ctx, {
            file: {
                createReadStream: () => bufferToStream(buffer),
                filename: safeFileName,
                mimetype: mimeType,
            },
            tags: ['payment-proof'],
        });

        if ('errorCode' in assetResult) {
            throw new UserInputError(
                (assetResult as {message?: string}).message || 'Could not process image as an asset.',
            );
        }

        const asset = assetResult;
        const relative = asset.preview || asset.source || '';
        const url = toAbsoluteAssetUrl(relative);

        Logger.info(
            `Payment proof saved as Vendure Asset #${asset.id} (${safeFileName}, ${buffer.length} bytes) → ${url}`,
            loggerCtx,
        );

        return {
            url,
            assetId: String(asset.id),
        };
    }
}
