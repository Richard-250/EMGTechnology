'use client';

import {useState, useEffect, useMemo, useTransition, useRef} from 'react';
import {createPortal} from 'react-dom';
import Image from 'next/image';
import {useRouter, Link} from '@/i18n/navigation';
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
    const [mounted, setMounted] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isBuyNowPending, startBuyNowTransition] = useTransition();
    const [wishlistCount, setWishlistCount] = useState(797);
    const [isWishlisted, setIsWishlisted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onOpenChange(false);
        };
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onOpenChange]);

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

    if (!open || !mounted) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/75 backdrop-blur-xs p-2 sm:p-4 pt-2 sm:pt-4 md:pt-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onOpenChange(false);
            }}
            role="dialog"
            aria-modal="true"
            aria-label={initialData.productName}
        >
            <div 
                className="relative w-full max-w-[1240px] rounded-2xl md:rounded-3xl p-0 bg-white dark:bg-card border border-border/80 shadow-2xl overflow-hidden flex flex-col my-1 sm:my-2 animate-in fade-in-0 zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
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

                <div className="overflow-y-auto p-3.5 sm:p-4 lg:p-5 max-h-[calc(96vh-1rem)]">
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
                                                'relative size-12 sm:size-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 bg-muted',
                                                selectedImageIndex === i
                                                    ? 'border-foreground shadow-sm ring-1 ring-foreground'
                                                    : 'border-transparent opacity-70 hover:opacity-100',
                                            )}
                                        >
                                            <Image
                                                src={img.preview}
                                                alt={`Thumbnail ${i + 1}`}
                                                fill
                                                className="object-cover"
                                                sizes="56px"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Main Active Image with Zoom Lens */}
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
                                    <span>Hover to Zoom</span>
                                </div>
                            </div>
                        </div>

                        {/* ======================================================== */}
                        {/* COLUMN 2: Center Pricing, Details & Swatches (4 cols)    */}
                        {/* ======================================================== */}
                        <div className="md:col-span-4 flex flex-col space-y-3.5">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-foreground leading-snug">
                                    {initialData.productName}
                                </h2>

                                <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
                                    <span className="text-foreground/80 font-semibold">
                                        {sold.toLocaleString()} sold
                                    </span>
                                    <span className="text-muted-foreground">·</span>
                                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                                        <Star className="size-3.5 fill-amber-500 text-amber-500" />
                                        <span>{rating.stars}</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                        ({rating.count} reviews)
                                    </span>
                                </div>
                            </div>

                            {/* Price Block */}
                            <div className="rounded-xl bg-electric/10 dark:bg-electric/15 border border-electric/25 p-3 space-y-1">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-electric">
                                        <Price
                                            value={currentPrice}
                                            currencyCode={currencyCode}
                                        />
                                    </span>
                                    {activeDiscount != null && wasPrice != null && (
                                        <>
                                            <span className="text-xs font-bold text-electric bg-electric/15 px-1.5 py-0.5 rounded">
                                                {activeDiscount}% off
                                            </span>
                                            <span className="text-xs text-muted-foreground line-through">
                                                <Price
                                                    value={wasPrice}
                                                    currencyCode={currencyCode}
                                                />
                                            </span>
                                        </>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                                    <span className="inline-flex items-center gap-1 text-electric font-bold text-[10px] bg-electric/15 px-1.5 py-0.5 rounded-sm">
                                        <Tag className="size-2.5" />
                                        Super Deal
                                    </span>
                                    <span>Tax included · Free delivery across Rwanda</span>
                                </div>

                                {/* Instant coupon banner */}
                                {discountSavings != null && (
                                    <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-electric bg-electric/10 px-2 py-1 rounded-md">
                                        <span>% Save <Price value={discountSavings} currencyCode={currencyCode} /> with Instant discount</span>
                                        <span className="text-[10px] underline cursor-pointer">&gt;</span>
                                    </div>
                                )}
                            </div>

                            {/* Color / Variant Swatch Selector */}
                            <div className="space-y-2 pt-2 border-t border-border/60">
                                <div className="text-xs">
                                    <span className="text-muted-foreground">Color / Option: </span>
                                    <span className="font-bold text-foreground">
                                        {selectedVariant?.name || 'Standard Edition'}
                                    </span>
                                </div>

                                {loadingDetail ? (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>Loading options...</span>
                                    </div>
                                ) : detail?.variants && detail.variants.length > 1 ? (
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
                                                            ? 'border-foreground ring-2 ring-foreground/20 shadow-xs'
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
                                        <div className="size-9 rounded-lg border-2 border-foreground overflow-hidden relative bg-muted shadow-xs">
                                            <Image
                                                src={initialData.imageSrc}
                                                alt={initialData.productName}
                                                fill
                                                className="object-cover"
                                                sizes="36px"
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground">
                                            Standard Edition
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Short Specifications / Description */}
                            <div className="text-xs text-muted-foreground line-clamp-3 leading-relaxed pt-1 border-t border-border/60">
                                {detail?.description?.replace(/<[^>]*>?/gm, '') ||
                                    'Heavy-duty commercial and home fitness training equipment by EMG Technology.'}
                            </div>
                        </div>

                        {/* ======================================================== */}
                        {/* COLUMN 3: Right Sidebar - Commitments & Buy Box (3 cols)  */}
                        {/* ======================================================== */}
                        <div className="md:col-span-3 flex flex-col justify-between space-y-4 md:border-l md:border-border/60 md:pl-4">
                            <div className="space-y-3.5">
                                {/* Seller info */}
                                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                                    <div>
                                        <p className="text-[11px] text-muted-foreground">Sold By</p>
                                        <p className="text-xs font-bold text-foreground flex items-center gap-1">
                                            <span>EMG Technology Ltd</span>
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onOpenChange(false);
                                            router.push('/search');
                                        }}
                                        className="text-[11px] font-semibold text-electric hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        <MessageSquare className="size-3" />
                                        <span>Message</span>
                                    </button>
                                </div>

                                {/* Service Commitments */}
                                <div className="space-y-2.5 text-xs">
                                    <p className="text-xs font-bold text-foreground">Service commitment</p>
                                    
                                    <div className="flex items-start gap-2 text-muted-foreground">
                                        <Truck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-foreground text-xs leading-tight">
                                                Shipping: Free Delivery
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                Delivery: Fast 2-Hour in Kigali
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2 text-muted-foreground">
                                        <RotateCcw className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-foreground text-xs leading-tight">
                                                Return & refund policy
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                7-day easy returns & exchanges
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2 text-muted-foreground">
                                        <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-foreground text-xs leading-tight">
                                                Security & Privacy
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                Safe payments · Protect your privacy
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Quantity Selector */}
                                <div className="pt-2 border-t border-border/60 space-y-1.5">
                                    <label className="text-xs font-bold text-foreground">Quantity</label>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center border border-border rounded-lg bg-muted/30 overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                                disabled={quantity <= 1}
                                                className="p-1.5 hover:bg-muted text-foreground disabled:opacity-30 cursor-pointer transition-colors"
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus className="size-3.5" />
                                            </button>
                                            <span className="w-9 text-center text-xs font-bold text-foreground select-none">
                                                {quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setQuantity(q => Math.min(99, q + 1))}
                                                className="p-1.5 hover:bg-muted text-foreground cursor-pointer transition-colors"
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

                            {/* Action Buttons (Buy Now & Add to Cart) */}
                            <div className="space-y-2 pt-2 border-t border-border/60">
                                <Button
                                    type="button"
                                    onClick={handleBuyNow}
                                    disabled={isBuyNowPending || isPending}
                                    className="w-full h-10 font-bold text-sm bg-electric hover:bg-electric/90 text-electric-foreground rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {isBuyNowPending ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="size-4 fill-current" />
                                            <span>Buy Now</span>
                                        </>
                                    )}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAddToCart}
                                    disabled={isPending || isBuyNowPending}
                                    className="w-full h-10 font-bold text-sm border-2 border-electric/40 text-electric hover:bg-electric/10 rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Adding...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className="size-4" />
                                            <span>Add to Cart</span>
                                        </>
                                    )}
                                </Button>

                                <div className="grid grid-cols-12 gap-1.5 pt-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="col-span-8 text-xs font-semibold h-9 rounded-lg hover:bg-muted text-foreground"
                                        render={<Link href={`/product/${initialData.slug}`} onClick={() => onOpenChange(false)} />}
                                        nativeButton={false}
                                    >
                                        <span>View details</span>
                                        <ExternalLink className="size-3 ml-1" />
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={toggleWishlist}
                                        className={cn(
                                            'col-span-4 text-xs font-semibold h-9 rounded-lg hover:bg-muted transition-colors gap-1',
                                            isWishlisted ? 'text-red-500' : 'text-muted-foreground',
                                        )}
                                    >
                                        <Heart className={cn('size-3.5', isWishlisted && 'fill-red-500')} />
                                        <span>{wishlistCount}</span>
                                    </Button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
