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
    Heart,
    MessageSquare,
    Store,
    X,
    Tag,
} from 'lucide-react';
import {cn} from '@/lib/utils';
import type {ProductCardData} from '@/components/commerce/product-card-interactive';
import {COMPANY} from '@/lib/company';

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
    const [wishlistCount, setWishlistCount] = useState(797);
    const [isWishlisted, setIsWishlisted] = useState(false);

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
        customFields?: {
            isDiscounted?: boolean;
            discountPercentage?: number;
            originalPrice?: number;
        };
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

    const toggleWishlist = () => {
        setIsWishlisted(!isWishlisted);
        setWishlistCount(c => (isWishlisted ? c - 1 : c + 1));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                className="w-[96vw] max-w-[1240px] top-3 sm:top-4 md:top-6 left-1/2 -translate-x-1/2 translate-y-0 max-h-[94vh] rounded-2xl md:rounded-3xl p-0 overflow-hidden bg-white dark:bg-card border border-border/80 shadow-2xl relative flex flex-col"
                showCloseButton={false}
            >
                {/* Floating Black Circle Close Button (AliExpress Style) */}
                <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="absolute top-3 right-3 z-50 flex size-8 items-center justify-center rounded-full bg-black/80 hover:bg-black text-white transition-all cursor-pointer shadow-md"
                    aria-label="Close preview"
                >
                    <X className="size-4" />
                </button>

                <DialogHeader className="sr-only">
                    <DialogTitle>{initialData.productName}</DialogTitle>
                    <DialogDescription>AliExpress style product preview modal</DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto p-3.5 sm:p-4 lg:p-5 max-h-[calc(94vh-0.5rem)]">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-6">
                        
                        {/* ======================================================== */}
                        {/* COLUMN 1: AliExpress-style Image Gallery + Zoom (5 cols) */}
                        {/* ======================================================== */}
                        <div className="md:col-span-5 flex flex-row gap-3">
                            {/* Vertical Thumbnail Strip */}
                            {images.length > 1 && (
                                <div className="flex flex-col gap-2 overflow-y-auto max-h-[380px] lg:max-h-[420px] scrollbar-thin shrink-0 pr-0.5">
                                    {images.map((img, i) => (
                                        <button
                                            key={img.id || i}
                                            type="button"
                                            onClick={() => setSelectedImageIndex(i)}
                                            className={cn(
                                                'relative size-14 sm:size-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-muted',
                                                selectedImageIndex === i
                                                    ? 'border-[#e02b2b] ring-2 ring-[#e02b2b]/20 shadow-xs'
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

                            {/* Main Zoomable Image Container */}
                            <div
                                ref={imageContainerRef}
                                onMouseEnter={() => setIsZooming(true)}
                                onMouseLeave={() => setIsZooming(false)}
                                onMouseMove={handleMouseMove}
                                className="relative flex-1 aspect-square rounded-xl overflow-hidden border border-border/80 bg-muted/20 cursor-crosshair group select-none"
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
                                    sizes="(max-width: 768px) 100vw, 480px"
                                    priority
                                />

                                {activeDiscount != null && (
                                    <span className="absolute top-2.5 left-2.5 z-10 rounded-sm bg-[#e02b2b] text-white text-xs font-black px-2 py-0.5 shadow-sm">
                                        -{activeDiscount}% OFF
                                    </span>
                                )}

                                <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full bg-black/65 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 pointer-events-none opacity-80 group-hover:opacity-0 transition-opacity">
                                    <ZoomIn className="size-3.5" />
                                    Hover to Zoom
                                </div>
                            </div>
                        </div>

                        {/* ======================================================== */}
                        {/* COLUMN 2: Product Info, Price & Color Swatches (4 cols) */}
                        {/* ======================================================== */}
                        <div className="md:col-span-4 space-y-3.5 md:border-r md:border-border/60 md:pr-4">
                            {/* Product Title */}
                            <h3 className="font-bold text-sm sm:text-base lg:text-lg text-foreground leading-snug">
                                {initialData.productName}
                            </h3>

                            {/* Sold and Rating stats */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">{sold} sold</span>
                                <span>·</span>
                                <div className="flex items-center gap-1 text-amber-500 font-bold">
                                    <Star className="size-3.5 fill-amber-500" />
                                    <span>{rating.stars}</span>
                                </div>
                                <span>({rating.count} reviews)</span>
                            </div>

                            {/* Big Red AliExpress Price Section */}
                            <div className="space-y-1.5 pt-1">
                                <div className="flex flex-wrap items-baseline gap-2">
                                    <span className="text-2xl sm:text-3xl font-black text-[#e02b2b] tracking-tight">
                                        <Price value={currentPrice} currencyCode={currencyCode} />
                                    </span>
                                    {activeDiscount != null && (
                                        <span className="text-xs font-bold text-[#e02b2b]">
                                            {activeDiscount}% off
                                        </span>
                                    )}
                                    {wasPrice != null && (
                                        <span className="text-xs sm:text-sm text-muted-foreground line-through">
                                            <Price value={wasPrice} currencyCode={currencyCode} />
                                        </span>
                                    )}
                                </div>

                                {/* Wholesale / Super Deal Tag Strip */}
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                    <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-950/60 text-[#e02b2b] font-bold px-1.5 py-0.5 rounded-xs">
                                        <Tag className="size-3" />
                                        Super Deal
                                    </span>
                                    <span className="text-muted-foreground">
                                        Tax included · Free delivery across Rwanda
                                    </span>
                                </div>

                                {discountSavings != null && (
                                    <div className="flex items-center justify-between rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 px-2.5 py-1.5 text-xs text-[#e02b2b] font-bold">
                                        <span>% Save <Price value={discountSavings} currencyCode={currencyCode} /> with instant discount</span>
                                        <span className="text-[11px]">›</span>
                                    </div>
                                )}
                            </div>

                            {/* Color / Variant Swatch Selector */}
                            <div className="space-y-2 pt-2 border-t border-border/60">
                                <div className="text-xs">
                                    <span className="text-muted-foreground">Color / Option: </span>
                                    <span className="font-bold text-foreground">
                                        {selectedVariant?.name || 'Standard'}
                                    </span>
                                </div>

                                {detail?.variants && detail.variants.length > 1 ? (
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
                                                        'relative p-1 rounded-lg border-2 transition-all cursor-pointer bg-card',
                                                        active
                                                            ? 'border-[#e02b2b] ring-2 ring-[#e02b2b]/20 shadow-xs'
                                                            : 'border-border/80 hover:border-foreground/50 opacity-80 hover:opacity-100',
                                                    )}
                                                    title={v.name}
                                                >
                                                    <div className="relative size-10 rounded-md overflow-hidden bg-muted">
                                                        <Image
                                                            src={swatchImg}
                                                            alt={v.name}
                                                            fill
                                                            className="object-cover"
                                                            sizes="40px"
                                                        />
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="relative size-10 rounded-lg overflow-hidden border-2 border-[#e02b2b] bg-muted">
                                            <Image
                                                src={initialData.imageSrc}
                                                alt=""
                                                fill
                                                className="object-cover"
                                                sizes="40px"
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground">Standard Edition</span>
                                    </div>
                                )}
                            </div>

                            {/* Product Short Description */}
                            {detail?.description && (
                                <div className="pt-2 border-t border-border/60">
                                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                        {detail.description.replace(/<[^>]*>?/gm, '')}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* ======================================================== */}
                        {/* COLUMN 3: Store Info, Shipping & Action Buttons (3 cols) */}
                        {/* ======================================================== */}
                        <div className="md:col-span-3 flex flex-col justify-between space-y-4">
                            <div className="space-y-3.5">
                                {/* Sold By Store Card */}
                                <div className="space-y-1 pb-3 border-b border-border/60">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Sold By</span>
                                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                            <MessageSquare className="size-3" />
                                            Message
                                        </span>
                                    </div>
                                    <p className="font-bold text-xs sm:text-sm text-foreground truncate">
                                        {COMPANY.legalName}
                                    </p>
                                </div>

                                {/* Service Commitment Section (Green Header AliExpress Style) */}
                                <div className="space-y-2 text-xs">
                                    <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                        Service commitment
                                    </p>
                                    
                                    <div className="space-y-2 text-muted-foreground">
                                        <div className="flex items-start gap-2">
                                            <Truck className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-foreground text-xs">Shipping: Free Delivery</p>
                                                <p className="text-[11px]">Delivery: Fast 2-Hour in Kigali</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <RotateCcw className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-foreground text-xs">Return & refund policy</p>
                                                <p className="text-[11px]">7-day easy returns & exchanges</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2">
                                            <ShieldCheck className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-foreground text-xs">Security & Privacy</p>
                                                <p className="text-[11px] leading-tight">Safe payments · Protect your privacy</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quantity Selector */}
                                <div className="space-y-1.5 pt-2 border-t border-border/60">
                                    <span className="text-xs font-semibold text-foreground">Quantity</span>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center border border-border rounded-lg bg-card overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                disabled={quantity <= 1}
                                                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus className="size-3.5" />
                                            </button>
                                            <span className="w-8 text-center text-xs font-bold text-foreground tabular-nums">
                                                {quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(q => q + 1)}
                                                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                aria-label="Increase quantity"
                                            >
                                                <Plus className="size-3.5" />
                                            </button>
                                        </div>
                                        <span className="text-[11px] text-muted-foreground">
                                            500+ available
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons: Add to cart & Buy now */}
                            <div className="space-y-2 pt-2 border-t border-border/60">
                                {/* Solid Red Add to Cart Button */}
                                <Button
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={isPending || isBuyNowPending}
                                    className="w-full bg-[#e02b2b] hover:bg-[#c82020] text-white font-bold h-11 rounded-xl shadow-xs text-sm transition-all cursor-pointer"
                                >
                                    {isPending ? (
                                        <Loader2 className="size-4 animate-spin mr-1.5" />
                                    ) : (
                                        <ShoppingCart className="size-4 mr-1.5" />
                                    )}
                                    Add to cart
                                </Button>

                                {/* Amber/Orange Buy Now Button */}
                                <Button
                                    type="button"
                                    onClick={handleBuyNow}
                                    disabled={isPending || isBuyNowPending}
                                    className="w-full bg-[#ff9900] hover:bg-[#e68a00] text-black font-bold h-11 rounded-xl shadow-xs text-sm transition-all cursor-pointer"
                                >
                                    {isBuyNowPending ? (
                                        <Loader2 className="size-4 animate-spin mr-1.5" />
                                    ) : (
                                        <Zap className="size-4 mr-1.5 fill-current" />
                                    )}
                                    Buy now
                                </Button>

                                {/* Bottom auxiliary actions: View details pill + Wishlist pill */}
                                <div className="grid grid-cols-12 gap-2 pt-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="col-span-8 text-xs font-semibold h-9 rounded-lg border-border"
                                        render={<Link href={`/product/${initialData.slug}`} onClick={() => onOpenChange(false)} />}
                                        nativeButton={false}
                                    >
                                        <span>View details</span>
                                        <ExternalLink className="size-3 ml-1" />
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleWishlist}
                                        className={cn(
                                            'col-span-4 text-xs font-semibold h-9 rounded-lg border-border transition-colors gap-1',
                                            isWishlisted ? 'text-red-500 border-red-200 bg-red-50/50' : 'text-muted-foreground',
                                        )}
                                    >
                                        <Heart className={cn('size-3.5', isWishlisted && 'fill-red-500 text-red-500')} />
                                        <span>{wishlistCount}</span>
                                    </Button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
