import {connection} from 'next/server';
import {getRouteLocale} from '@/i18n/server';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {isPrerenderAbortError} from '@/lib/prerender';
import {getCategoryProductsMap} from '@/lib/category-products';
import {getTopCollections} from '@/lib/vendure/cached';
import {getActiveCustomer} from '@/lib/vendure/actions';
import {NavbarSearchBar} from '@/components/layout/navbar/navbar-search-bar';

export async function NavbarSearchBarLoader() {
    await connection();

    const locale = await getRouteLocale();
    try {
        const currencyCode = await getActiveCurrencyCode();
        const [categoryProducts, collections, customer] = await Promise.all([
            getCategoryProductsMap(locale, currencyCode),
            getTopCollections(locale),
            getActiveCustomer().catch(() => null),
        ]);

        const browseCategories = collections.map(c => ({
            slug: c.slug,
            name: c.name,
            collectionSlug: c.slug,
        }));

        return (
            <NavbarSearchBar
                browseCategories={browseCategories}
                categoryProducts={categoryProducts}
                customerId={customer?.id ?? null}
            />
        );
    } catch (error) {
        if (!isPrerenderAbortError(error)) {
            console.error('Error loading navbar search:', error);
        }
        return <NavbarSearchBar browseCategories={[]} categoryProducts={{}} customerId={null} />;
    }
}
