'use client';

import {ResultOf, readFragment} from '@/graphql';
import {ProductCard} from './product-card';
import {ProductCardInteractive} from './product-card-interactive';
import {SortDropdown} from './sort-dropdown';
import {SearchProductsQuery} from '@/lib/vendure/queries';
import {ProductCardFragment} from '@/lib/vendure/fragments';
import {orderProductsForDisplay, sortProductsNewestFirst} from '@/lib/product-sort';
import {addSearchHistory, getSearchHistoryTerms} from '@/lib/search-history';
import {
    getProductInteractions,
    type ProductInteractionMap,
} from '@/lib/product-interactions';
import {resolveProductImage} from '@/lib/product-images';
import type {SerializedProductCard} from '@/lib/product-price';
import {Button} from '@/components/ui/button';
import {Loader2} from 'lucide-react';
import {useLocale} from 'next-intl';
import {useSearchParams} from 'next/navigation';
import {useCallback, useEffect, useMemo, useState} from 'react';

const EMPTY_INTERACTIONS: ProductInteractionMap = {views: {}, clicks: {}};

interface ProductGridClientProps {
    items: ResultOf<typeof SearchProductsQuery>['search']['items'];
    totalItems: number;
    currentPage: number;
    take: number;
    sortKey: string;
    loadMoreLabel: string;
    noProductsLabel: string;
    searchTerm?: string;
    collectionSlug?: string;
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
    loadMoreLabel,
    noProductsLabel,
    searchTerm,
    collectionSlug,
    noMatchTitle,
    noMatchHint,
    similarHeading,
    similarItems = [],
}: ProductGridClientProps) {
    const locale = useLocale();
    const searchParams = useSearchParams();
    const [historyTerms, setHistoryTerms] = useState<string[]>([]);
    const [interactions, setInteractions] = useState<ProductInteractionMap>(EMPTY_INTERACTIONS);
    const [extraItems, setExtraItems] = useState<SerializedProductCard[]>([]);
    const [loadingMore, setLoadingMore] = useState(false);
    const [loadedCount, setLoadedCount] = useState(items.length);
    const [rotationBucket, setRotationBucket] = useState(0);

    useEffect(() => {
        setHistoryTerms(getSearchHistoryTerms());
        setInteractions(getProductInteractions());
        setRotationBucket(Date.now());
    }, []);

    // Reset appended pages when the server result set changes (new search/filter/page)
    useEffect(() => {
        setExtraItems([]);
        setLoadedCount(items.length);
    }, [items]);

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
                rotationBucket,
            });
        }
        return items;
    }, [items, sortKey, currentPage, searchTerm, historyTerms, interactions, rotationBucket]);

    const similarDisplay = useMemo(() => {
        if (!similarItems.length) return similarItems;
        return orderProductsForDisplay(similarItems, {
            scope: 'search-similar',
            searchTerm,
            historyTerms,
            interactions,
            rotationBucket,
        });
    }, [similarItems, searchTerm, historyTerms, interactions, rotationBucket]);

    useEffect(() => {
        if (searchTerm?.trim()) {
            addSearchHistory(searchTerm.trim());
        }
    }, [searchTerm]);

    const hasMore = loadedCount < totalItems;

    const handleLoadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const params = new URLSearchParams();
            params.set('locale', locale);
            params.set('skip', String(loadedCount));
            params.set('take', String(take));
            params.set('sort', sortKey);
            if (searchTerm) params.set('q', searchTerm);
            if (collectionSlug) params.set('collection', collectionSlug);
            for (const facet of searchParams.getAll('facets')) {
                params.append('facets', facet);
            }

            const res = await fetch(`/api/search/products?${params.toString()}`);
            const data = (await res.json()) as {items?: SerializedProductCard[]};
            const next = data.items ?? [];
            setExtraItems(prev => [...prev, ...next]);
            setLoadedCount(count => count + next.length);
        } catch {
            // Keep current list; user can retry
        } finally {
            setLoadingMore(false);
        }
    }, [
        loadingMore,
        hasMore,
        locale,
        loadedCount,
        take,
        sortKey,
        searchTerm,
        collectionSlug,
        searchParams,
    ]);

    if (!products.length && extraItems.length === 0) {
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
            <div className="flex items-center justify-end">
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
                {extraItems.map((product, i) => (
                    <ProductCardInteractive
                        key={`product-grid-extra-${product.productId}-${i}`}
                        data={{
                            productId: product.productId,
                            productVariantId: product.productVariantId,
                            productName: product.productName,
                            slug: product.slug,
                            imageSrc: resolveProductImage(product.image, product.slug),
                            currencyCode: product.currencyCode,
                            price: product.price,
                            priceMin: product.priceMin,
                            priceMax: product.priceMax,
                            isPriceRange: Boolean(
                                product.priceMin != null &&
                                    product.priceMax != null &&
                                    product.priceMin !== product.priceMax,
                            ),
                        }}
                    />
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="min-w-[10rem] font-semibold"
                        disabled={loadingMore}
                        onClick={() => void handleLoadMore()}
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                {loadMoreLabel}
                            </>
                        ) : (
                            loadMoreLabel
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
