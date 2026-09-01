'use client';

import {useState, useEffect, useMemo, useTransition, useRef} from 'react';
import Image from 'next/image';
import {useRouter, Link} from '@/i18n/navigation';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {Price} from '@/components/commerce/price';
import {ProductStarRating} from '@/components/commerce/product-star-rating';
import {
    getDiscountPercent,
    getProductRating,
    getSoldCount,
    getWasPrice,
} from '@/lib/product-badges';
import {addToCart, fetchProductDetail} from '@/app/[locale]/product/[slug]/actions';
import {useCartConfirmation} from '@/components/commerce/cart-confirmation-provider';
import {toast} from 'sonner';
import {
    ShoppingCart,
    Zap,
    Minus,
    Plus,
    Check,
    Truck,
    RotateCcw,
    ShieldCheck,
    Star,
    ExternalLink,
    Loader2,
    ZoomIn,
} from 'lucide-react';
import {cn} from '@/lib/utils';
import type {ProductCardData} from '@/components/commerce/product-card-interactive';

interface ProductPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData: ProductCardData;
}

export function ProductPreviewModal({
    open,
    onOpenChange,
    initialData,
}: ProductPreviewModalProps) {
    const router = useRouter();
    const {showConfirmation} = useCartConfirmation();
    const [isPending, startTransition] = useTransition();
    const [isBuyNowPending, startBuyNowTransition] = useTransition();

    // Full product detail state
    const [detail, setDetail] = useState<{
        id: string;
        name: string;
        slug: string;
        description: string;
        images: Array<{ id: string; preview: string }>;
        variants: Array<{
            id: string;
            name: string;
            sku: string;
            priceWithTax: number;
            stockLevel: string;
            options: Array<{ id: string; name: string; code: string }>;
        }>;
        optionGroups: Array<{
            id: string;
            name: string;
            options: Array<{ id: string; name: string; code: string }>;
        }>;
        currencyCode: string;
    } | null>(null);

    const [loadingDetail, setLoadingDetail] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [selectedVariantId, setSelectedVariantId] = useState<string>(initialData.productVariantId);
    const [quantity, setQuantity] = useState(1);

    // Zoom state
    const [isZooming, setIsZooming] = useState(false);
    const [zoomPos, setZoomPos] = useState({x: 50, y: 50});
    const imageContainerRef = useRef<HTMLDivElement>(null);

    // Badges & rating
    const rating = getProductRating(initialData.slug);
    const sold = getSoldCount(initialData.slug);
    const discount = getDiscountPercent(initialData.slug);

    // Fetch full product details on modal open
    useEffect(() => {
        if (!open) return;
        let active = true;
        setLoadingDetail(true);

        fetchProductDetail(initialData.slug).then(data => {
            if (active && data) {
                setDetail(data);
                if (data.variants.length > 0) {
                    setSelectedVariantId(data.variants[0].id);
                }
            }
            if (active) setLoadingDetail(false);
        });

        return () => {
            active = false;
        };
    }, [open, initialData.slug]);

    // Active images
    const images = useMemo(() => {
        if (detail?.images?.length) return detail.images;
        return [{id: '1', preview: initialData.imageSrc}];
    }, [detail, initialData.imageSrc]);

    const activeImage = images[selectedImageIndex] || images[0];

    // Selected variant
    const selectedVariant = useMemo(() => {
        if (!detail?.variants?.length) return null;
        return detail.variants.find(v => v.id === selectedVariantId) || detail.variants[0];
    }, [detail, selectedVariantId]);

    const currentPrice = selectedVariant?.priceWithTax ?? initialData.price ?? 0;
    const currencyCode = detail?.currencyCode || initialData.currencyCode;
    
    // Dynamic discount from admin customFields or fallback
    const activeDiscount = useMemo(() => {
        const cf = (detail as any)?.customFields;
        if (typeof cf?.discountPercentage === 'number' && cf.discountPercentage > 0) {
            return cf.discountPercentage;
        }
        return discount;
    }, [detail, discount]);

    const wasPrice = useMemo(() => {
        const cf = (detail as any)?.customFields;
        if (typeof cf?.originalPrice === 'number' && cf.originalPrice > 0) {
            return cf.originalPrice * 100;
        }
        return activeDiscount != null && currentPrice > 0 ? getWasPrice(currentPrice, activeDiscount) : null;
    }, [detail, activeDiscount, currentPrice]);

    const discountSavings = wasPrice != null ? wasPrice - currentPrice : null;

    // Handle mouse move for interactive zoom lens
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageContainerRef.current) return;
        const {left, top, width, height} = imageContainerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
        setZoomPos({x, y});
    };

    // Add to cart action (stays on page)
    const handleAddToCart = () => {
        const variantId = selectedVariant?.id || initialData.productVariantId;
        if (!variantId) {
            toast.error('Unable to add item to cart');
            return;
        }

        startTransition(async () => {
            const result = await addToCart(variantId, quantity);
            if (result.success && result.order) {
                showConfirmation(
                    {
                        name: initialData.productName,
                        slug: initialData.slug,
                        image: activeImage.preview,
                        quantity,
                        unitPrice: currentPrice,
                        currencyCode,
                    },
                    result.order.totalQuantity,
                );
                toast.success('Added to cart!', {
                    description: `${initialData.productName} (x${quantity})`,
                });
                onOpenChange(false);
            } else {
                toast.error(result.error || 'Failed to add item to cart');
            }
        });
    };

    // Buy Now action (immediately navigates to checkout/cart)
    const handleBuyNow = () => {
        const variantId = selectedVariant?.id || initialData.productVariantId;
        if (!variantId) {
            toast.error('Unable to proceed with order');
            return;
        }

        startBuyNowTransition(async () => {
            const result = await addToCart(variantId, quantity);
            if (result.success && result.order) {
                onOpenChange(false);
                router.push('/cart');
            } else {
                toast.error(result.error || 'Failed to proceed to checkout');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-screen !rounded-none p-0 overflow-hidden border-0 bg-background flex flex-col" showCloseButton={true}>
                <DialogHeader className="sr-only">
                    <DialogTitle>{initialData.productName}</DialogTitle>
                    <DialogDescription>Quick preview and instant purchase</DialogDescription>
                </DialogHeader>

                {/* Visible top header bar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 bg-background/95 backdrop-blur-sm shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Quick Preview
                        </span>
                        <h2 className="font-bold text-sm sm:text-base text-foreground truncate">{initialData.productName}</h2>
                    </div>
                    <Link
                        href={`/product/${initialData.slug}`}
                        onClick={() => onOpenChange(false)}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium hover:underline transition-colors shrink-0"
                    >
                        <ExternalLink className="size-3.5" />
                        <span className="hidden sm:inline">Full Details</span>
                    </Link>
                </div>

                <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2" style={{height: 'calc(100vh - 53px)'}}>
                        {/* LEFT COLUMN: Full-height Image Gallery + Interactive Zoom */}
                        <div className="flex flex-row gap-3 p-4 lg:p-6 bg-muted/20 border-r border-border/50">
                            {/* Vertical Thumbnail Strip */}
                            {images.length > 1 && (
                                <div className="flex flex-col gap-2 overflow-y-auto max-h-full scrollbar-thin shrink-0">
                                    {images.map((img, i) => (
                                        <button
                                            key={img.id || i}
                                            type="button"
                                            onClick={() => setSelectedImageIndex(i)}
                                            className={cn(
                                                'relative size-16 lg:size-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-muted',
                                                selectedImageIndex === i
                                                    ? 'border-red-500 dark:border-red-400 ring-2 ring-red-500/20'
                                                    : 'border-border/70 hover:border-foreground/40 opacity-75 hover:opacity-100',
                                            )}
                                        >
                                            <Image
                                                src={img.preview}
                                                alt=""
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Main Zoomable Image Box */}
                            <div
                                ref={imageContainerRef}
                                onMouseEnter={() => setIsZooming(true)}
                                onMouseLeave={() => setIsZooming(false)}
                                onMouseMove={handleMouseMove}
                                className="relative flex-1 aspect-square rounded-2xl overflow-hidden border border-border/80 bg-muted/30 cursor-crosshair group select-none"
                            >
                                <Image
                                    src={activeImage.preview}
                                    alt={initialData.productName}
                                    fill
                                    className={cn(
                                        'object-cover transition-transform duration-100',
                                        isZooming ? 'scale-[2.2]' : 'scale-100',
                                    )}
                                    style={
                                        isZooming
                                            ? {
                                                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                                              }
                                            : undefined
                                    }
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    priority
                                />

                                {discount != null && (
                                    <span className="absolute top-3 left-3 z-10 rounded-md bg-red-600 text-white text-xs font-extrabold px-2.5 py-1 shadow-md">
                                        -{discount}% OFF
                                    </span>
                                )}

                                <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 pointer-events-none opacity-80 group-hover:opacity-0 transition-opacity">
                                    <ZoomIn className="size-3.5" />
                                    Hover to Zoom
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Product Details, Color Swatches & Action Buttons */}
                        <div className="flex flex-col h-full overflow-y-auto">
                            <div className="flex-1 space-y-4 p-5 lg:p-7">
                                {/* Title */}
                                <h3 className="font-bold text-xl sm:text-2xl lg:text-3xl text-foreground leading-snug">
                                    {initialData.productName}
                                </h3>

                                {/* Rating & Sold Stats */}
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">
                                        <Star className="size-3.5 fill-amber-500" />
                                        <span>{rating.stars}</span>
                                    </div>
                                    <span>·</span>
                                    <span className="font-medium">{rating.count} Reviews</span>
                                    <span>·</span>
                                    <span className="font-medium text-foreground">{sold} sold</span>
                                </div>

                                {/* Large Price Banner */}
                                <div className="rounded-xl bg-muted/40 p-3.5 border border-border/60 space-y-1.5">
                                    <div className="flex items-baseline gap-2.5">
                                        <span className="text-3xl sm:text-4xl font-extrabold text-red-600 dark:text-red-500 tracking-tight">
                                            <Price value={currentPrice} currencyCode={currencyCode} />
                                        </span>
                                        {wasPrice != null && (
                                            <span className="text-sm sm:text-base text-muted-foreground line-through font-medium">
                                                <Price value={wasPrice} currencyCode={currencyCode} />
                                            </span>
                                        )}
                                    </div>

                                    {discountSavings != null && (
                                        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 px-2.5 py-1 rounded-md">
                                            <span>%</span>
                                            <span>
                                                Save <Price value={discountSavings} currencyCode={currencyCode} /> with Super Deal
                                            </span>
                                        </div>
                                    )}

                                    <p className="text-[11px] text-muted-foreground">
                                        Tax included · Free delivery across Rwanda
                                    </p>
                                </div>

                                {/* Color / Variant Swatch Selector */}
                                {detail?.variants && detail.variants.length > 1 && (
                                    <div className="space-y-2 pt-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-foreground">
                                                Color / Option:{' '}
                                                <span className="text-muted-foreground font-normal">
                                                    {selectedVariant?.name || 'Selected'}
                                                </span>
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {detail.variants.map((v, idx) => {
                                                const active = selectedVariantId === v.id;
                                                const swatchImg = images[idx % images.length]?.preview || initialData.imageSrc;
                                                return (
                                                    <button
                                                        key={v.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedVariantId(v.id);
                                                            setSelectedImageIndex(idx % images.length);
                                                        }}
                                                        className={cn(
                                                            'flex items-center gap-2 p-1.5 pr-3 rounded-xl border-2 transition-all cursor-pointer bg-card text-xs font-medium',
                                                            active
                                                                ? 'border-red-600 dark:border-red-500 bg-red-50/50 dark:bg-red-950/20 shadow-xs'
                                                                : 'border-border/80 hover:border-foreground/40 hover:bg-muted/40',
                                                        )}
                                                    >
                                                        <div className="relative size-8 rounded-lg overflow-hidden shrink-0 border border-border/60 bg-muted">
                                                            <Image
                                                                src={swatchImg}
                                                                alt=""
                                                                fill
                                                                className="object-cover"
                                                                sizes="32px"
                                                            />
                                                        </div>
                                                        <span className="truncate max-w-[110px]">{v.name}</span>
                                                        {active && <Check className="size-3.5 text-red-600 ml-auto shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Quantity Control */}
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-xs font-semibold text-foreground">Quantity</span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center border border-border rounded-xl bg-card overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                disabled={quantity <= 1}
                                                className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus className="size-3.5" />
                                            </button>
                                            <span className="w-9 text-center text-sm font-bold text-foreground tabular-nums">
                                                {quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(q => q + 1)}
                                                className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                aria-label="Increase quantity"
                                            >
                                                <Plus className="size-3.5" />
                                            </button>
                                        </div>
                                        <span className="text-xs text-muted-foreground font-medium">
                                            500+ available in stock
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* CTAs: Add to Cart & Buy Now — sticky at bottom */}
                            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border/60 space-y-2.5 p-5 lg:p-7">
                                <div className="grid grid-cols-2 gap-2.5">
                                    {/* Add to Cart Button */}
                                    <Button
                                        type="button"
                                        onClick={handleAddToCart}
                                        disabled={isPending || isBuyNowPending}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-5 rounded-xl shadow-xs text-sm transition-all"
                                    >
                                        {isPending ? (
                                            <Loader2 className="size-4 animate-spin mr-1.5" />
                                        ) : (
                                            <ShoppingCart className="size-4 mr-1.5" />
                                        )}
                                        Add to cart
                                    </Button>

                                    {/* Buy Now Button (Direct Checkout) */}
                                    <Button
                                        type="button"
                                        onClick={handleBuyNow}
                                        disabled={isPending || isBuyNowPending}
                                        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-5 rounded-xl shadow-xs text-sm transition-all"
                                    >
                                        {isBuyNowPending ? (
                                            <Loader2 className="size-4 animate-spin mr-1.5" />
                                        ) : (
                                            <Zap className="size-4 mr-1.5 fill-current" />
                                        )}
                                        Buy now
                                    </Button>
                                </div>

                                <div className="flex items-center justify-center gap-4 pt-1">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <Truck className="size-3.5 text-emerald-600" />
                                        Fast 2-Hour Delivery in Kigali
                                    </span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <ShieldCheck className="size-3.5 text-emerald-600" />
                                        100% Secure Checkout
                                    </span>
                                </div>
                            </div>
                        </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
