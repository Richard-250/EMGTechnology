import {FragmentOf, readFragment} from '@/graphql';
import {ProductCardFragment} from '@/lib/vendure/fragments';
import {ProductCardInteractive} from '@/components/commerce/product-card-interactive';
import {resolveProductImage} from '@/lib/product-images';
import {getProductPrice} from '@/lib/product-price';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {getRwfPerUsd} from '@/lib/exchange-rate-server';
import {applyActiveCurrencyToSearchPrices} from '@/lib/search-price-display';
import type {ProductDiscountFields} from '@/lib/discount-display';

interface ProductCardProps {
    product: FragmentOf<typeof ProductCardFragment>;
    variant?: 'default' | 'compact';
    customFields?: ProductDiscountFields | null;
}

export async function ProductCard({
    product: productProp,
    variant = 'default',
    customFields,
}: ProductCardProps) {
    const product = readFragment(ProductCardFragment, productProp);
    const imageSrc = resolveProductImage(product.productAsset?.preview, product.slug);
    const price = getProductPrice(product.priceWithTax);
    const activeCurrency = await getActiveCurrencyCode();
    const rwfPerUsd = await getRwfPerUsd();

    const priced = applyActiveCurrencyToSearchPrices(
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
    );

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
