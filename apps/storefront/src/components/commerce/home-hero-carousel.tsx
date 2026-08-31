'use client';

import {useCallback, useEffect, useState} from 'react';
import Image from 'next/image';
import {ChevronLeft, ChevronRight, ArrowRight, Sparkles} from 'lucide-react';
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

const SIDE_CARDS = [
    {
        image: STORE_IMAGES.cardio,
        href: '/collection/cardio',
        title: 'Cardio Equipment',
        subtitle: 'Commercial treadmills, bikes & rowers',
        tag: 'Popular',
    },
    {
        image: STORE_IMAGES.strength,
        href: '/collection/strength',
        title: 'Strength & Power',
        subtitle: 'Heavy-duty power racks, benches & dumbbells',
        tag: 'Commercial',
    },
];

export function HomeHeroCarousel({slides}: HomeHeroCarouselProps) {
    const [index, setIndex] = useState(0);

    const next = useCallback(() => {
        setIndex(i => (i + 1) % slides.length);
    }, [slides.length]);

    const prev = useCallback(() => {
        setIndex(i => (i === 0 ? slides.length - 1 : i - 1));
    }, [slides.length]);

    useEffect(() => {
        // Auto-switch slides every 3 seconds as requested
        const timer = setInterval(next, 3000);
        return () => clearInterval(timer);
    }, [next]);

    if (!slides.length) return null;

    const slide = slides[index];

    return (
        <section className="bg-muted/30 border-b border-border">
            <div className="container mx-auto px-4 py-4 md:py-6">
                <div className="grid lg:grid-cols-[1fr_320px] gap-4">
                    {/* Main Hero Banner */}
                    <div className="relative aspect-[16/11] sm:aspect-[2/1] md:aspect-[2.8/1] min-h-[240px] md:min-h-[290px] rounded-xl overflow-hidden group shadow-sm border border-border/50">
                        <Image
                            src={slide.image}
                            alt=""
                            fill
                            className="object-cover transition-opacity duration-700"
                            sizes="(max-width: 1024px) 100vw, 70vw"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
                        <div className="absolute inset-0 flex flex-col justify-center px-5 sm:px-8 md:px-12 max-w-xl text-white">
                            <span className="inline-flex items-center gap-1.5 w-fit rounded-full bg-electric/25 border border-electric/40 text-electric px-3 py-1 text-[11px] font-bold uppercase tracking-wider mb-2">
                                <Sparkles className="size-3" /> EMG Fitness
                            </span>
                            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-wide mb-2 leading-tight">
                                {slide.title}
                            </h2>
                            <p className="text-xs sm:text-sm md:text-base text-white/90 mb-4 line-clamp-2 leading-relaxed">
                                {slide.subtitle}
                            </p>
                            <Link
                                href={slide.href}
                                className="inline-flex w-fit items-center gap-1.5 rounded-full bg-electric hover:bg-electric/90 text-electric-foreground px-5 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold shadow-md shadow-electric/20 transition-all active:scale-95"
                            >
                                {slide.cta}
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>

                        {slides.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity size-8 sm:size-10 border border-white/20"
                                    onClick={prev}
                                    aria-label="Previous slide"
                                >
                                    <ChevronLeft className="size-5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity size-8 sm:size-10 border border-white/20"
                                    onClick={next}
                                    aria-label="Next slide"
                                >
                                    <ChevronRight className="size-5" />
                                </Button>
                                <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 flex gap-2">
                                    {slides.map((_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setIndex(i)}
                                            className={cn(
                                                'h-1.5 rounded-full transition-all duration-300',
                                                i === index ? 'bg-electric w-6' : 'bg-white/50 w-2 hover:bg-white/80',
                                            )}
                                            aria-label={`Slide ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Side Cards with Rich Word Descriptions */}
                    <div className="hidden lg:grid grid-rows-2 gap-3.5">
                        {SIDE_CARDS.map((card) => (
                            <Link
                                key={card.title}
                                href={card.href}
                                className="relative rounded-xl overflow-hidden group/side border border-border/60 shadow-xs flex flex-col justify-end p-4 bg-muted"
                            >
                                <Image
                                    src={card.image}
                                    alt={card.title}
                                    fill
                                    className="object-cover group-hover/side:scale-105 transition-transform duration-700 ease-out"
                                    sizes="320px"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/20 group-hover/side:from-black/95 transition-colors" />

                                <div className="relative z-10 text-white space-y-1">
                                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-electric bg-electric/20 border border-electric/30 px-2 py-0.5 rounded-full">
                                        {card.tag}
                                    </span>
                                    <h3 className="font-display text-base md:text-lg font-bold tracking-wide leading-tight group-hover/side:text-electric transition-colors">
                                        {card.title}
                                    </h3>
                                    <p className="text-xs text-white/80 line-clamp-1 leading-snug">
                                        {card.subtitle}
                                    </p>
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/95 pt-0.5 group-hover/side:translate-x-1 transition-transform">
                                        Explore Collection <ArrowRight className="size-3 text-electric" />
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

