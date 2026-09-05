'use client';

import {useEffect, useMemo, useState} from 'react';
import {FragmentOf, readFragment} from '@/graphql';
import {ProductCardFragment} from '@/lib/vendure/fragments';
import {orderProductsForDisplay} from '@/lib/product-sort';
import {getSearchHistoryTerms} from '@/lib/search-history';
import {
    getProductInteractions,
    type ProductInteractionMap,
} from '@/lib/product-interactions';
import {ProductCard} from '@/components/commerce/product-card';
import {Button} from '@/components/ui/button';

const PAGE_SIZE = 24;
const EMPTY_INTERACTIONS: ProductInteractionMap = {views: {}, clicks: {}};

interface HomeFitnessCatalogProps {
    products: FragmentOf<typeof ProductCardFragment>[];
    totalProducts: number;
    labels: {
        title: string;
        subtitle: string;
        all: string;
        showing: string;
        loadMore: string;
    };
}

export function HomeFitnessCatalog({
    products,
    totalProducts,
    labels,
}: HomeFitnessCatalogProps) {
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    // Apply visitor signals after mount to keep SSR/client hydration stable
    const [historyTerms, setHistoryTerms] = useState<string[]>([]);
    const [interactions, setInteractions] = useState<ProductInteractionMap>(EMPTY_INTERACTIONS);

    useEffect(() => {
        setHistoryTerms(getSearchHistoryTerms());
        setInteractions(getProductInteractions());
    }, []);

    const displayProducts = useMemo(() => {
        return orderProductsForDisplay(products, {
            scope: 'home-catalog',
            historyTerms,
            interactions,
        });
    }, [products, historyTerms, interactions]);

    const visible = displayProducts.slice(0, visibleCount);
    const hasMore = visibleCount < displayProducts.length;

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
                            .replace('{count}', String(visible.length))
                            .replace('{total}', String(totalProducts || displayProducts.length))}
                    </div>
                </div>

                {displayProducts.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        No products available yet.
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 md:gap-3.5 overflow-visible">
                            {visible.map((product, i) => (
                                <ProductCard
                                    key={`home-product-${readFragment(ProductCardFragment, product).productId}-${i}`}
                                    product={product}
                                    variant="compact"
                                />
                            ))}
                        </div>
                        {hasMore && (
                            <div className="flex justify-center pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="min-w-[10rem] font-semibold"
                                    onClick={() =>
                                        setVisibleCount(count =>
                                            Math.min(count + PAGE_SIZE, displayProducts.length),
                                        )
                                    }
                                >
                                    {labels.loadMore}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
