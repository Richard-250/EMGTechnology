import {NextRequest, NextResponse} from 'next/server';
import {query} from '@/lib/vendure/api';
import {SearchProductsQuery} from '@/lib/vendure/queries';
import {serializeProductCard} from '@/lib/product-price';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {buildSimilarSearchTerm} from '@/lib/search-helpers';

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

        const runSearch = async (searchTerm?: string) => {
            const result = await query(
                SearchProductsQuery,
                {
                    input: {
                        ...(searchTerm && {term: searchTerm}),
                        ...(collectionSlug && {collectionSlug}),
                        take: 10,
                        skip: 0,
                        groupByProduct: true,
                    },
                },
                {languageCode: locale, currencyCode},
            );
            return result.data.search.items.map(item => serializeProductCard(item));
        };

        let items = await runSearch(term || undefined);

        // Fallback: shortened / first-word query when exact term has no hits
        if (items.length === 0 && term) {
            const similar = buildSimilarSearchTerm(term);
            if (similar && similar.toLowerCase() !== term.toLowerCase()) {
                items = await runSearch(similar);
            }
        }

        return NextResponse.json({items});
    } catch {
        return NextResponse.json({items: []}, {status: 500});
    }
}
