'use client';

import {ResultOf} from '@/graphql';
import {ProductCard} from './product-card';
import {Pagination} from '@/components/shared/pagination';
import {SortDropdown} from './sort-dropdown';
import {SearchProductsQuery} from '@/lib/vendure/queries';
import {getShuffleSeed, shuffleProducts, sortProductsNewestFirst} from '@/lib/product-sort';
import {useEffect, useMemo} from 'react';
import {addSearchHistory} from '@/lib/search-history';

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
    const products = useMemo(() => {
        if (sortKey === 'shuffle') {
            return shuffleProducts(items, getShuffleSeed(`search-${currentPage}`));
        }
        if (sortKey === 'newest') {
            return sortProductsNewestFirst(items);
        }
        return items;
    }, [items, sortKey, currentPage]);

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

                {similarItems.length > 0 && (
                    <div className="space-y-4">
                        <p className="text-sm font-semibold text-foreground">
                            {similarHeading}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 overflow-visible">
                            {similarItems.map((product, i) => (
                                <ProductCard key={'similar-' + i} product={product} />
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
                    <ProductCard key={'product-grid-item' + i} product={product} />
                ))}
            </div>

            {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} />}
        </div>
    );
}
