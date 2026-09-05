export interface SearchInputParams {
    term?: string;
    collectionSlug?: string;
    take: number;
    skip: number;
    groupByProduct: boolean;
    sort: { name?: 'ASC' | 'DESC'; price?: 'ASC' | 'DESC' };
    facetValueFilters?: Array<{ and: string }>;
}

interface BuildSearchInputOptions {
    searchParams: { [key: string]: string | string[] | undefined };
    collectionSlug?: string;
}

export function buildSearchInput({ searchParams, collectionSlug }: BuildSearchInputOptions): SearchInputParams {
    const page = Number(searchParams.page) || 1;
    const take = 12;
    const skip = (page - 1) * take;
    const sort = (searchParams.sort as string) || 'shuffle';
    const rawTerm = Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q;
    const searchTerm = typeof rawTerm === 'string' ? rawTerm.trim() : '';

    // Extract facet value IDs from search params
    const facetValueIds = searchParams.facets
        ? Array.isArray(searchParams.facets)
            ? searchParams.facets
            : [searchParams.facets]
        : [];

    // Map sort parameter to Vendure SearchResultSortParameter
    const sortMapping: Record<string, { name?: 'ASC' | 'DESC'; price?: 'ASC' | 'DESC' }> = {
        newest: {},
        shuffle: {},
        'name-asc': { name: 'ASC' },
        'name-desc': { name: 'DESC' },
        'price-asc': { price: 'ASC' },
        'price-desc': { price: 'DESC' },
    };

    return {
        ...(searchTerm && { term: searchTerm }),
        ...(collectionSlug && { collectionSlug }),
        take,
        skip,
        groupByProduct: true,
        sort: sortMapping[sort] || {},
        ...(facetValueIds.length > 0 && {
            facetValueFilters: facetValueIds.map(id => ({ and: id }))
        })
    };
}

/** First meaningful word / shortened term for "similar products" when exact search is empty. */
export function buildSimilarSearchTerm(term: string): string | undefined {
    const cleaned = term.trim().replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ');
    if (!cleaned) return undefined;
    const words = cleaned.split(' ').filter(w => w.length > 1);
    if (words.length === 0) return cleaned.slice(0, 3) || undefined;
    if (words.length === 1) return words[0].slice(0, Math.max(3, Math.ceil(words[0].length * 0.7)));
    return words[0];
}

export function getCurrentPage(searchParams: { [key: string]: string | string[] | undefined }): number {
    return Number(searchParams.page) || 1;
}
