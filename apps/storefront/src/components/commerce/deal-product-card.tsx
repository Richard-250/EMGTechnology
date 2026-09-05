'use client';

import {useState} from 'react';
import Image from 'next/image';
import {Link} from '@/i18n/navigation';
import {Eye} from 'lucide-react';
import {Price} from '@/components/commerce/price';
import {resolveProductImage} from '@/lib/product-images';
import {resolveDealDiscount, type DealProductCardData} from '@/lib/discount-display';
import {ProductPreviewModal} from '@/components/commerce/product-preview-modal';
import {cn} from '@/lib/utils';

interface DealProductCardProps {
    product: DealProductCardData;
    className?: string;
}

export function DealProductCard({product, className}: DealProductCardProps) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const {discountLabel, wasPrice, hasDiscount} = resolveDealDiscount(product);

    if (product.price == null) return null;

    const modalData = {
        productId: product.productId,
        productVariantId: product.productVariantId,
        productName: product.productName,
        slug: product.slug,
        imageSrc: resolveProductImage(product.image, product.slug),
        currencyCode: product.currencyCode,
        price: product.price,
        priceMin: product.priceMin,
        priceMax: product.priceMax,
        isPriceRange: false,
    };

    const handleOpenPreview = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setPreviewOpen(true);
    };

    return (
        <>
            <div
                className={cn(
                    'group relative flex flex-col shrink-0 w-[9.5rem] sm:w-[11rem] bg-white dark:bg-card rounded-lg p-2.5 hover:shadow-md transition-shadow select-none border border-border/60',
                    className,
                )}
            >
                <Link href={`/product/${product.slug}`} className="block">
                    <div className="relative aspect-square rounded-md overflow-hidden bg-muted mb-2">
                        <button
                            type="button"
                            onClick={handleOpenPreview}
                            className={cn(
                                'absolute top-1.5 right-1.5 z-20 flex items-center justify-center size-6.5 rounded-full bg-black/75 hover:bg-black text-white text-[10px] shadow-md transition-all duration-200 cursor-pointer active:scale-95 lg:hidden',
                                'opacity-90',
                            )}
                            aria-label="Preview"
                        >
                            <Eye className="size-3.5" />
                        </button>

                        <Image
                            src={modalData.imageSrc}
                            alt={product.productName}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 120px, 160px"
                        />
                    </div>
                    <p className="text-[11px] leading-snug line-clamp-2 text-foreground/90 group-hover:text-electric transition-colors min-h-[2.25rem] mb-1.5">
                        {product.productName}
                    </p>
                    <p className="text-base font-bold text-foreground leading-tight">
                        <Price value={product.price} currencyCode={product.currencyCode} />
                    </p>
                    {hasDiscount && wasPrice != null && (
                        <p className="text-[11px] text-muted-foreground line-through">
                            <Price value={wasPrice} currencyCode={product.currencyCode} />
                        </p>
                    )}
                    {hasDiscount && discountLabel && (
                        <span className="mt-1 inline-flex w-fit rounded-sm bg-electric text-electric-foreground text-[10px] font-bold px-1.5 py-0.5">
                            {discountLabel}
                        </span>
                    )}
                </Link>
            </div>

            <ProductPreviewModal
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                initialData={modalData}
            />
        </>
    );
}
