'use client';

import {useState} from 'react';
import Image from 'next/image';
import {ChevronLeft, ChevronRight, ZoomIn} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';

interface ProductImageCarouselProps {
    images: Array<{
        id: string;
        preview: string;
        source: string;
    }>;
}

export function ProductImageCarousel({images}: ProductImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [zoomOpen, setZoomOpen] = useState(false);

    if (!images || images.length === 0) {
        return (
            <div className="aspect-square bg-muted rounded-xl flex items-center justify-center">
                <span className="text-muted-foreground">No images available</span>
            </div>
        );
    }

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="space-y-4">
            <div
                className="relative aspect-square bg-muted rounded-xl overflow-hidden group cursor-zoom-in"
                onClick={() => setZoomOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setZoomOpen(true)}
                aria-label="Zoom image"
            >
                <Image
                    src={images[currentIndex].source}
                    alt={`Product image ${currentIndex + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority={currentIndex === 0}
                />

                <div className="absolute top-3 right-3 rounded-full bg-background/80 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="size-4" />
                </div>

                {images.length > 1 && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-full size-8 sm:size-9"
                            onClick={e => {
                                e.stopPropagation();
                                goToPrevious();
                            }}
                        >
                            <ChevronLeft className="h-4 sm:h-5 w-4 sm:w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background shadow-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity rounded-full size-8 sm:size-9"
                            onClick={e => {
                                e.stopPropagation();
                                goToNext();
                            }}
                        >
                            <ChevronRight className="h-4 sm:h-5 w-4 sm:w-5" />
                        </Button>
                    </>
                )}

                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                        {currentIndex + 1} / {images.length}
                    </div>
                )}
            </div>

            {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                    {images.map((image, index) => (
                        <button
                            key={image.id}
                            type="button"
                            onClick={() => setCurrentIndex(index)}
                            className={`aspect-square relative rounded-lg overflow-hidden transition-all duration-200 ${
                                index === currentIndex
                                    ? 'ring-2 ring-electric ring-offset-2 scale-105'
                                    : 'ring-1 ring-border hover:ring-muted-foreground opacity-70 hover:opacity-100'
                            }`}
                        >
                            <Image
                                src={image.preview}
                                alt={`Thumbnail ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="25vw"
                            />
                        </button>
                    ))}
                </div>
            )}

            <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
                <DialogContent className="max-w-4xl p-2 sm:p-4">
                    <DialogTitle className="sr-only">Product image zoom</DialogTitle>
                    <div className="relative aspect-square w-full">
                        <Image
                            src={images[currentIndex].source}
                            alt={`Product image ${currentIndex + 1}`}
                            fill
                            className="object-contain"
                            sizes="90vw"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
