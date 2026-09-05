import {ResultOf} from '@/graphql';
import {ProductGridClient} from './product-grid-client';
import {SearchProductsQuery} from '@/lib/vendure/queries';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';

interface ProductGridProps {
    productDataPromise: Promise<{
        data: ResultOf<typeof SearchProductsQuery>;
    }>;
    currentPage: number;
    take: number;
    sortKey?: string;
    searchTerm?: string;
    similarItems?: ResultOf<typeof SearchProductsQuery>['search']['items'];
}

export async function ProductGrid({
    productDataPromise,
    currentPage,
    take,
    sortKey = 'shuffle',
    searchTerm,
    similarItems = [],
}: ProductGridProps) {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Product'});
    const tSearch = await getTranslations({locale, namespace: 'Search'});
    const result = await productDataPromise;
    const searchResult = result.data.search;

    return (
        <ProductGridClient
            items={searchResult.items}
            totalItems={searchResult.totalItems}
            currentPage={currentPage}
            take={take}
            sortKey={sortKey}
            productCountLabel={t('productCount', {count: searchResult.totalItems})}
            noProductsLabel={t('noProductsFound')}
            searchTerm={searchTerm}
            noMatchTitle={
                searchTerm
                    ? tSearch('noMatchTitle', {query: searchTerm})
                    : t('noProductsFound')
            }
            noMatchHint={tSearch('noMatchHint')}
            similarHeading={tSearch('similarProducts')}
            similarItems={similarItems}
        />
    );
}
