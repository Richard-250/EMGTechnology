import {getRouteLocale} from '@/i18n/server';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {getTopCollections} from '@/lib/vendure/cached';
import {Link} from '@/i18n/navigation';
import {getTranslations} from 'next-intl/server';
import {ChevronDown, Home} from 'lucide-react';
import {buildCategoryMenuItems} from '@/components/layout/category-nav-bar';
import {AllCategoriesMenu} from '@/components/layout/all-categories-menu';
import {getCategoryProductsMap} from '@/lib/category-products';

export async function NavbarSubnav() {
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const [collections, categories, categoryProducts] = await Promise.all([
        getTopCollections(locale),
        buildCategoryMenuItems(locale),
        getCategoryProductsMap(locale, currencyCode),
    ]);
    const t = await getTranslations({locale, namespace: 'Navigation'});

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
                {collections.map(collection => {
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
                <Link
                    href="/search"
                    className="inline-flex items-center gap-0.5 text-foreground/80 hover:text-foreground whitespace-nowrap shrink-0 transition-colors"
                >
                    {t('more')}
                    <ChevronDown className="size-3.5 opacity-60" />
                </Link>
            </div>
        </nav>
    );
}
