import type {ProductDiscountFields, DiscountType} from '@/lib/discount-display';

export interface VariantDiscountFields {
    variantDiscountPercentage?: number | null;
    variantDiscountAmount?: number | null;
    variantOriginalPrice?: number | null;
}

/** Merge product-level and variant-level discount fields (variant wins when set). */
export function mergeDiscountFields(
    productCf?: ProductDiscountFields | null,
    variantCf?: VariantDiscountFields | null,
): ProductDiscountFields {
    const hasVariantPct =
        variantCf?.variantDiscountPercentage != null && variantCf.variantDiscountPercentage > 0;
    const hasVariantAmt =
        variantCf?.variantDiscountAmount != null && variantCf.variantDiscountAmount > 0;

    let discountType: DiscountType | string | null | undefined = productCf?.discountType ?? 'percentage';
    if (hasVariantAmt && !hasVariantPct) {
        discountType = 'fixed';
    } else if (hasVariantPct) {
        discountType = 'percentage';
    }

    return {
        isDiscounted: productCf?.isDiscounted === true,
        discountType,
        discountPercentage: hasVariantPct
            ? variantCf!.variantDiscountPercentage
            : (productCf?.discountPercentage ?? null),
        discountAmount: hasVariantAmt
            ? variantCf!.variantDiscountAmount
            : (productCf?.discountAmount ?? null),
        originalPrice:
            variantCf?.variantOriginalPrice != null && variantCf.variantOriginalPrice > 0
                ? variantCf.variantOriginalPrice
                : (productCf?.originalPrice ?? null),
    };
}
