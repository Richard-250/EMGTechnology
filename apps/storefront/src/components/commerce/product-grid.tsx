import {ResultOf} from '@/graphql';
import {ProductGridClient} from './product-grid-client';
import {SearchProductsQuery} from '@/lib/vendure/queries';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {getRwfPerUsd} from '@/lib/exchange-rate-server';

interface ProductGridProps {
    productDataPromise: Promise<{
        data: ResultOf<typeof SearchProductsQuery>;
    }>;
    currentPage: number;
    take: number;
    sortKey?: string;
    searchTerm?: string;
    collectionSlug?: string;
    similarItems?: ResultOf<typeof SearchProductsQuery>['search']['items'];
}

export async function ProductGrid({
    productDataPromise,
    currentPage,
    take,
    sortKey = 'shuffle',
    searchTerm,
    collectionSlug,
    similarItems = [],
}: ProductGridProps) {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Product'});
    const tSearch = await getTranslations({locale, namespace: 'Search'});
    const tHome = await getTranslations({locale, namespace: 'Home'});
    const [result, activeCurrency, rwfPerUsd] = await Promise.all([
        productDataPromise,
        getActiveCurrencyCode(),
        getRwfPerUsd(),
    ]);
    const searchResult = result.data.search;

    return (
        <ProductGridClient
            items={searchResult.items}
            totalItems={searchResult.totalItems}
            currentPage={currentPage}
            take={take}
            sortKey={sortKey}
            loadMoreLabel={tHome('loadMore')}
            noProductsLabel={t('noProductsFound')}
            searchTerm={searchTerm}
            collectionSlug={collectionSlug}
            noMatchTitle={
                searchTerm
                    ? tSearch('noMatchTitle', {query: searchTerm})
                    : t('noProductsFound')
            }
            noMatchHint={tSearch('noMatchHint')}
            similarHeading={tSearch('similarProducts')}
            similarItems={similarItems}
            activeCurrency={activeCurrency}
            rwfPerUsd={rwfPerUsd}
        />
    );
}
