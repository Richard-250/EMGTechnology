'use client';

import {useState, useTransition} from 'react';
import Image from 'next/image';
import {Link} from '@/i18n/navigation';
import {ShoppingCart} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';
import {Price} from '@/components/commerce/price';
import {ProductStarRating} from '@/components/commerce/product-star-rating';
import {resolveProductImage} from '@/lib/product-images';
import {
    getDiscountPercent,
    getProductRating,
    getSoldCount,
    getWasPrice,
} from '@/lib/product-badges';
import {addToCart} from '@/app/[locale]/product/[slug]/actions';
import {useCartConfirmation} from '@/components/commerce/cart-confirmation-provider';
import {toast} from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';

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
    const discount = getDiscountPercent(data.slug);
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
                    'group relative block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    compact
                        ? 'bg-white rounded-md overflow-hidden border border-border/80 hover:border-electric/40 hover:shadow-sm transition-all duration-200'
                        : 'overflow-hidden rounded-sm border border-transparent hover:border-electric/30 hover:shadow-md transition-all duration-300 bg-card',
                )}
            >
                <Link href={`/product/${data.slug}`} className="block">
                    <div className="relative bg-muted overflow-hidden aspect-square">
                        {discount != null && (
                            <span className="absolute top-2 left-2 z-10 rounded-sm bg-electric text-electric-foreground text-[10px] font-bold px-1.5 py-0.5">
                                -{discount}%
                            </span>
                        )}
                        <Image
                            src={data.imageSrc}
                            alt={data.productName}
                            fill
                            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                            sizes={
                                compact
                                    ? '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw'
                                    : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                            }
                        />
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            disabled={isPending}
                            className={cn(
                                'absolute bottom-2 right-2 z-10 flex size-8 sm:size-9 items-center justify-center rounded-full bg-white/95 dark:bg-card shadow-md border border-border/60 text-foreground',
                                'opacity-100 sm:opacity-0 sm:translate-y-1 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-200',
                                'hover:bg-electric hover:text-electric-foreground hover:border-electric active:scale-95',
                            )}
                            aria-label={t('addToCart')}
                        >
                            <ShoppingCart className="size-3.5 sm:size-4" />
                        </button>
                    </div>
                    <div className={cn(compact ? 'p-2.5 space-y-1' : 'pt-3 pb-1 px-1 space-y-1')}>
                        <h3
                            className={cn(
                                'leading-snug line-clamp-2 group-hover:text-foreground transition-colors',
                                compact
                                    ? 'text-xs md:text-sm text-foreground/90 min-h-[2.5rem]'
                                    : 'font-medium text-sm md:text-base px-2',
                            )}
                        >
                            {data.productName}
                        </h3>
                        <div className={compact ? '' : 'px-2'}>
                            <ProductStarRating stars={rating.stars} count={rating.count} size="sm" />
                        </div>
                        <div className={cn('space-y-0.5', compact ? '' : 'px-2')}>
                            {discount != null && data.price != null && (
                                <p className="text-[10px] text-muted-foreground line-through">
                                    <Price
                                        value={getWasPrice(data.price, discount)}
                                        currencyCode={data.currencyCode}
                                    />
                                </p>
                            )}
                            <p
                                className={cn(
                                    'font-semibold tracking-tight text-electric',
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

                <div
                    className={cn(
                        'hidden group-hover:flex flex-col gap-1.5 px-2 pb-2 pt-1 border-t border-border/50 bg-card',
                    )}
                >
                    <Button
                        type="button"
                        size="sm"
                        className="w-full h-8 text-xs font-bold bg-foreground text-background hover:bg-foreground/90"
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPreviewOpen(true);
                        }}
                    >
                        {t('seePreview')}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs font-bold border-foreground/20"
                        render={<Link href={`/search?q=${similarQuery}`} />}
                        nativeButton={false}
                    >
                        {t('similarItems')}
                    </Button>
                </div>
            </div>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="line-clamp-2 pr-6">{data.productName}</DialogTitle>
                    </DialogHeader>
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <Image
                            src={data.imageSrc}
                            alt={data.productName}
                            fill
                            className="object-cover"
                            sizes="400px"
                        />
                    </div>
                    {data.price != null && (
                        <p className="text-xl font-bold text-electric">
                            <Price value={data.price} currencyCode={data.currencyCode} />
                        </p>
                    )}
                    <div className="flex gap-2">
                        <Button
                            className="flex-1 bg-electric hover:bg-electric/90 text-electric-foreground"
                            onClick={handleAddToCart}
                            disabled={isPending}
                        >
                            {t('addToCart')}
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            render={<Link href={`/product/${data.slug}`} />}
                            nativeButton={false}
                            onClick={() => setPreviewOpen(false)}
                        >
                            {t('viewDetails')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
