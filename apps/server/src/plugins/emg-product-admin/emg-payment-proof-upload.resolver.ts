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
        let url = asset.preview || asset.source || '';

        // If the preview is a relative path (e.g. "preview/xx/img.jpg"), ensure absolute URL
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            const base =
                process.env.ASSET_URL_PREFIX ||
                (process.env.STOREFRONT_URL
                    ? `${process.env.STOREFRONT_URL.replace(/\/$/, '')}/assets/`
                    : 'https://emgtechnologyltd.com/assets/');
            url = `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
        }

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
