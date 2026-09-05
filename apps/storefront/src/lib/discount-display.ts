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
 *
 * Modes:
 * 1) originalPrice stored and higher than current → current is the sale price (admin lowered it)
 * 2) percentage/fixed with no usable original → treat current price as list price and compute sale
 *
 * Super Deal toggle (`isDiscounted`) controls Super Deal badges / deals listing only.
 */
export function resolveDealDiscount(product: {
    price?: number | null;
    customFields?: ProductDiscountFields | null;
}): {
    discountLabel: string;
    wasPrice: number | null;
    /** When set, show this as the “now” price instead of the raw catalog price. */
    salePrice: number | null;
    hasDiscount: boolean;
    isSuperDeal: boolean;
} {
    const cf = product.customFields;
    const currentPrice = product.price;
    const isSuperDeal = cf?.isDiscounted === true;

    if (currentPrice == null || !hasConfiguredDiscount(cf)) {
        return {
            discountLabel: '',
            wasPrice: null,
            salePrice: null,
            hasDiscount: false,
            isSuperDeal,
        };
    }

    const type = cf!.discountType === 'fixed' ? 'fixed' : 'percentage';
    const storedOriginalMinor =
        cf!.originalPrice && cf!.originalPrice > 0 ? cf!.originalPrice * 100 : null;

    // Admin already lowered the selling price and stored the old list price
    if (storedOriginalMinor != null && storedOriginalMinor > currentPrice) {
        const pct = Math.round((1 - currentPrice / storedOriginalMinor) * 100);
        return {
            discountLabel:
                type === 'fixed' && cf!.discountAmount
                    ? `-${cf!.discountAmount.toLocaleString()}`
                    : cf!.discountPercentage
                      ? `-${cf!.discountPercentage}%`
                      : pct > 0
                        ? `-${pct}%`
                        : '',
            wasPrice: storedOriginalMinor,
            salePrice: null,
            hasDiscount: true,
            isSuperDeal,
        };
    }

    // Current catalog price is the list price — compute sale from % or fixed amount
    if (type === 'fixed' && cf!.discountAmount && cf!.discountAmount > 0) {
        const offMinor = cf!.discountAmount * 100;
        const sale = Math.max(0, currentPrice - offMinor);
        if (sale >= currentPrice) {
            return {
                discountLabel: '',
                wasPrice: null,
                salePrice: null,
                hasDiscount: false,
                isSuperDeal,
            };
        }
        return {
            discountLabel: `-${cf!.discountAmount.toLocaleString()}`,
            wasPrice: currentPrice,
            salePrice: sale,
            hasDiscount: true,
            isSuperDeal,
        };
    }

    if (cf!.discountPercentage && cf!.discountPercentage > 0) {
        const sale = Math.round(currentPrice * (1 - cf!.discountPercentage / 100));
        if (sale >= currentPrice) {
            return {
                discountLabel: '',
                wasPrice: null,
                salePrice: null,
                hasDiscount: false,
                isSuperDeal,
            };
        }
        return {
            discountLabel: `-${cf!.discountPercentage}%`,
            wasPrice: currentPrice,
            salePrice: sale,
            hasDiscount: true,
            isSuperDeal,
        };
    }

    return {
        discountLabel: '',
        wasPrice: null,
        salePrice: null,
        hasDiscount: false,
        isSuperDeal,
    };
}
