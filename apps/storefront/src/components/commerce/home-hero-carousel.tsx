'use client';

import {useCallback, useEffect, useState} from 'react';
import Image from 'next/image';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {STORE_IMAGES} from '@/lib/store-images';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';

interface Slide {
    image: string;
    href: string;
    title: string;
    subtitle: string;
    cta: string;
}

interface HomeHeroCarouselProps {
    slides: Slide[];
}

export function HomeHeroCarousel({slides}: HomeHeroCarouselProps) {
    const [index, setIndex] = useState(0);

    const next = useCallback(() => {
        setIndex(i => (i + 1) % slides.length);
    }, [slides.length]);

    const prev = useCallback(() => {
        setIndex(i => (i === 0 ? slides.length - 1 : i - 1));
    }, [slides.length]);

    useEffect(() => {
        const timer = setInterval(next, 6000);
        return () => clearInterval(timer);
    }, [next]);

    if (!slides.length) return null;

    const slide = slides[index];

    return (
        <section className="bg-muted/30 border-b border-border">
            <div className="container mx-auto px-4 py-4 md:py-6">
                <div className="grid lg:grid-cols-[1fr_280px] gap-4">
                    <div className="relative aspect-[16/11] sm:aspect-[2/1] md:aspect-[2.8/1] min-h-[230px] rounded-lg overflow-hidden group">
                        <Image
                            src={slide.image}
                            alt=""
                            fill
                            className="object-cover transition-opacity duration-500"
                            sizes="(max-width: 1024px) 100vw, 70vw"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
                        <div className="absolute inset-0 flex flex-col justify-center px-4 sm:px-6 md:px-10 max-w-lg text-white">
                            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl tracking-wide mb-1.5 md:mb-2">{slide.title}</h2>
                            <p className="text-xs sm:text-sm md:text-base text-white/90 mb-3 md:mb-4 line-clamp-2">{slide.subtitle}</p>
                            <Link
                                href={slide.href}
                                className="inline-flex w-fit items-center rounded-full bg-electric hover:bg-electric/90 text-electric-foreground px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-colors"
                            >
                                {slide.cta}
                            </Link>
                        </div>

                        {slides.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity size-8 sm:size-9"
                                    onClick={prev}
                                    aria-label="Previous slide"
                                >
                                    <ChevronLeft className="size-4 sm:size-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity size-8 sm:size-9"
                                    onClick={next}
                                    aria-label="Next slide"
                                >
                                    <ChevronRight className="size-4 sm:size-5" />
                                </Button>
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {slides.map((_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setIndex(i)}
                                            className={cn(
                                                'size-2 rounded-full transition-all',
                                                i === index ? 'bg-white w-5' : 'bg-white/50',
                                            )}
                                            aria-label={`Slide ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="hidden lg:grid grid-rows-2 gap-3">
                        {[STORE_IMAGES.cardio, STORE_IMAGES.strength].map((img, i) => (
                            <Link
                                key={img}
                                href={i === 0 ? '/collection/cardio' : '/collection/strength'}
                                className="relative rounded-lg overflow-hidden group/side"
                            >
                                <Image src={img} alt="" fill className="object-cover group-hover/side:scale-105 transition-transform duration-500" sizes="280px" />
                                <div className="absolute inset-0 bg-black/30 group-hover/side:bg-black/20 transition-colors" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
