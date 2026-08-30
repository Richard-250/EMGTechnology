import {getRouteLocale} from '@/i18n/server';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {getCategoryProductsMap} from '@/lib/category-products';
import {getTopCollections} from '@/lib/vendure/cached';
import {NavbarSearchBar} from '@/components/layout/navbar/navbar-search-bar';

export async function NavbarSearchBarLoader() {
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const [categoryProducts, collections] = await Promise.all([
        getCategoryProductsMap(locale, currencyCode),
        getTopCollections(locale),
    ]);

    const browseCategories = collections.map(c => ({
        slug: c.slug,
        name: c.name,
        collectionSlug: c.slug,
    }));

    return (
        <NavbarSearchBar browseCategories={browseCategories} categoryProducts={categoryProducts} />
    );
}
