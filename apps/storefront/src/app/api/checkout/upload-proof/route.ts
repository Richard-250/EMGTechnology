import {NextRequest, NextResponse} from 'next/server';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const EMG_UPLOAD_PAYMENT_PROOF = `
    mutation EmgUploadPaymentProof($fileBase64: String!, $fileName: String!, $mimeType: String!) {
        emgUploadPaymentProof(fileBase64: $fileBase64, fileName: $fileName, mimeType: $mimeType) {
            url
            assetId
        }
    }
`;

/**
 * Upload to Vendure's native Asset storage via the Shop API.
 * Uses Vendure's AssetService (exact same way product & admin assets are saved).
 */
async function uploadToVendureAsset(input: {
    fileBase64: string;
    fileName: string;
    mimeType: string;
}): Promise<string | null> {
    const rawApiUrl =
        process.env.VENDURE_SHOP_API_URL ||
        process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL ||
        'http://127.0.0.1:3001/shop-api';
    const apiUrl = rawApiUrl.startsWith('http')
        ? rawApiUrl
        : `http://127.0.0.1:3001${rawApiUrl.startsWith('/') ? '' : '/'}${rawApiUrl}`;

    const channelToken =
        process.env.VENDURE_CHANNEL_TOKEN ||
        process.env.NEXT_PUBLIC_VENDURE_CHANNEL_TOKEN ||
        '__default_channel__';
    const channelHeader = process.env.VENDURE_CHANNEL_TOKEN_HEADER || 'vendure-token';

    const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            [channelHeader]: channelToken,
        },
        body: JSON.stringify({
            query: EMG_UPLOAD_PAYMENT_PROOF,
            variables: {
                fileBase64: input.fileBase64,
                fileName: input.fileName,
                mimeType: input.mimeType,
            },
        }),
        cache: 'no-store',
    });

    if (!res.ok) {
        const errText = await res.text();
        console.warn('Vendure asset upload returned non-ok:', res.status, errText);
        return null;
    }

    const json = (await res.json()) as {
        data?: {
            emgUploadPaymentProof?: {
                url?: string;
                assetId?: string;
            };
        };
        errors?: Array<{message: string}>;
    };

    if (json.errors?.length) {
        console.warn('Vendure asset upload GraphQL errors:', json.errors);
        return null;
    }

    return json.data?.emgUploadPaymentProof?.url || null;
}

/**
 * Fallback: write directly to Vendure static assets folder or storefront public folder
 */
async function saveToLocalAssetDisk(
    dataUrl: string,
    req: NextRequest,
): Promise<string | null> {
    try {
        const base64Data = dataUrl.includes(',') ? dataUrl.split(',').pop() || '' : dataUrl;
        const buffer = Buffer.from(base64Data, 'base64');
        if (!buffer.length) return null;

        const ext = dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
        const fileName = `proof-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;

        // Try writing directly to Vendure's static assets source directory if available
        const vendureAssetDir = path.resolve(process.cwd(), '../server/static/assets/source');
        let written = false;

        try {
            await fs.mkdir(vendureAssetDir, {recursive: true});
            await fs.writeFile(path.join(vendureAssetDir, fileName), buffer);
            written = true;
        } catch {
            // If server directory is not accessible from storefront process, write to storefront public
            const fallbackDir = path.join(process.cwd(), 'public', 'uploads', 'payment-proofs');
            await fs.mkdir(fallbackDir, {recursive: true});
            await fs.writeFile(path.join(fallbackDir, fileName), buffer);
        }

        const siteUrl =
            process.env.NEXT_PUBLIC_SITE_URL ||
            req.nextUrl.origin ||
            'https://emgtechnologyltd.com';

        if (written) {
            return `${siteUrl.replace(/\/$/, '')}/assets/source/${fileName}`;
        }
        return `${siteUrl.replace(/\/$/, '')}/uploads/payment-proofs/${fileName}`;
    } catch (err) {
        console.warn('Could not save payment proof to local disk:', err);
        return null;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as {
            fileBase64?: string;
            fileName?: string;
            mimeType?: string;
        };

        const dataUrl = body.fileBase64?.trim();
        if (!dataUrl) {
            return NextResponse.json(
                {error: 'No image data provided'},
                {status: 400},
            );
        }

        const fileName = body.fileName || 'payment-proof.jpg';
        const mimeType = body.mimeType || 'image/jpeg';

        // 1. Upload to Vendure native Asset storage (exact same as product images)
        try {
            const assetUrl = await uploadToVendureAsset({
                fileBase64: dataUrl,
                fileName,
                mimeType,
            });
            if (assetUrl) {
                return NextResponse.json({url: assetUrl, provider: 'vendure-asset'});
            }
        } catch (err) {
            console.warn('Vendure asset upload exception:', err);
        }

        // 2. Fallback: Save directly to asset storage directory
        const localUrl = await saveToLocalAssetDisk(dataUrl, req);
        if (localUrl) {
            return NextResponse.json({url: localUrl, provider: 'local-asset'});
        }

        return NextResponse.json(
            {error: 'Could not save payment proof image'},
            {status: 500},
        );
    } catch (err) {
        console.error('Error handling payment proof upload:', err);
        return NextResponse.json(
            {error: 'Failed to process payment proof image'},
            {status: 500},
        );
    }
}
