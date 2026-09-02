'use client';

import {useRef, useState} from 'react';
import Image from 'next/image';
import {ZoomIn} from 'lucide-react';
import {cn} from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';

interface ProductDetailGalleryProps {
    images: Array<{id: string; preview: string; source: string}>;
    productName: string;
    discountLabel?: string | null;
}

export function ProductDetailGallery({images, productName, discountLabel}: ProductDetailGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isZooming, setIsZooming] = useState(false);
    const [zoomPos, setZoomPos] = useState({x: 50, y: 50});
    const [zoomOpen, setZoomOpen] = useState(false);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    if (!images.length) {
        return (
            <div className="aspect-square bg-muted rounded-xl flex items-center justify-center">
                <span className="text-muted-foreground text-sm">No images available</span>
            </div>
        );
    }

    const activeImage = images[selectedIndex] ?? images[0];

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!imageContainerRef.current) return;
        const {left, top, width, height} = imageContainerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((event.clientX - left) / width) * 100));
        const y = Math.max(0, Math.min(100, ((event.clientY - top) / height) * 100));
        setZoomPos({x, y});
    };

    return (
        <>
            <div className="flex flex-row gap-3">
                {images.length > 1 && (
                    <div className="hidden sm:flex flex-col gap-2 overflow-y-auto max-h-[420px] lg:max-h-[480px] shrink-0 pr-0.5">
                        {images.map((image, index) => (
                            <button
                                key={image.id}
                                type="button"
                                onClick={() => setSelectedIndex(index)}
                                className={cn(
                                    'relative size-14 lg:size-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 bg-muted',
                                    selectedIndex === index
                                        ? 'border-foreground ring-1 ring-foreground shadow-sm'
                                        : 'border-transparent opacity-70 hover:opacity-100',
                                )}
                            >
                                <Image
                                    src={image.preview}
                                    alt={`${productName} thumbnail ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                />
                            </button>
                        ))}
                    </div>
                )}

                <div
                    ref={imageContainerRef}
                    onMouseEnter={() => setIsZooming(true)}
                    onMouseLeave={() => setIsZooming(false)}
                    onMouseMove={handleMouseMove}
                    onClick={() => setZoomOpen(true)}
                    className="relative flex-1 aspect-square rounded-xl overflow-hidden border border-border/80 bg-muted/20 cursor-crosshair group select-none"
                >
                    <Image
                        src={activeImage.source}
                        alt={productName}
                        fill
                        className={cn(
                            'object-cover transition-transform duration-100',
                            isZooming ? 'scale-[2.2]' : 'scale-100',
                        )}
                        style={
                            isZooming
                                ? {transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`}
                                : undefined
                        }
                        sizes="(max-width: 768px) 100vw, 480px"
                        priority
                    />

                    {discountLabel && (
                        <span className="absolute top-2.5 left-2.5 z-10 rounded-sm bg-[#e02b2b] text-white text-xs font-black px-2 py-0.5 shadow-sm">
                            {discountLabel}
                        </span>
                    )}

                    <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 rounded-full bg-black/65 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 pointer-events-none opacity-80 group-hover:opacity-0 transition-opacity">
                        <ZoomIn className="size-3.5" />
                        <span>Hover to zoom</span>
                    </div>
                </div>
            </div>

            {images.length > 1 && (
                <div className="sm:hidden grid grid-cols-5 gap-2 mt-3">
                    {images.map((image, index) => (
                        <button
                            key={image.id}
                            type="button"
                            onClick={() => setSelectedIndex(index)}
                            className={cn(
                                'relative aspect-square rounded-md overflow-hidden border-2',
                                selectedIndex === index ? 'border-foreground' : 'border-border opacity-70',
                            )}
                        >
                            <Image src={image.preview} alt="" fill className="object-cover" sizes="20vw" />
                        </button>
                    ))}
                </div>
            )}

            <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
                <DialogContent className="max-w-4xl p-2 sm:p-4">
                    <DialogTitle className="sr-only">{productName}</DialogTitle>
                    <div className="relative aspect-square w-full">
                        <Image
                            src={activeImage.source}
                            alt={productName}
                            fill
                            className="object-contain"
                            sizes="90vw"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
