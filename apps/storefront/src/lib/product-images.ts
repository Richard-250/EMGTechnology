import {getStoreProductImage} from '@/lib/store-images';

function normalizeAssetUrl(url: string): string {
    return url.replace(/\\/g, '/');
}

/** Generic seed PNGs from initial import — not real product photos. */
const SEED_PLACEHOLDER_ASSET =
    /\/(elliptical|recumbent|upright|indoor-cycle|rower|power-rack|dumbbells|barbell|kettlebell|functional|home-gym|yoga-mat|bands|ab-roller|jump-rope)__preview\./i;

export function isSeedPlaceholderAsset(url: string | null | undefined): boolean {
    if (!url) return false;
    return SEED_PLACEHOLDER_ASSET.test(normalizeAssetUrl(url));
}

/** Prefer high-quality local store images; support real Vendure uploads; fallback safely. */
export function resolveProductImage(
    vendurePreview: string | null | undefined,
    slug: string,
): string {
    const storeImage = getStoreProductImage(slug);
    // If we have a dedicated product photo in /public/images/products, use it directly for instant 0ms load
    if (storeImage && storeImage !== STORE_IMAGES.hero) {
        return storeImage;
    }
    if (vendurePreview && !isSeedPlaceholderAsset(vendurePreview)) {
        return normalizeAssetUrl(vendurePreview);
    }
    return storeImage || STORE_IMAGES.hero;
}

export type ProductCarouselImage = {
    id: string;
    preview: string;
    source: string;
};

export function resolveProductCarouselImages(
    assets: Array<{id: string; preview: string; source: string}> | null | undefined,
    slug: string,
): ProductCarouselImage[] {
    const storeImage = getStoreProductImage(slug);
    const storeImageAvailable = storeImage && storeImage !== STORE_IMAGES.hero;

    const realAssets =
        assets?.filter(asset => !isSeedPlaceholderAsset(asset.preview)) ?? [];

    if (realAssets.length) {
        return realAssets.map(asset => ({
            id: asset.id,
            preview: normalizeAssetUrl(asset.preview),
            source: normalizeAssetUrl(asset.source),
        }));
    }

    if (storeImageAvailable) {
        return [{id: slug, preview: storeImage, source: storeImage}];
    }

    const fallback = getStoreProductImage(slug);
    return [{id: 'fallback', preview: fallback, source: fallback}];
}
