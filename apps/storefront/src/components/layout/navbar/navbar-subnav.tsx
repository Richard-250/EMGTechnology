import {connection} from 'next/server';
import {getRouteLocale} from '@/i18n/server';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {isPrerenderAbortError} from '@/lib/prerender';
import {getTopCollections} from '@/lib/vendure/cached';
import {Link} from '@/i18n/navigation';
import {getTranslations} from 'next-intl/server';
import {Home} from 'lucide-react';
import {buildCategoryMenuItems} from '@/components/layout/category-nav-bar';
import {AllCategoriesMenu} from '@/components/layout/all-categories-menu';
import {getCategoryProductsMap} from '@/lib/category-products';
import {MoreCategoriesMenu} from './more-categories-menu';

export async function NavbarSubnav() {
    await connection();

    const locale = await getRouteLocale();
    try {
        const currencyCode = await getActiveCurrencyCode();
        const [collections, categories, categoryProducts] = await Promise.all([
            getTopCollections(locale),
            buildCategoryMenuItems(locale),
            getCategoryProductsMap(locale, currencyCode),
        ]);
        const t = await getTranslations({locale, namespace: 'Navigation'});

        // Primary collections to show directly in the bar (first 3-4 items)
        const primaryCollections = collections.slice(0, 4);
        // Extra categories/collections to display inside the 'More' dropdown
        const extraCategories = categories.filter(
            c => !primaryCollections.some(p => p.slug === c.slug)
        );

        return (
            <nav className="hidden md:flex items-center gap-5 h-10 border-t border-border/60 text-sm">
                <AllCategoriesMenu
                    variant="subnav"
                    categories={categories}
                    categoryProducts={categoryProducts}
                    labels={{
                        allCategories: t('allCategories'),
                        shopAll: t('shopAll'),
                        viewAll: t('viewAllInCategory'),
                        recommended: t('recommended'),
                    }}
                />

                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-foreground/80 hover:text-foreground hover:bg-muted/60 font-medium whitespace-nowrap shrink-0 transition-colors"
                >
                    <Home className="size-4" />
                    {t('home')}
                </Link>

                <div className="flex items-center gap-5 overflow-x-auto scrollbar-none">
                    {primaryCollections.map(collection => {
                        const isFeatured = collection.slug === 'featured';
                        return (
                            <Link
                                key={collection.id}
                                href={`/collection/${collection.slug}`}
                                className={
                                    isFeatured
                                        ? 'font-semibold text-electric hover:text-electric/80 whitespace-nowrap shrink-0'
                                        : 'text-foreground/80 hover:text-foreground whitespace-nowrap shrink-0 transition-colors'
                                }
                            >
                                {collection.name}
                            </Link>
                        );
                    })}

                    <MoreCategoriesMenu
                        categories={extraCategories.length > 0 ? extraCategories : categories}
                        label={t('more')}
                    />
                </div>
            </nav>
        );
    } catch (error) {
        if (!isPrerenderAbortError(error)) {
            console.error('Error loading navbar subnav:', error);
        }
        return null;
    }
}

