'use client';

import {useState} from 'react';
import Image from 'next/image';
import {Price} from '@/components/commerce/price';
import {resolveProductImage} from '@/lib/product-images';
import {getDiscountPercent, getWasPrice} from '@/lib/product-badges';
import type {SerializedProductCard} from '@/lib/product-price';
import {ProductPreviewModal} from '@/components/commerce/product-preview-modal';
import {cn} from '@/lib/utils';

interface DealProductCardProps {
    product: SerializedProductCard;
    className?: string;
}

export function DealProductCard({product, className}: DealProductCardProps) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const discount = getDiscountPercent(product.slug);
    if (discount == null || product.price == null) return null;

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

    return (
        <>
            <div
                onClick={() => setPreviewOpen(true)}
                className={cn(
                    'group flex flex-col shrink-0 w-[9.5rem] sm:w-[11rem] bg-white dark:bg-card rounded-lg p-2.5 hover:shadow-md transition-shadow cursor-pointer select-none border border-border/60',
                    className,
                )}
            >
                <div className="relative aspect-square rounded-md overflow-hidden bg-muted mb-2">
                    <Image
                        src={modalData.imageSrc}
                        alt={product.productName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 120px, 160px"
                    />
                </div>
                <p className="text-[11px] leading-snug line-clamp-2 text-foreground/90 min-h-[2.25rem] mb-1.5">
                    {product.productName}
                </p>
                <p className="text-base font-bold text-foreground leading-tight">
                    <Price value={product.price} currencyCode={product.currencyCode} />
                </p>
                <p className="text-[11px] text-muted-foreground line-through">
                    <Price value={getWasPrice(product.price, discount)} currencyCode={product.currencyCode} />
                </p>
                <span className="mt-1 inline-flex w-fit rounded-sm bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5">
                    -{discount}%
                </span>
            </div>

            {/* Quick Preview Modal on Click */}
            <ProductPreviewModal
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                initialData={modalData}
            />
        </>
    );
}
