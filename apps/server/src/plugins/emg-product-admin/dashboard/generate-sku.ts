export function slugifyForSku(value: string): string {
    return value
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .toUpperCase();
}

export function generateProductSku(params: {
    productName?: string;
    productSlug?: string;
    variantName?: string;
    optionCodes?: string[];
    variantId?: string | number;
}): string {
    const productPart = slugifyForSku(params.productSlug || params.productName || 'PRODUCT').slice(0, 12);
    const variantLabel = (params.variantName || '').trim();
    const productLabel = (params.productName || '').trim();

    let variantPart = '';
    if (params.optionCodes?.length) {
        variantPart = params.optionCodes.map(code => slugifyForSku(code).slice(0, 4)).join('');
    } else if (variantLabel && productLabel && variantLabel.startsWith(productLabel)) {
        variantPart = slugifyForSku(variantLabel.slice(productLabel.length)).slice(0, 8);
    } else {
        variantPart = slugifyForSku(variantLabel || 'DEFAULT').slice(0, 8);
    }

    if (!variantPart) {
        variantPart = 'STD';
    }

    const suffix = params.variantId
        ? String(params.variantId).slice(-4)
        : String(Date.now()).slice(-4);

    return `EMG-${productPart}-${variantPart}-${suffix}`.replace(/--+/g, '-');
}
