import {NextRequest, NextResponse} from 'next/server';
import {query} from '@/lib/vendure/api';
import {SearchProductsQuery} from '@/lib/vendure/queries';
import {serializeProductCard} from '@/lib/product-price';
import {getActiveCurrencyCode} from '@/lib/currency-server';

export async function GET(request: NextRequest) {
    const {searchParams} = request.nextUrl;
    const locale = searchParams.get('locale') || 'en';
    const term = searchParams.get('q')?.trim() || undefined;
    const collectionSlug = searchParams.get('collection') || undefined;
    const sort = searchParams.get('sort') || 'shuffle';
    const skip = Math.max(0, Number(searchParams.get('skip') || 0));
    const take = Math.min(48, Math.max(1, Number(searchParams.get('take') || 12)));
    const facets = searchParams.getAll('facets').filter(Boolean);

    const sortMapping: Record<string, {name?: 'ASC' | 'DESC'; price?: 'ASC' | 'DESC'}> = {
        newest: {},
        shuffle: {},
        'name-asc': {name: 'ASC'},
        'name-desc': {name: 'DESC'},
        'price-asc': {price: 'ASC'},
        'price-desc': {price: 'DESC'},
    };

    try {
        const currencyCode = await getActiveCurrencyCode();
        const result = await query(
            SearchProductsQuery,
            {
                input: {
                    ...(term ? {term} : {}),
                    ...(collectionSlug ? {collectionSlug} : {}),
                    take,
                    skip,
                    groupByProduct: true,
                    sort: sortMapping[sort] || {},
                    ...(facets.length > 0
                        ? {facetValueFilters: facets.map(id => ({and: id}))}
                        : {}),
                },
            },
            {languageCode: locale, currencyCode},
        );

        return NextResponse.json({
            items: result.data.search.items.map(item => serializeProductCard(item)),
            totalItems: result.data.search.totalItems,
        });
    } catch (error) {
        console.error('Load more products failed:', error);
        return NextResponse.json({items: [], totalItems: 0, error: 'Failed to load products'}, {status: 500});
    }
}
