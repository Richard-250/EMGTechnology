import {Args, Mutation, Resolver} from '@nestjs/graphql';
import {Allow, Ctx, Logger, Permission, RequestContext, UserInputError} from '@vendure/core';

import {CloudinaryClientService} from './cloudinary-client.service';
import {ALLOWED_IMAGE_MIMES, CLOUDINARY_FOLDER_PREFIX, MAX_PAYMENT_PROOF_BYTES, MEDIA_FOLDERS} from './cloudinary.constants';

const loggerCtx = 'PaymentProofUpload';

@Resolver()
export class PaymentProofUploadResolver {
    constructor(private cloudinaryClient: CloudinaryClientService) {}

    @Mutation()
    @Allow(Permission.Public)
    async uploadPaymentProof(
        @Ctx() _ctx: RequestContext,
        @Args()
        args: {
            fileBase64: string;
            fileName: string;
            mimeType: string;
        },
    ): Promise<{url: string}> {
        this.cloudinaryClient.assertConfigured();

        const mimeType = (args.mimeType || '').toLowerCase().trim();
        if (!ALLOWED_IMAGE_MIMES.has(mimeType)) {
            throw new UserInputError('Payment proof must be an image (JPEG, PNG, WebP, or GIF).');
        }

        const fileName = (args.fileName || 'payment-proof.jpg').replace(/[^\w.\-]+/g, '_').slice(0, 120);
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
        if (buffer.length > MAX_PAYMENT_PROOF_BYTES) {
            throw new UserInputError(
                `Payment proof is too large. Maximum size is ${MAX_PAYMENT_PROOF_BYTES / (1024 * 1024)} MB.`,
            );
        }

        const folder = `${CLOUDINARY_FOLDER_PREFIX}/${MEDIA_FOLDERS.paymentProofs}`;
        const upload = await this.cloudinaryClient.uploadFromBuffer(buffer, fileName, mimeType, folder);
        const url = upload.secure_url || upload.url;
        if (!url) {
            throw new UserInputError('Could not upload payment proof. Please try again.');
        }

        Logger.info(`Payment proof uploaded (${fileName}, ${buffer.length} bytes)`, loggerCtx);
        return {url};
    }
}
