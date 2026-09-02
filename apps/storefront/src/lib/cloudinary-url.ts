/**
 * Cloudinary responsive delivery helpers for the storefront.
 * Secrets never appear here — only public CDN URLs from Vendure Asset fields.
 */

const CLOUDINARY_HOST = 'res.cloudinary.com';

export function isCloudinaryUrl(url: string | null | undefined): boolean {
    return Boolean(url?.includes(CLOUDINARY_HOST));
}

/** Apply width-based optimization to an existing Cloudinary URL. */
export function cloudinaryResponsiveUrl(url: string, width: number): string {
    if (!isCloudinaryUrl(url)) {
        return url;
    }

    try {
        const parsed = new URL(url);
        const parts = parsed.pathname.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) {
            return url;
        }

        const transform = `w_${width},c_limit,q_auto,f_auto`;
        const next = [...parts.slice(0, uploadIndex + 1), transform, ...parts.slice(uploadIndex + 1)];
        parsed.pathname = next.join('/');
        return parsed.toString();
    } catch {
        return url;
    }
}

export function pickAssetUrl(
    preview: string | null | undefined,
    secureUrl?: string | null,
    width?: number,
): string {
    const base = secureUrl || preview || '';
    if (!base) return '';
    return width ? cloudinaryResponsiveUrl(base, width) : base;
}
