'use client';

import {useMemo, useState, useTransition} from 'react';
import {useSearchParams} from 'next/navigation';
import {usePathname, useRouter} from '@/i18n/navigation';
import Image from 'next/image';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {
    CheckCircle2,
    Minus,
    Plus,
    ShoppingCart,
    ShieldCheck,
    Tag,
    Truck,
    RotateCcw,
    Zap,
} from 'lucide-react';
import {addToCart} from '@/app/[locale]/product/[slug]/actions';
import {useCartConfirmation} from '@/components/commerce/cart-confirmation-provider';
import {toast} from 'sonner';
import {Price} from '@/components/commerce/price';
import {ProductDetailGallery} from '@/components/commerce/product-detail-gallery';
import {ProductStarRating} from '@/components/commerce/product-star-rating';
import {getProductRating, getSoldCount} from '@/lib/product-badges';
import {resolveDealDiscount, type ProductDiscountFields} from '@/lib/discount-display';
import {COMPANY} from '@/lib/company';
import {WhatsAppIcon} from '@/components/shared/whatsapp-icon';
import {buildProductWhatsAppUrl} from '@/lib/whatsapp';
import {cn} from '@/lib/utils';
import {useLocale, useTranslations} from 'next-intl';
import {toIntlLocale} from '@/i18n/locale-utils';

interface ProductDetailViewProps {
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
                group: {id: string; code: string; name: string};
            }>;
        }>;
        optionGroups: Array<{
            id: string;
            code: string;
            name: string;
            options: Array<{id: string; code: string; name: string}>;
        }>;
        customFields?: ProductDiscountFields | null;
    };
    searchParams: Record<string, string | string[] | undefined>;
    currencyCode: string;
    carouselImages: Array<{id: string; preview: string; source: string}>;
}

export function ProductDetailView({
    product,
    searchParams,
    currencyCode,
    carouselImages,
}: ProductDetailViewProps) {
    const t = useTranslations('Product');
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const {showConfirmation} = useCartConfirmation();
    const currentSearchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [isAdded, setIsAdded] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const rating = getProductRating(product.slug);
    const sold = getSoldCount(product.slug);

    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
        const initialOptions: Record<string, string> = {};
        product.optionGroups.forEach(group => {
            const paramValue = searchParams[group.code];
            if (typeof paramValue === 'string') {
                const option = group.options.find(opt => opt.code === paramValue);
                if (option) initialOptions[group.id] = option.id;
            }
        });
        return initialOptions;
    });

    const selectedVariant = useMemo(() => {
        if (product.variants.length === 1) return product.variants[0];
        if (Object.keys(selectedOptions).length !== product.optionGroups.length) return null;
        return product.variants.find(variant => {
            const variantOptionIds = variant.options.map(opt => opt.id);
            return Object.values(selectedOptions).every(optId => variantOptionIds.includes(optId));
        });
    }, [selectedOptions, product.variants, product.optionGroups]);

    const formatPriceLabel = (value: number) =>
        new Intl.NumberFormat(toIntlLocale(locale), {
            style: 'currency',
            currency: currencyCode,
            maximumFractionDigits: currencyCode === 'RWF' ? 0 : 2,
        }).format(value / 100);

    const whatsappHref = useMemo(() => {
        if (!selectedVariant) {
            return buildProductWhatsAppUrl({
                productName: product.name,
                productSlug: product.slug,
            });
        }
        return buildProductWhatsAppUrl({
            productName: product.name,
            productSlug: product.slug,
            sku: selectedVariant.sku,
            priceLabel: formatPriceLabel(selectedVariant.priceWithTax),
            currencyCode,
            quantity,
        });
    }, [product.name, product.slug, selectedVariant, currencyCode, quantity, locale]);

    const discountInfo = useMemo(() => {
        if (!selectedVariant) {
            return {
                discountLabel: '',
                wasPrice: null as number | null,
                hasDiscount: false,
                isSuperDeal: product.customFields?.isDiscounted === true,
            };
        }
        return resolveDealDiscount({
            price: selectedVariant.priceWithTax,
            customFields: product.customFields,
        });
    }, [selectedVariant, product.customFields]);

    const handleOptionChange = (groupId: string, optionId: string) => {
        setSelectedOptions(prev => ({...prev, [groupId]: optionId}));
        const group = product.optionGroups.find(g => g.id === groupId);
        const option = group?.options.find(opt => opt.id === optionId);
        if (group && option) {
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
                        image: carouselImages[0]?.preview,
                        quantity,
                        unitPrice: selectedVariant.priceWithTax,
                        currencyCode,
                    },
                    result.order.totalQuantity,
                );
                setTimeout(() => setIsAdded(false), 2000);
            } else {
                toast.error(t('errorTitle'), {description: result.error || t('errorAddToCart')});
            }
        });
    };

    const isInStock = selectedVariant && selectedVariant.stockLevel !== 'OUT_OF_STOCK';
    const canPurchase = selectedVariant && isInStock;
    const plainDescription = product.description?.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Gallery */}
                <div className="lg:col-span-5">
                    <ProductDetailGallery
                        images={carouselImages}
                        productName={product.name}
                        discountLabel={discountInfo.hasDiscount ? discountInfo.discountLabel : null}
                    />
                </div>

                {/* Center — title, price, variants, overview */}
                <div className="lg:col-span-4 flex flex-col space-y-4">
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-foreground leading-snug">{product.name}</h1>
                        <div className="flex items-center gap-2 mt-2 flex-wrap text-xs sm:text-sm">
                            <ProductStarRating stars={rating.stars} count={rating.count} size="sm" />
                            <span className="text-muted-foreground">·</span>
                            <span className="text-foreground/80 font-semibold">{t('sold', {count: sold})}</span>
                        </div>
                    </div>

                    {selectedVariant && (
                        <div className="rounded-xl bg-electric/10 dark:bg-electric/15 border border-electric/25 p-4 space-y-2">
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-2xl sm:text-3xl font-black tracking-tight text-electric">
                                    <Price value={selectedVariant.priceWithTax} currencyCode={currencyCode} />
                                </span>
                                {discountInfo.hasDiscount && discountInfo.wasPrice != null && (
                                    <>
                                        <span className="text-xs font-bold text-electric bg-electric/15 px-1.5 py-0.5 rounded">
                                            {discountInfo.discountLabel}
                                        </span>
                                        <span className="text-sm text-muted-foreground line-through">
                                            <Price value={discountInfo.wasPrice} currencyCode={currencyCode} />
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                {discountInfo.isSuperDeal && (
                                    <span className="inline-flex items-center gap-1 text-electric font-bold text-[10px] bg-electric/15 px-1.5 py-0.5 rounded-sm">
                                        <Tag className="size-2.5" />
                                        Super Deal
                                    </span>
                                )}
                                <span>{t('freeShipping')}</span>
                            </div>
                        </div>
                    )}

                    {product.optionGroups.length > 0 && (
                        <div className="space-y-4 pt-2 border-t border-border/60">
                            {product.optionGroups.map((group, groupIndex) => {
                                const selectedOptionId = selectedOptions[group.id];
                                const selectedOption = group.options.find(o => o.id === selectedOptionId);
                                return (
                                    <div key={group.id} className="space-y-2">
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">{group.name}: </span>
                                            <span className="font-bold">{selectedOption?.name ?? t('selectOptions')}</span>
                                        </div>
                                        {groupIndex === 0 && carouselImages.length > 1 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {group.options.map((option, idx) => {
                                                    const active = selectedOptionId === option.id;
                                                    const swatchImg = carouselImages[idx % carouselImages.length]?.preview;
                                                    return (
                                                        <button
                                                            key={option.id}
                                                            type="button"
                                                            onClick={() => handleOptionChange(group.id, option.id)}
                                                            className={cn(
                                                                'relative p-1 rounded-lg border-2 transition-all cursor-pointer bg-card',
                                                                active
                                                                    ? 'border-foreground ring-2 ring-foreground/20'
                                                                    : 'border-border/80 hover:border-foreground/50 opacity-80 hover:opacity-100',
                                                            )}
                                                            title={option.name}
                                                        >
                                                            <div className="relative size-10 rounded-md overflow-hidden bg-muted">
                                                                {swatchImg && (
                                                                    <Image src={swatchImg} alt={option.name} fill className="object-cover" sizes="40px" />
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <RadioGroup
                                                value={selectedOptionId || ''}
                                                onValueChange={value => handleOptionChange(group.id, value)}
                                            >
                                                <div className="flex flex-wrap gap-2">
                                                    {group.options.map(option => (
                                                        <div key={option.id}>
                                                            <RadioGroupItem value={option.id} id={option.id} className="peer sr-only" />
                                                            <Label
                                                                htmlFor={option.id}
                                                                className="inline-flex min-w-[3.5rem] items-center justify-center rounded-md border-2 border-muted bg-popover px-4 py-2 text-sm font-medium hover:bg-accent peer-data-[checked]:border-foreground peer-data-[checked]:ring-2 peer-data-[checked]:ring-foreground/20 cursor-pointer transition-all"
                                                            >
                                                                {option.name}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </RadioGroup>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {plainDescription && (
                        <div className="pt-3 border-t border-border/60 space-y-2">
                            <h2 className="text-sm font-bold">{t('overview')}</h2>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-6">
                                {plainDescription}
                            </p>
                        </div>
                    )}

                    {selectedVariant && (
                        <p className="text-xs text-muted-foreground">{t('sku', {sku: selectedVariant.sku})}</p>
                    )}
                </div>

                {/* Right sidebar — seller, shipping, buy box */}
                <div className="lg:col-span-3 lg:border-l lg:border-border/60 lg:pl-6 flex flex-col gap-5">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-border/60">
                            <div>
                                <p className="text-[11px] text-muted-foreground">Sold by</p>
                                <p className="text-sm font-bold">{COMPANY.legalName}</p>
                            </div>
                            <a
                                href={whatsappHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#25D366] hover:underline"
                            >
                                <WhatsAppIcon className="size-3.5" />
                                Message
                            </a>
                        </div>

                        <div className="space-y-3 text-xs">
                            <p className="font-bold text-sm">Service commitment</p>
                            <div className="flex items-start gap-2">
                                <Truck className="size-4 text-foreground shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">{t('trustBadges.fastShipping')}</p>
                                    <p className="text-[11px] text-muted-foreground">{t('freeShipping')}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <RotateCcw className="size-4 text-foreground shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">{t('trustBadges.freeReturns')}</p>
                                    <p className="text-[11px] text-muted-foreground">7-day easy returns</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <ShieldCheck className="size-4 text-foreground shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">{t('trustBadges.secureCheckout')}</p>
                                    <p className="text-[11px] text-muted-foreground">Safe payments · Privacy protected</p>
                                </div>
                            </div>
                        </div>

                        {selectedVariant && isInStock && (
                            <div className="pt-3 border-t border-border/60 space-y-2">
                                <Label className="text-xs font-bold">{t('quantity')}</Label>
                                <div className="flex items-center gap-3">
                                    <div className="inline-flex items-center border border-border rounded-lg overflow-hidden">
                                        <Button type="button" variant="ghost" size="icon" className="rounded-none size-9" disabled={quantity <= 1} onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                                            <Minus className="size-3.5" />
                                        </Button>
                                        <span className="w-10 text-center text-sm font-bold tabular-nums">{quantity}</span>
                                        <Button type="button" variant="ghost" size="icon" className="rounded-none size-9" disabled={quantity >= 99} onClick={() => setQuantity(q => Math.min(99, q + 1))}>
                                            <Plus className="size-3.5" />
                                        </Button>
                                    </div>
                                    {selectedVariant.stockLevel === 'LOW_STOCK' && (
                                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Only a few left</span>
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedVariant && !isInStock && (
                            <p className="text-sm font-semibold text-destructive">{t('outOfStock')}</p>
                        )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border/60 lg:sticky lg:top-24">
                        <Button
                            type="button"
                            onClick={() => handleAddToCart('buyNow')}
                            disabled={!canPurchase || isPending}
                            className="w-full h-11 font-bold bg-electric hover:bg-electric/90 text-electric-foreground rounded-xl"
                        >
                            <Zap className="mr-2 size-4 fill-current" />
                            {t('buyNow')}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleAddToCart('cart')}
                            disabled={!canPurchase || isPending}
                            className="w-full h-11 font-bold border-2 border-electric/40 text-electric hover:bg-electric/10 rounded-xl"
                        >
                            {isAdded ? (
                                <>
                                    <CheckCircle2 className="mr-2 size-4" />
                                    {t('addedToCart')}
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="mr-2 size-4" />
                                    {isPending ? t('adding') : !selectedVariant && product.optionGroups.length > 0 ? t('selectOptions') : t('addToCart')}
                                </>
                            )}
                        </Button>

                        <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full h-10 items-center justify-center gap-2 rounded-xl border border-[#25D366]/40 text-[#128C7E] dark:text-[#25D366] font-semibold text-sm hover:bg-[#25D366]/10 transition-colors"
                        >
                            <WhatsAppIcon className="size-4" />
                            {t('orderViaWhatsApp')}
                        </a>
                    </div>
                </div>
            </div>

            {/* Full description */}
            {product.description && (
                <section className="border-t border-border/60 pt-8">
                    <h2 className="text-lg font-bold mb-4">{t('description')}</h2>
                    <div
                        className="prose prose-sm max-w-none text-muted-foreground dark:prose-invert"
                        dangerouslySetInnerHTML={{__html: product.description}}
                    />
                </section>
            )}
        </div>
    );
}
