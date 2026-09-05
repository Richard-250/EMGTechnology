import Image from 'next/image';
import {FragmentOf, readFragment} from '@/graphql';
import {ProductCardFragment} from '@/lib/vendure/fragments';
import {ProductCardInteractive} from '@/components/commerce/product-card-interactive';
import {resolveProductImage} from '@/lib/product-images';
import {getProductPrice} from '@/lib/product-price';
import type {ProductDiscountFields} from '@/lib/discount-display';

interface ProductCardProps {
    product: FragmentOf<typeof ProductCardFragment>;
    variant?: 'default' | 'compact';
    customFields?: ProductDiscountFields | null;
}

export function ProductCard({
    product: productProp,
    variant = 'default',
    customFields,
}: ProductCardProps) {
    const product = readFragment(ProductCardFragment, productProp);
    const imageSrc = resolveProductImage(product.productAsset?.preview, product.slug);
    const price = getProductPrice(product.priceWithTax);

    return (
        <ProductCardInteractive
            variant={variant}
            data={{
                productId: product.productId,
                productVariantId: product.productVariantId,
                productName: product.productName,
                slug: product.slug,
                imageSrc,
                currencyCode: product.currencyCode,
                price,
                priceMin:
                    product.priceWithTax.__typename === 'PriceRange'
                        ? product.priceWithTax.min
                        : null,
                priceMax:
                    product.priceWithTax.__typename === 'PriceRange'
                        ? product.priceWithTax.max
                        : null,
                isPriceRange: product.priceWithTax.__typename === 'PriceRange',
                customFields: customFields ?? null,
            }}
        />
    );
}
