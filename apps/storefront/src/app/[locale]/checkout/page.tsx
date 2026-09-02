import type {Metadata} from 'next';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import {redirect} from '@/i18n/navigation';
import {connection} from 'next/server';
import CheckoutFlow from './checkout-flow';
import {CheckoutProvider} from './checkout-provider';
import {noIndexRobots} from '@/lib/metadata';
import {getActiveCustomer} from '@/lib/vendure/actions';
import {buildSignInHref} from '@/lib/auth-redirect';
import {loadCheckoutPageData} from './load-checkout-data';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Checkout'});
    return {
        title: t('pageTitle'),
        robots: noIndexRobots(),
    };
}

export default async function CheckoutPage() {
    await connection();

    const locale = await getRouteLocale();
    const tAuth = await getTranslations({locale, namespace: 'Auth'});
    const t = await getTranslations({locale, namespace: 'Checkout'});

    let customer;
    try {
        customer = await getActiveCustomer();
    } catch {
        return redirect({href: '/sign-in', locale});
    }

    if (!customer) {
        return redirect({
            href: buildSignInHref({
                redirectTo: '/checkout',
                message: tAuth('checkoutSignInRequired'),
            }),
            locale,
        });
    }

    const {activeOrder, addresses, countries, shippingMethods, paymentMethods} =
        await loadCheckoutPageData();

    if (!activeOrder || activeOrder.lines.length === 0) {
        return redirect({href: '/cart', locale});
    }

    if (activeOrder.state !== 'AddingItems' && activeOrder.state !== 'ArrangingPayment') {
        return redirect({href: `/order-confirmation/${activeOrder.code}`, locale});
    }

    return (
        <div className="min-h-screen bg-muted/40">
            <div className="container mx-auto px-4 py-8 md:py-10">
                <h1 className="text-2xl md:text-3xl font-bold mb-6">{t('pageTitle')}</h1>
                {paymentMethods.length === 0 && (
                    <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                        {t('noPaymentMethods')}
                    </p>
                )}
                <CheckoutProvider
                    order={activeOrder}
                    addresses={addresses}
                    countries={countries}
                    shippingMethods={shippingMethods}
                    paymentMethods={paymentMethods}
                    isGuest={false}
                >
                    <CheckoutFlow/>
                </CheckoutProvider>
            </div>
        </div>
    );
}
