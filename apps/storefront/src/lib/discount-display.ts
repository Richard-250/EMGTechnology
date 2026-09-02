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
}

export function resolveDealDiscount(product: DealProductCardData): {
    discountLabel: string;
    wasPrice: number | null;
    hasDiscount: boolean;
} {
    const cf = product.customFields;
    const currentPrice = product.price;

    if (!cf?.isDiscounted || currentPrice == null) {
        return {discountLabel: '', wasPrice: null, hasDiscount: false};
    }

    const type = cf.discountType === 'fixed' ? 'fixed' : 'percentage';

    if (type === 'fixed' && cf.discountAmount && cf.discountAmount > 0) {
        const wasPrice = cf.originalPrice
            ? cf.originalPrice * 100
            : currentPrice + cf.discountAmount * 100;
        return {
            discountLabel: `-${cf.discountAmount.toLocaleString()}`,
            wasPrice,
            hasDiscount: true,
        };
    }

    if (cf.discountPercentage && cf.discountPercentage > 0) {
        const wasPrice = cf.originalPrice
            ? cf.originalPrice * 100
            : Math.round(currentPrice / (1 - cf.discountPercentage / 100));
        return {
            discountLabel: `-${cf.discountPercentage}%`,
            wasPrice,
            hasDiscount: true,
        };
    }

    return {discountLabel: '', wasPrice: null, hasDiscount: false};
}
