'use client';

import {ProductCard} from "@/components/commerce/product-card";
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious,} from "@/components/ui/carousel";
import {FragmentOf, readFragment} from "@/graphql";
import {ProductCardFragment} from "@/lib/vendure/fragments";
import {orderProductsForDisplay} from '@/lib/product-sort';
import {getSearchHistoryTerms} from '@/lib/search-history';
import {
    getProductInteractions,
    type ProductInteractionMap,
} from '@/lib/product-interactions';
import {useEffect, useId, useMemo, useState} from "react";

const EMPTY_INTERACTIONS: ProductInteractionMap = {views: {}, clicks: {}};

interface ProductCarouselClientProps {
    title: string;
    products: Array<FragmentOf<typeof ProductCardFragment>>;
}

export function ProductCarousel({title, products}: ProductCarouselClientProps) {
    const id = useId();
    const [historyTerms, setHistoryTerms] = useState<string[]>([]);
    const [interactions, setInteractions] = useState<ProductInteractionMap>(EMPTY_INTERACTIONS);

    useEffect(() => {
        setHistoryTerms(getSearchHistoryTerms());
        setInteractions(getProductInteractions());
    }, []);

    const displayProducts = useMemo(
        () =>
            orderProductsForDisplay(products, {
                scope: 'featured-carousel',
                historyTerms,
                interactions,
            }),
        [products, historyTerms, interactions],
    );

    return (
        <section className="py-12 md:py-16 bg-muted/40">
            <div className="container mx-auto px-4">
                <h2 className="font-display text-4xl md:text-5xl tracking-[0.03em] mb-8 md:mb-10">{title}</h2>
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-2 md:-ml-4">
                        {displayProducts.map((product, i) => (
                            <CarouselItem
                                key={id + readFragment(ProductCardFragment, product).productId + i}
                                className="pl-2 md:pl-4 basis-[72%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                            >
                                <ProductCard product={product}/>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden md:flex"/>
                    <CarouselNext className="hidden md:flex"/>
                </Carousel>
            </div>
        </section>
    );
}
