'use server';

const UPLOAD_PAYMENT_PROOF = `
    mutation UploadPaymentProof($fileBase64: String!, $fileName: String!, $mimeType: String!) {
        uploadPaymentProof(fileBase64: $fileBase64, fileName: $fileName, mimeType: $mimeType) {
            url
        }
    }
`;

/**
 * Upload a MoMo/Airtel payment screenshot via the Vendure shop API (Cloudinary).
 */
export async function uploadPaymentProofAction(input: {
    fileBase64: string;
    fileName: string;
    mimeType: string;
}): Promise<{url: string}> {
    const apiUrl =
        process.env.VENDURE_SHOP_API_URL ||
        process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL ||
        'http://127.0.0.1:3001/shop-api';
    const channelToken =
        process.env.VENDURE_CHANNEL_TOKEN ||
        process.env.NEXT_PUBLIC_VENDURE_CHANNEL_TOKEN ||
        '__default_channel__';
    const channelHeader = process.env.VENDURE_CHANNEL_TOKEN_HEADER || 'vendure-token';

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            [channelHeader]: channelToken,
        },
        body: JSON.stringify({
            query: UPLOAD_PAYMENT_PROOF,
            variables: {
                fileBase64: input.fileBase64,
                fileName: input.fileName,
                mimeType: input.mimeType,
            },
        }),
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(`Upload failed (HTTP ${response.status})`);
    }

    const json = (await response.json()) as {
        data?: {uploadPaymentProof?: {url?: string}};
        errors?: Array<{message: string}>;
    };

    if (json.errors?.length) {
        throw new Error(json.errors.map(e => e.message).join(', '));
    }

    const url = json.data?.uploadPaymentProof?.url;
    if (!url) {
        throw new Error('Upload failed — no image URL returned');
    }

    return {url};
}
