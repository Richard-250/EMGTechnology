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
 * The catalog `price` (priceWithTax) is always the real selling price — same on
 * Super Deals, PDP, cart, and checkout. Discount fields only drive the “was”
 * (struck-through) price and badge labels. We never invent a cheaper “sale”
 * amount that would disagree with what the customer pays.
 */
export function resolveDealDiscount(product: {
    price?: number | null;
    customFields?: ProductDiscountFields | null;
}): {
    discountLabel: string;
    wasPrice: number | null;
    /** Always null — selling price is the catalog price everywhere. */
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
        cf!.originalPrice && cf!.originalPrice > 0 ? Math.round(cf!.originalPrice * 100) : null;

    let wasPrice: number | null = null;

    if (storedOriginalMinor != null && storedOriginalMinor > currentPrice) {
        wasPrice = storedOriginalMinor;
    } else if (type === 'percentage' && cf!.discountPercentage && cf!.discountPercentage > 0 && cf!.discountPercentage < 100) {
        // Infer list price from % off so badges stay informative without changing the sell price
        wasPrice = Math.round(currentPrice / (1 - cf!.discountPercentage / 100));
    } else if (type === 'fixed' && cf!.discountAmount && cf!.discountAmount > 0) {
        wasPrice = currentPrice + Math.round(cf!.discountAmount * 100);
    }

    if (wasPrice == null || wasPrice <= currentPrice) {
        return {
            discountLabel: '',
            wasPrice: null,
            salePrice: null,
            hasDiscount: false,
            isSuperDeal,
        };
    }

    const pct = Math.round((1 - currentPrice / wasPrice) * 100);
    const discountLabel =
        type === 'fixed' && cf!.discountAmount
            ? `${cf!.discountAmount.toLocaleString()} off`
            : cf!.discountPercentage
              ? `${cf!.discountPercentage}% off`
              : pct > 0
                ? `${pct}% off`
                : '';

    return {
        discountLabel,
        wasPrice,
        salePrice: null,
        hasDiscount: Boolean(discountLabel) || wasPrice > currentPrice,
        isSuperDeal,
    };
}
