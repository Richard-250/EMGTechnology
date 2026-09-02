import {ResultOf} from '@/graphql';
import {ProductGridClient} from './product-grid-client';
import {SearchProductsQuery} from '@/lib/vendure/queries';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';

interface ProductGridProps {
    productDataPromise: Promise<{
        data: ResultOf<typeof SearchProductsQuery>;
        token?: string;
    }>;
    currentPage: number;
    take: number;
    sortKey?: string;
}

export async function ProductGrid({productDataPromise, currentPage, take, sortKey = 'shuffle'}: ProductGridProps) {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Product'});
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
        />
    );
}
