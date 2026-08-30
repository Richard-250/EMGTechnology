import {getRouteLocale} from '@/i18n/server';
import {getTopCollections} from '@/lib/vendure/cached';
import {getCategoryNavImage, CATEGORY_NAV_META, type CategorySlug} from '@/lib/category-nav';
import {getCategoryProductsMap} from '@/lib/category-products';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {AllCategoriesMenu, type CategoryMenuItem} from '@/components/layout/all-categories-menu';
import {getTranslations} from 'next-intl/server';

const DESCRIPTION_KEYS: Record<CategorySlug, `categoryDescriptions.${CategorySlug}`> = {
    featured: 'categoryDescriptions.featured',
    cardio: 'categoryDescriptions.cardio',
    strength: 'categoryDescriptions.strength',
    'home-gyms': 'categoryDescriptions.home-gyms',
    accessories: 'categoryDescriptions.accessories',
};

export async function buildCategoryMenuItems(locale: string): Promise<CategoryMenuItem[]> {
    const collections = await getTopCollections(locale);
    const t = await getTranslations({locale, namespace: 'Navigation'});

    return collections.map(collection => {
        const meta = CATEGORY_NAV_META.find(m => m.slug === collection.slug);
        const descriptionKey =
            meta?.descriptionKey && DESCRIPTION_KEYS[meta.descriptionKey]
                ? DESCRIPTION_KEYS[meta.descriptionKey]
                : 'categoryDescriptions.featured';

        return {
            id: collection.id,
            name: collection.name,
            slug: collection.slug,
            image: getCategoryNavImage(collection.slug),
            description: t(descriptionKey),
        };
    });
}

export async function CategoryNavBar() {
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const t = await getTranslations({locale, namespace: 'Navigation'});
    const [categories, categoryProducts] = await Promise.all([
        buildCategoryMenuItems(locale),
        getCategoryProductsMap(locale, currencyCode),
    ]);

    return (
        <div className="border-b border-border/60 bg-background">
            <div className="container mx-auto px-3 md:px-4">
                <div className="flex items-center py-2.5">
                    <AllCategoriesMenu
                        categories={categories}
                        categoryProducts={categoryProducts}
                        labels={{
                            allCategories: t('allCategories'),
                            shopAll: t('shopAll'),
                            viewAll: t('viewAllInCategory'),
                            recommended: t('recommended'),
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
