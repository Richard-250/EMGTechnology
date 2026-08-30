'use client';

import {useState, useMemo, useTransition} from 'react';
import {useSearchParams} from 'next/navigation';
import {usePathname, useRouter} from '@/i18n/navigation';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Separator} from '@/components/ui/separator';
import {ShoppingCart, CheckCircle2, Minus, Plus, Zap} from 'lucide-react';
import {addToCart} from '@/app/[locale]/product/[slug]/actions';
import {useCartConfirmation} from '@/components/commerce/cart-confirmation-provider';
import {toast} from 'sonner';
import {Price} from '@/components/commerce/price';
import {ProductStarRating} from '@/components/commerce/product-star-rating';
import {getDiscountPercent, getProductRating, getSoldCount, getWasPrice} from '@/lib/product-badges';
import {useTranslations} from 'next-intl';

interface ProductInfoProps {
    product: {
        id: string;
        name: string;
        slug: string;
        description: string;
        variants: Array<{
            id: string;
            name: string;
            sku: string;
            priceWithTax: number;
            stockLevel: string;
            options: Array<{
                id: string;
                code: string;
                name: string;
                groupId: string;
                group: {
                    id: string;
                    code: string;
                    name: string;
                };
            }>;
        }>;
        optionGroups: Array<{
            id: string;
            code: string;
            name: string;
            options: Array<{
                id: string;
                code: string;
                name: string;
            }>;
        }>;
    };
    searchParams: { [key: string]: string | string[] | undefined };
    currencyCode: string;
    productImage?: string;
}

export function ProductInfo({product, searchParams, currencyCode, productImage}: ProductInfoProps) {
    const t = useTranslations('Product');
    const pathname = usePathname();
    const router = useRouter();
    const {showConfirmation} = useCartConfirmation();
    const currentSearchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [isAdded, setIsAdded] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const rating = getProductRating(product.slug);
    const sold = getSoldCount(product.slug);
    const discount = getDiscountPercent(product.slug);

    // Initialize selected options from URL
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
        const initialOptions: Record<string, string> = {};

        // Load from URL search params
        product.optionGroups.forEach((group) => {
            const paramValue = searchParams[group.code];
            if (typeof paramValue === 'string') {
                // Find the option by code
                const option = group.options.find((opt) => opt.code === paramValue);
                if (option) {
                    initialOptions[group.id] = option.id;
                }
            }
        });

        return initialOptions;
    });

    // Find the matching variant based on selected options
    const selectedVariant = useMemo(() => {
        if (product.variants.length === 1) {
            return product.variants[0];
        }

        // If not all option groups have a selection, return null
        if (Object.keys(selectedOptions).length !== product.optionGroups.length) {
            return null;
        }

        // Find variant that matches all selected options
        return product.variants.find((variant) => {
            const variantOptionIds = variant.options.map((opt) => opt.id);
            const selectedOptionIds = Object.values(selectedOptions);
            return selectedOptionIds.every((optId) => variantOptionIds.includes(optId));
        });
    }, [selectedOptions, product.variants, product.optionGroups]);

    const handleOptionChange = (groupId: string, optionId: string) => {
        setSelectedOptions((prev) => ({
            ...prev,
            [groupId]: optionId,
        }));

        // Find the option group and option to get their codes
        const group = product.optionGroups.find((g) => g.id === groupId);
        const option = group?.options.find((opt) => opt.id === optionId);

        if (group && option) {
            // Update URL with option code
            const params = new URLSearchParams(currentSearchParams);
            params.set(group.code, option.code);
            router.push(`${pathname}?${params.toString()}`, {scroll: false});
        }
    };

    const handleAddToCart = async (mode: 'cart' | 'buyNow' = 'cart') => {
        if (!selectedVariant) return;

        startTransition(async () => {
            const result = await addToCart(selectedVariant.id, quantity);

            if (result.success && result.order) {
                setIsAdded(true);
                router.refresh();

                if (mode === 'buyNow') {
                    router.push('/cart');
                    return;
                }

                showConfirmation(
                    {
                        name: product.name,
                        slug: product.slug,
                        image: productImage,
                        quantity,
                        unitPrice: selectedVariant.priceWithTax,
                        currencyCode,
                    },
                    result.order.totalQuantity,
                );

                setTimeout(() => setIsAdded(false), 2000);
            } else {
                toast.error(t('errorTitle'), {
                    description: result.error || t('errorAddToCart'),
                });
            }
        });
    };

    const isInStock = selectedVariant && selectedVariant.stockLevel !== 'OUT_OF_STOCK';
    const canAddToCart = selectedVariant && isInStock;

    return (
        <div className="space-y-6">
            {/* Product Title & Price */}
            <div className="space-y-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">{product.name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <ProductStarRating stars={rating.stars} count={rating.count} size="md" />
                    <span className="text-muted-foreground">{t('sold', {count: sold})}</span>
                </div>
                {selectedVariant && (
                    <div className="space-y-1">
                        {discount != null && (
                            <div className="flex items-center gap-2">
                                <span className="rounded bg-electric text-electric-foreground text-xs font-bold px-2 py-0.5">
                                    -{discount}%
                                </span>
                                <p className="text-sm text-muted-foreground line-through">
                                    <Price
                                        value={getWasPrice(selectedVariant.priceWithTax, discount)}
                                        currencyCode={currencyCode}
                                    />
                                </p>
                            </div>
                        )}
                        <p className="text-2xl md:text-3xl text-electric font-bold">
                            <Price value={selectedVariant.priceWithTax} currencyCode={currencyCode}/>
                        </p>
                        <p className="text-sm text-electric font-medium">{t('freeShipping')}</p>
                    </div>
                )}
            </div>

            <Separator />

            {/* Product Description */}
            <div className="prose prose-sm max-w-none text-muted-foreground">
                <div dangerouslySetInnerHTML={{__html: product.description}}/>
            </div>

            {/* Option Groups */}
            {product.optionGroups.length > 0 && (
                <div className="space-y-5">
                    {product.optionGroups.map((group) => (
                        <div key={group.id} className="space-y-3">
                            <Label className="text-base font-semibold">
                                {group.name}
                            </Label>
                            <RadioGroup
                                value={selectedOptions[group.id] || ''}
                                onValueChange={(value) => handleOptionChange(group.id, value)}
                            >
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {group.options.map((option) => (
                                        <div key={option.id}>
                                            <RadioGroupItem
                                                value={option.id}
                                                id={option.id}
                                                className="peer sr-only"
                                            />
                                            <Label
                                                htmlFor={option.id}
                                                className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover px-4 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground peer-data-[checked]:border-primary peer-data-[checked]:ring-2 peer-data-[checked]:ring-primary/20 peer-data-[checked]:bg-primary/5 cursor-pointer transition-all"
                                            >
                                                {option.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>
                    ))}
                </div>
            )}

            {/* Stock Status */}
            {selectedVariant && (
                <div className="text-sm">
                    {isInStock ? (
                        <span className="inline-flex items-center gap-1.5 text-green-600 font-medium">
                            <span className="h-2 w-2 rounded-full bg-green-600" />
                            {t('inStock')}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 text-destructive font-medium">
                            <span className="h-2 w-2 rounded-full bg-destructive" />
                            {t('outOfStock')}
                        </span>
                    )}
                </div>
            )}

            {/* Quantity */}
            {selectedVariant && isInStock && (
                <div className="space-y-2">
                    <Label className="text-base font-semibold">{t('quantity')}</Label>
                    <div className="inline-flex items-center rounded-lg border border-border">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="rounded-r-none"
                            disabled={quantity <= 1}
                            onClick={() => setQuantity(q => Math.max(1, q - 1))}
                            aria-label={t('decreaseQuantity')}
                        >
                            <Minus className="size-4" />
                        </Button>
                        <span className="w-12 text-center text-sm font-semibold tabular-nums">{quantity}</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="rounded-l-none"
                            disabled={quantity >= 99}
                            onClick={() => setQuantity(q => Math.min(99, q + 1))}
                            aria-label={t('increaseQuantity')}
                        >
                            <Plus className="size-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Add to Cart / Buy Now — Nyereka-style */}
            <div className="pt-2 space-y-3">
                <Button
                    size="lg"
                    className="w-full h-12 text-base font-semibold rounded-lg bg-electric hover:bg-electric/90 text-electric-foreground"
                    disabled={!canAddToCart || isPending}
                    onClick={() => handleAddToCart('cart')}
                >
                    {isAdded ? (
                        <>
                            <CheckCircle2 className="mr-2 h-5 w-5"/>
                            {t('addedToCart')}
                        </>
                    ) : (
                        <>
                            <ShoppingCart className="mr-2 h-5 w-5"/>
                            {isPending
                                ? t('adding')
                                : !selectedVariant && product.optionGroups.length > 0
                                    ? t('selectOptions')
                                    : !isInStock
                                        ? t('outOfStock')
                                        : t('addToCart')}
                        </>
                    )}
                </Button>
                <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-12 text-base font-semibold rounded-lg border-2"
                    disabled={!canAddToCart || isPending}
                    onClick={() => handleAddToCart('buyNow')}
                >
                    <Zap className="mr-2 h-5 w-5"/>
                    {t('buyNow')}
                </Button>
            </div>

            {/* SKU */}
            {selectedVariant && (
                <div className="text-xs text-muted-foreground">
                    {t('sku', {sku: selectedVariant.sku})}
                </div>
            )}
        </div>
    );
}
