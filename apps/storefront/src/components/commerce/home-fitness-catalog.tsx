"use client";

import {FragmentOf} from "@/graphql";
import {ProductCardFragment} from "@/lib/vendure/fragments";
import {ProductCard} from "@/components/commerce/product-card";

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
    return (
        <section className="bg-muted/30 py-6 md:py-10">
            <div className="container mx-auto px-3 md:px-4">
                <div className="bg-card text-card-foreground rounded-2xl border border-border/80 shadow-sm overflow-hidden">
                    {/* All Products header — bold, visible & prominent */}
                    <div className="px-4 py-5 md:px-6 md:py-6 border-b border-border/60 bg-card">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
                                    .replace("{count}", String(products.length))
                                    .replace("{total}", String(totalProducts || products.length))}
                            </div>
                        </div>
                    </div>

                    {products.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            No products available yet.
                        </div>
                    ) : (
                        <div className="p-3 md:p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
                            {products.map((product, i) => (
                                <ProductCard key={`home-product-${i}`} product={product} variant="compact" />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

