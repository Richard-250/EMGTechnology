/**
 * Upload a customer MoMo/Airtel payment screenshot.
 * Calls the Next.js API route /api/checkout/upload-proof (direct Cloudinary/local upload).
 * If the server is offline or upload fails, gracefully falls back to the compressed
 * data URL so the customer can ALWAYS place their order without error.
 */
export async function uploadPaymentProof(input: {
    fileBase64: string;
    fileName: string;
    mimeType: string;
}): Promise<{url: string}> {
    try {
        const response = await fetch('/api/checkout/upload-proof', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(input),
        });

        if (response.ok) {
            const data = (await response.json()) as {url?: string; error?: string};
            if (data.url) {
                return {url: data.url};
            }
        }
        console.warn('Upload API responded with non-ok status, falling back to data URL');
    } catch (err) {
        console.warn('Network issue during proof upload, falling back to data URL:', err);
    }

    // Bulletproof fallback: use the base64 data URL directly
    return {url: input.fileBase64};
}

// Backwards-compatible alias
export const uploadPaymentProofAction = uploadPaymentProof;
