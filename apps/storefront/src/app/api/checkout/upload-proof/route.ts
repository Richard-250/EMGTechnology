import {NextRequest, NextResponse} from 'next/server';

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
 * Fail hard if Shop upload fails — do not invent broken storefront /assets URLs.
 */
async function uploadToVendureAsset(input: {
    fileBase64: string;
    fileName: string;
    mimeType: string;
}): Promise<{url: string; assetId: string} | null> {
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

    const result = json.data?.emgUploadPaymentProof;
    if (!result?.url || !result?.assetId) {
        return null;
    }

    return {url: result.url, assetId: String(result.assetId)};
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
            return NextResponse.json({error: 'No image data provided'}, {status: 400});
        }

        const uploaded = await uploadToVendureAsset({
            fileBase64: dataUrl,
            fileName: body.fileName || 'payment-proof.jpg',
            mimeType: body.mimeType || 'image/jpeg',
        });

        if (!uploaded) {
            return NextResponse.json(
                {
                    error:
                        'Could not save payment proof to the server. Please try again or use a smaller image.',
                },
                {status: 502},
            );
        }

        return NextResponse.json({
            url: uploaded.url,
            assetId: uploaded.assetId,
            provider: 'vendure-asset',
        });
    } catch (err) {
        console.error('Error handling payment proof upload:', err);
        return NextResponse.json(
            {error: 'Failed to process payment proof image'},
            {status: 500},
        );
    }
}
