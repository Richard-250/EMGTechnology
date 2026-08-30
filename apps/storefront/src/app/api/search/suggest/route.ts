import {NextRequest, NextResponse} from 'next/server';
import {query} from '@/lib/vendure/api';
import {SearchProductsQuery} from '@/lib/vendure/queries';
import {serializeProductCard} from '@/lib/product-price';
import {getActiveCurrencyCode} from '@/lib/currency-server';

export async function GET(request: NextRequest) {
    const {searchParams} = request.nextUrl;
    const term = searchParams.get('q')?.trim() ?? '';
    const locale = searchParams.get('locale') || 'en';
    const collectionSlug = searchParams.get('collection') || undefined;

    if (!term && !collectionSlug) {
        return NextResponse.json({items: []});
    }

    try {
        const currencyCode = await getActiveCurrencyCode();
        const result = await query(
            SearchProductsQuery,
            {
                input: {
                    ...(term && {term}),
                    ...(collectionSlug && {collectionSlug}),
                    take: 10,
                    skip: 0,
                    groupByProduct: true,
                },
            },
            {languageCode: locale, currencyCode},
        );

        const items = result.data.search.items.map(item => serializeProductCard(item));

        return NextResponse.json({items});
    } catch {
        return NextResponse.json({items: []}, {status: 500});
    }
}
