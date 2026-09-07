import {FragmentOf, readFragment} from '@/graphql';
import {ProductCardFragment} from '@/lib/vendure/fragments';
import {ProductCardInteractive} from '@/components/commerce/product-card-interactive';
import {resolveProductImage} from '@/lib/product-images';
import {getProductPrice} from '@/lib/product-price';
import {applyActiveCurrencyToSearchPrices} from '@/lib/search-price-display';
import type {ProductDiscountFields} from '@/lib/discount-display';

interface ProductCardProps {
    product: FragmentOf<typeof ProductCardFragment>;
    variant?: 'default' | 'compact';
    customFields?: ProductDiscountFields | null;
    /** Active shopper currency (from server parent). Search index is usually RWF. */
    activeCurrency?: string;
    /** Admin RWF-per-USD rate for converting search prices. */
    rwfPerUsd?: number;
}

/**
 * Shared card used from both Server and Client parents.
 * Keep free of next/cache and next/headers imports.
 */
export function ProductCard({
    product: productProp,
    variant = 'default',
    customFields,
    activeCurrency,
    rwfPerUsd,
}: ProductCardProps) {
    const product = readFragment(ProductCardFragment, productProp);
    const imageSrc = resolveProductImage(product.productAsset?.preview, product.slug);
    const price = getProductPrice(product.priceWithTax);

    const priced =
        activeCurrency && rwfPerUsd
            ? applyActiveCurrencyToSearchPrices(
                  {
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
                      customFields: customFields ?? null,
                  },
                  activeCurrency,
                  rwfPerUsd,
              )
            : {
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
                  customFields: customFields ?? null,
              };

    return (
        <ProductCardInteractive
            variant={variant}
            data={{
                productId: product.productId,
                productVariantId: product.productVariantId,
                productName: product.productName,
                slug: product.slug,
                imageSrc,
                currencyCode: priced.currencyCode,
                price: priced.price,
                priceMin: priced.priceMin,
                priceMax: priced.priceMax,
                isPriceRange: product.priceWithTax.__typename === 'PriceRange',
                customFields: priced.customFields,
            }}
        />
    );
}
