'use client';

import {useMemo} from 'react';
import {FragmentOf} from '@/graphql';
import {ProductCardFragment} from '@/lib/vendure/fragments';
import {getShuffleSeed, shuffleProducts} from '@/lib/product-sort';
import {ProductCard} from '@/components/commerce/product-card';

interface HomeFitnessCatalogProps {
    products: FragmentOf<typeof ProductCardFragment>[];
    totalProducts: number;
    labels: {
        title: string;
        subtitle: string;
        all: string;
        showing: string;
    };
}

export function HomeFitnessCatalog({
    products,
    totalProducts,
    labels,
}: HomeFitnessCatalogProps) {
    const displayProducts = useMemo(
        () => shuffleProducts(products, getShuffleSeed('home-catalog')),
        [products],
    );

    return (
        <section className="py-6 md:py-10">
            <div className="container mx-auto px-3 md:px-4 space-y-5 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border/60">
                    <div className="flex items-center gap-3">
                        <span className="w-2 sm:w-2.5 h-8 sm:h-10 bg-electric rounded-full shrink-0 shadow-sm shadow-electric/20" aria-hidden="true" />
                        <div>
                            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl uppercase tracking-[0.04em] text-foreground font-bold">
                                {labels.title}
                            </h2>
                            <p className="mt-0.5 text-muted-foreground text-xs sm:text-sm">
                                {labels.subtitle}
                            </p>
                        </div>
                    </div>
                    <div className="text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-full bg-muted/80 text-foreground self-start sm:self-center border border-border/60 shadow-xs">
                        {labels.showing
                            .replace('{count}', String(displayProducts.length))
                            .replace('{total}', String(totalProducts || displayProducts.length))}
                    </div>
                </div>

                {displayProducts.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        No products available yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 md:gap-3.5 overflow-visible">
                        {displayProducts.map((product, i) => (
                            <ProductCard key={`home-product-${i}`} product={product} variant="compact" />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
