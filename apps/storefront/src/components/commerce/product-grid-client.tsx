'use client';

import {ResultOf} from '@/graphql';
import {ProductCard} from './product-card';
import {Pagination} from '@/components/shared/pagination';
import {SortDropdown} from './sort-dropdown';
import {SearchProductsQuery} from '@/lib/vendure/queries';
import {getShuffleSeed, shuffleProducts, sortProductsNewestFirst} from '@/lib/product-sort';
import {useMemo} from 'react';

interface ProductGridClientProps {
    items: ResultOf<typeof SearchProductsQuery>['search']['items'];
    totalItems: number;
    currentPage: number;
    take: number;
    sortKey: string;
    productCountLabel: string;
    noProductsLabel: string;
}

export function ProductGridClient({
    items,
    totalItems,
    currentPage,
    take,
    sortKey,
    productCountLabel,
    noProductsLabel,
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

    if (!products.length) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">{noProductsLabel}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{productCountLabel}</p>
                <SortDropdown />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {products.map((product, i) => (
                    <ProductCard key={'product-grid-item' + i} product={product} />
                ))}
            </div>

            {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} />}
        </div>
    );
}
