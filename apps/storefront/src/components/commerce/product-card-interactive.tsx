'use client';

import {useState, useTransition} from 'react';
import Image from 'next/image';
import {Link} from '@/i18n/navigation';
import {ShoppingCart, Eye} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';
import {Price} from '@/components/commerce/price';
import {ProductStarRating} from '@/components/commerce/product-star-rating';
import {resolveProductImage} from '@/lib/product-images';
import {getProductRating, getSoldCount} from '@/lib/product-badges';
import {
    resolveDealDiscount,
    type ProductDiscountFields,
} from '@/lib/discount-display';
import {addToCart} from '@/app/[locale]/product/[slug]/actions';
import {useCartConfirmation} from '@/components/commerce/cart-confirmation-provider';
import {toast} from 'sonner';
import {Button} from '@/components/ui/button';
import {ProductPreviewModal} from '@/components/commerce/product-preview-modal';
import {recordProductClick} from '@/lib/product-interactions';

export interface ProductCardData {
    productId: string;
    productVariantId: string;
    productName: string;
    slug: string;
    imageSrc: string;
    currencyCode: string;
    price: number | null;
    priceMin?: number | null;
    priceMax?: number | null;
    isPriceRange: boolean;
    customFields?: ProductDiscountFields | null;
}

interface ProductCardInteractiveProps {
    data: ProductCardData;
    variant?: 'default' | 'compact';
}

export function ProductCardInteractive({data, variant = 'default'}: ProductCardInteractiveProps) {
    const t = useTranslations('Product');
    const compact = variant === 'compact';
    const {showConfirmation} = useCartConfirmation();
    const [previewOpen, setPreviewOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const rating = getProductRating(data.slug);
    const sold = getSoldCount(data.slug);
    const {discountLabel, wasPrice, hasDiscount, isSuperDeal} = resolveDealDiscount({
        price: data.price,
        customFields: data.customFields,
    });
    const similarQuery = encodeURIComponent(data.productName.split(' ')[0] ?? data.slug);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!data.productVariantId) {
            toast.error(t('errorAddToCart'));
            return;
        }
        startTransition(async () => {
            const result = await addToCart(data.productVariantId, 1);
            if (result.success && result.order && data.price != null) {
                showConfirmation(
                    {
                        name: data.productName,
                        slug: data.slug,
                        image: data.imageSrc,
                        quantity: 1,
                        unitPrice: data.price,
                        currencyCode: data.currencyCode,
                    },
                    result.order.totalQuantity,
                );
            } else {
                toast.error(result.error || t('errorAddToCart'));
            }
        });
    };

    const handleOpenPreview = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setPreviewOpen(true);
    };

    const priceDisplay =
        data.price != null ? (
            <Price value={data.price} currencyCode={data.currencyCode} />
        ) : data.isPriceRange && data.priceMin != null ? (
            <Price value={data.priceMin} currencyCode={data.currencyCode} />
        ) : null;

    return (
        <>
            <div
                className={cn(
                    'group relative z-0 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none',
                    'hover:z-50',
                    compact
                        ? 'bg-white dark:bg-card rounded-xl border border-border/80 hover:border-electric/50 hover:shadow-md transition-all duration-200'
                        : 'rounded-xl border border-border/80 hover:border-electric/50 hover:shadow-md transition-all duration-300 bg-card',
                    'overflow-visible',
                )}
            >
                {/* Clicking on the product card takes user directly to full dedicated product page */}
                <Link
                    href={`/product/${data.slug}`}
                    className="block"
                    onClick={() => recordProductClick(data.productId)}
                >
                    <div className="relative bg-muted overflow-hidden aspect-square rounded-t-xl">
                        {(hasDiscount || isSuperDeal) && (
                            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
                                {hasDiscount && discountLabel && (
                                    <span className="rounded-md bg-electric text-electric-foreground text-[10px] font-bold px-1.5 py-0.5 shadow-xs w-fit">
                                        {discountLabel}
                                    </span>
                                )}
                                {isSuperDeal && (
                                    <span className="rounded-md bg-foreground text-background text-[10px] font-bold px-1.5 py-0.5 shadow-xs w-fit">
                                        Super Deal
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Quick View / Preview button */}
                        <button
                            type="button"
                            onClick={handleOpenPreview}
                            className={cn(
                                'absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-black/75 hover:bg-black text-white text-[10px] sm:text-[11px] font-bold shadow-md transition-all duration-200 cursor-pointer active:scale-95',
                                'opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity',
                            )}
                            aria-label={t('seePreview')}
                        >
                            <Eye className="size-3.5" />
                            <span>Preview</span>
                        </button>

                        <Image
                            src={data.imageSrc}
                            alt={data.productName}
                            fill
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                            sizes={
                                compact
                                    ? '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw'
                                    : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                            }
                        />

                        {/* Add to cart icon button */}
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            disabled={isPending}
                            className={cn(
                                'absolute bottom-2 right-2 z-10 flex size-8 sm:size-9 items-center justify-center rounded-full bg-white/95 dark:bg-card shadow-md border border-border/60 text-foreground',
                                'opacity-100 sm:opacity-0 sm:translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-200',
                                'hover:bg-electric hover:text-electric-foreground hover:border-electric active:scale-95 cursor-pointer',
                            )}
                            aria-label={t('addToCart')}
                        >
                            <ShoppingCart className="size-3.5 sm:size-4" />
                        </button>
                    </div>

                    <div className={cn(compact ? 'p-2.5 space-y-1' : 'pt-3 pb-1 px-1 space-y-1')}>
                        <h3
                            className={cn(
                                'leading-snug line-clamp-2 group-hover:text-electric transition-colors font-medium',
                                compact
                                    ? 'text-xs md:text-sm text-foreground/90 min-h-[2.5rem]'
                                    : 'text-sm md:text-base px-2',
                            )}
                        >
                            {data.productName}
                        </h3>
                        <div className={compact ? '' : 'px-2'}>
                            <ProductStarRating stars={rating.stars} count={rating.count} size="sm" />
                        </div>
                        <div className={cn('space-y-0.5', compact ? '' : 'px-2')}>
                            {hasDiscount && wasPrice != null && data.price != null && (
                                <p className="text-[10px] text-muted-foreground line-through">
                                    <Price value={wasPrice} currencyCode={data.currencyCode} />
                                </p>
                            )}
                            <p
                                className={cn(
                                    'font-bold tracking-tight text-electric',
                                    compact ? 'text-sm md:text-base' : 'text-base',
                                )}
                            >
                                {priceDisplay}
                            </p>
                        </div>
                        <p className={cn('text-[10px] text-muted-foreground', compact ? '' : 'px-2 pb-1')}>
                            {t('sold', {count: sold})}
                            <span className="mx-1">·</span>
                            <span className="text-electric">{t('freeShipping')}</span>
                        </p>
                    </div>
                </Link>

                {/* Desktop hover actions: overlay so grid siblings do not reflow */}
                <div
                    className={cn(
                        'pointer-events-none absolute left-0 right-0 top-full z-50 hidden flex-col gap-1.5',
                        'rounded-b-xl border border-t-0 border-border/80 bg-card px-2 pb-2 pt-1 shadow-lg',
                        'lg:group-hover:pointer-events-auto lg:group-hover:flex',
                    )}
                >
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs font-bold border-foreground/20 rounded-lg"
                        onClick={handleOpenPreview}
                    >
                        <Eye className="size-3.5 mr-1.5" />
                        {t('seePreview')}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs font-bold border-foreground/20 rounded-lg"
                        render={<Link href={`/search?q=${similarQuery}`} onClick={e => e.stopPropagation()} />}
                        nativeButton={false}
                    >
                        {t('similarItems')}
                    </Button>
                </div>
            </div>

            {/* Rich AliExpress-style Quick Preview Modal */}
            <ProductPreviewModal
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                initialData={data}
            />
        </>
    );
}

