import {Suspense} from 'react';
import {getRouteLocale} from '@/i18n/server';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {FacetFilters} from '@/components/commerce/facet-filters';
import {ProductGridSkeleton} from '@/components/shared/product-grid-skeleton';
import {ProductGrid} from '@/components/commerce/product-grid';
import {buildSearchInput, getCurrentPage, buildSimilarSearchTerm} from '@/lib/search-helpers';
import {query} from '@/lib/vendure/api';
import {SearchProductsQuery} from '@/lib/vendure/queries';

interface SearchResultsProps {
    searchParams: Promise<{
        page?: string;
        sort?: string;
        q?: string;
        [key: string]: string | string[] | undefined;
    }>;
}

export async function SearchResults({searchParams}: SearchResultsProps) {
    const searchParamsResolved = await searchParams;
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const page = getCurrentPage(searchParamsResolved);
    const sortKey = (searchParamsResolved.sort as string) || 'shuffle';
    const searchInput = buildSearchInput({searchParams: searchParamsResolved});
    const searchTerm = typeof searchParamsResolved.q === 'string' ? searchParamsResolved.q.trim() : '';

    const productDataPromise = query(
        SearchProductsQuery,
        {input: searchInput},
        {languageCode: locale, currencyCode, tags: ['products', 'search']},
    );

    const result = await productDataPromise;
    const totalItems = result.data.search.totalItems;

    let similarItems: typeof result.data.search.items = [];
    if (totalItems === 0 && searchTerm) {
        const similarTerm = buildSimilarSearchTerm(searchTerm);
        const similarResult = await query(
            SearchProductsQuery,
            {
                input: {
                    ...(similarTerm ? {term: similarTerm} : {}),
                    take: 8,
                    skip: 0,
                    groupByProduct: true,
                    sort: {},
                },
            },
            {languageCode: locale, currencyCode, tags: ['products', 'search']},
        );
        similarItems = similarResult.data.search.items;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <aside className="lg:col-span-1">
                <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-lg" />}>
                    <FacetFilters productDataPromise={Promise.resolve(result)} />
                </Suspense>
            </aside>

            <div className="lg:col-span-3">
                <Suspense fallback={<ProductGridSkeleton />}>
                    <ProductGrid
                        productDataPromise={Promise.resolve(result)}
                        currentPage={page}
                        take={12}
                        sortKey={sortKey}
                        searchTerm={searchTerm || undefined}
                        similarItems={similarItems}
                    />
                </Suspense>
            </div>
        </div>
    );
}
