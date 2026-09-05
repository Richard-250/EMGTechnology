'use client';

import {ResultOf, readFragment} from '@/graphql';
import {ProductCard} from './product-card';
import {Pagination} from '@/components/shared/pagination';
import {SortDropdown} from './sort-dropdown';
import {SearchProductsQuery} from '@/lib/vendure/queries';
import {ProductCardFragment} from '@/lib/vendure/fragments';
import {orderProductsForDisplay, sortProductsNewestFirst} from '@/lib/product-sort';
import {addSearchHistory, getSearchHistoryTerms} from '@/lib/search-history';
import {
    getProductInteractions,
    type ProductInteractionMap,
} from '@/lib/product-interactions';
import {useEffect, useMemo, useState} from 'react';

const EMPTY_INTERACTIONS: ProductInteractionMap = {views: {}, clicks: {}};

interface ProductGridClientProps {
    items: ResultOf<typeof SearchProductsQuery>['search']['items'];
    totalItems: number;
    currentPage: number;
    take: number;
    sortKey: string;
    productCountLabel: string;
    noProductsLabel: string;
    searchTerm?: string;
    noMatchTitle?: string;
    noMatchHint?: string;
    similarHeading?: string;
    similarItems?: ResultOf<typeof SearchProductsQuery>['search']['items'];
}

export function ProductGridClient({
    items,
    totalItems,
    currentPage,
    take,
    sortKey,
    productCountLabel,
    noProductsLabel,
    searchTerm,
    noMatchTitle,
    noMatchHint,
    similarHeading,
    similarItems = [],
}: ProductGridClientProps) {
    const [historyTerms, setHistoryTerms] = useState<string[]>([]);
    const [interactions, setInteractions] = useState<ProductInteractionMap>(EMPTY_INTERACTIONS);

    useEffect(() => {
        setHistoryTerms(getSearchHistoryTerms());
        setInteractions(getProductInteractions());
    }, []);

    const products = useMemo(() => {
        if (sortKey === 'newest') {
            return sortProductsNewestFirst(items);
        }
        if (sortKey === 'shuffle') {
            return orderProductsForDisplay(items, {
                scope: `search-page-${currentPage}`,
                searchTerm,
                historyTerms,
                interactions,
            });
        }
        return items;
    }, [items, sortKey, currentPage, searchTerm, historyTerms, interactions]);

    const similarDisplay = useMemo(() => {
        if (!similarItems.length) return similarItems;
        return orderProductsForDisplay(similarItems, {
            scope: 'search-similar',
            searchTerm,
            historyTerms,
            interactions,
        });
    }, [similarItems, searchTerm, historyTerms, interactions]);

    const totalPages = Math.ceil(totalItems / take);

    useEffect(() => {
        if (searchTerm?.trim()) {
            addSearchHistory(searchTerm.trim());
        }
    }, [searchTerm]);

    if (!products.length) {
        return (
            <div className="space-y-8">
                <div className="rounded-xl border border-border/70 bg-muted/20 px-6 py-10 text-center">
                    <p className="text-base font-semibold text-foreground">
                        {noMatchTitle || noProductsLabel}
                    </p>
                    {noMatchHint && (
                        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                            {noMatchHint}
                        </p>
                    )}
                </div>

                {similarDisplay.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-sm font-semibold text-foreground">
                            {similarHeading}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 overflow-visible">
                            {similarDisplay.map((product, i) => (
                                <ProductCard
                                    key={
                                        'similar-' +
                                        readFragment(ProductCardFragment, product).productId +
                                        '-' +
                                        i
                                    }
                                    product={product}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{productCountLabel}</p>
                <SortDropdown />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 overflow-visible">
                {products.map((product, i) => (
                    <ProductCard
                        key={
                            'product-grid-item-' +
                            readFragment(ProductCardFragment, product).productId +
                            '-' +
                            i
                        }
                        product={product}
                    />
                ))}
            </div>

            {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} />}
        </div>
    );
}
