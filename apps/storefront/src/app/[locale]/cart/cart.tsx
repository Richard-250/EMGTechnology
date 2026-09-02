import {CartProductsPanel, CartEmptyState} from '@/app/[locale]/cart/cart-products-panel';
import {CartBasketTotals} from '@/app/[locale]/cart/cart-basket-totals';
import {getRouteLocale} from '@/i18n/server';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {query} from '@/lib/vendure/api';
import {GetActiveOrderQuery} from '@/lib/vendure/queries';
import {Link} from '@/i18n/navigation';
import {ShoppingCart} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {getActiveCustomer} from '@/lib/vendure/actions';
import {buildSignInHref} from '@/lib/auth-redirect';

export async function Cart() {
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const t = await getTranslations({locale, namespace: 'Cart'});
    const tAuth = await getTranslations({locale, namespace: 'Auth'});
    const customer = await getActiveCustomer();
    const checkoutHref = customer
        ? '/checkout'
        : buildSignInHref({
              redirectTo: '/checkout',
              message: tAuth('checkoutSignInRequired'),
          });

    let activeOrder = null;
    try {
        const {data} = await query(GetActiveOrderQuery, {}, {
            useAuthToken: true,
            languageCode: locale,
            currencyCode,
        });
        activeOrder = data.activeOrder;
    } catch (error) {
        console.error('Error fetching active order for cart page:', error);
    }

    return (
        <>
            {!activeOrder || activeOrder.lines.length === 0 ? (
                <CartEmptyState />
            ) : (
                <>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                        <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-bold">
                            <ShoppingCart className="size-7 text-electric" />
                            {t('myCart')}
                            <span className="text-muted-foreground font-normal text-lg">
                                ({activeOrder.lines.length})
                            </span>
                        </h1>
                        <Link href="/search" className="text-sm font-medium text-electric hover:underline">
                            {t('continueShopping')}
                        </Link>
                    </div>

                    <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start pb-24 sm:pb-0">
                        <CartProductsPanel activeOrder={activeOrder} />
                        <CartBasketTotals activeOrder={activeOrder} checkoutHref={checkoutHref} />
                    </div>
                </>
            )}
        </>
    );
}
