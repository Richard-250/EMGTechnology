/**
 * Upload a customer MoMo/Airtel payment screenshot into Vendure's native Asset storage.
 * Calls Next.js API route /api/checkout/upload-proof which creates a real Vendure Asset
 * with preview/source URLs (same as product assets).
 */
export async function uploadPaymentProof(input: {
    fileBase64: string;
    fileName: string;
    mimeType: string;
}): Promise<{url: string}> {
    const response = await fetch('/api/checkout/upload-proof', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        const errJson = (await response.json().catch(() => ({}))) as {error?: string};
        throw new Error(errJson.error || 'Failed to save payment screenshot');
    }

    const data = (await response.json()) as {url?: string; error?: string};
    if (!data.url) {
        throw new Error(data.error || 'No asset URL returned');
    }

    return {url: data.url};
}

// Backwards-compatible alias
export const uploadPaymentProofAction = uploadPaymentProof;
