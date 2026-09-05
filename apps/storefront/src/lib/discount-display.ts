import type {SerializedProductCard} from '@/lib/product-price';

export type DiscountType = 'percentage' | 'fixed';

export interface ProductDiscountFields {
    isDiscounted?: boolean | null;
    discountType?: DiscountType | string | null;
    discountPercentage?: number | null;
    discountAmount?: number | null;
    originalPrice?: number | null;
}

export interface DealProductCardData extends SerializedProductCard {
    customFields?: ProductDiscountFields;
    collectionSlug?: string;
}

/** True when admin configured a discount amount/percentage/original price. */
export function hasConfiguredDiscount(cf?: ProductDiscountFields | null): boolean {
    if (!cf) return false;
    if (cf.discountPercentage != null && cf.discountPercentage > 0) return true;
    if (cf.discountAmount != null && cf.discountAmount > 0) return true;
    if (cf.originalPrice != null && cf.originalPrice > 0) return true;
    return false;
}

/**
 * Resolve was/now pricing from admin custom fields.
 * Super Deal toggle (`isDiscounted`) is NOT required — any configured discount shows.
 * Use `isDiscounted` separately for Super Deal badges / deals listing.
 */
export function resolveDealDiscount(product: {
    price?: number | null;
    customFields?: ProductDiscountFields | null;
}): {
    discountLabel: string;
    wasPrice: number | null;
    hasDiscount: boolean;
    isSuperDeal: boolean;
} {
    const cf = product.customFields;
    const currentPrice = product.price;
    const isSuperDeal = cf?.isDiscounted === true;

    if (currentPrice == null || !hasConfiguredDiscount(cf)) {
        return {discountLabel: '', wasPrice: null, hasDiscount: false, isSuperDeal};
    }

    const type = cf!.discountType === 'fixed' ? 'fixed' : 'percentage';

    if (type === 'fixed' && cf!.discountAmount && cf!.discountAmount > 0) {
        const wasPrice = cf!.originalPrice
            ? cf!.originalPrice * 100
            : currentPrice + cf!.discountAmount * 100;
        return {
            discountLabel: `-${cf!.discountAmount.toLocaleString()}`,
            wasPrice,
            hasDiscount: wasPrice > currentPrice,
            isSuperDeal,
        };
    }

    if (cf!.discountPercentage && cf!.discountPercentage > 0) {
        const wasPrice = cf!.originalPrice
            ? cf!.originalPrice * 100
            : Math.round(currentPrice / (1 - cf!.discountPercentage / 100));
        return {
            discountLabel: `-${cf!.discountPercentage}%`,
            wasPrice,
            hasDiscount: wasPrice > currentPrice,
            isSuperDeal,
        };
    }

    if (cf!.originalPrice && cf!.originalPrice > 0) {
        const wasPrice = cf!.originalPrice * 100;
        if (wasPrice <= currentPrice) {
            return {discountLabel: '', wasPrice: null, hasDiscount: false, isSuperDeal};
        }
        const pct = Math.round((1 - currentPrice / wasPrice) * 100);
        return {
            discountLabel: pct > 0 ? `-${pct}%` : '',
            wasPrice,
            hasDiscount: true,
            isSuperDeal,
        };
    }

    return {discountLabel: '', wasPrice: null, hasDiscount: false, isSuperDeal};
}
