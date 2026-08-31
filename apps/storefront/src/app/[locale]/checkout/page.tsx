import type {Metadata} from 'next';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import {query} from '@/lib/vendure/api';
import {
    GetActiveOrderForCheckoutQuery,
    GetCustomerAddressesQuery,
    GetEligiblePaymentMethodsQuery,
    GetEligibleShippingMethodsQuery,
} from '@/lib/vendure/queries';
import {redirect} from '@/i18n/navigation';
import CheckoutFlow from './checkout-flow';
import {CheckoutProvider} from './checkout-provider';
import {noIndexRobots} from '@/lib/metadata';
import {getActiveCustomer} from '@/lib/vendure/actions';
import {buildSignInHref} from '@/lib/auth-redirect';
import {getAvailableCountriesCached} from '@/lib/vendure/cached';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Checkout'});
    return {
        title: t('pageTitle'),
        robots: noIndexRobots(),
    };
}

export default async function CheckoutPage() {
    const locale = await getRouteLocale();
    const tAuth = await getTranslations({locale, namespace: 'Auth'});

    let customer;
    try {
        customer = await getActiveCustomer();
    } catch {
        // Vendure unreachable — redirect to sign-in
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

    const currencyCode = await getActiveCurrencyCode();
    const t = await getTranslations({locale, namespace: 'Checkout'});
    const isGuest = false;

    let activeOrder: NonNullable<unknown> | null = null;
    let addresses: NonNullable<unknown>[] = [];
    let countries: NonNullable<unknown>[] = [];
    let shippingMethods: NonNullable<unknown>[] = [];
    let paymentMethods: NonNullable<unknown>[] = [];

    try {
        const [orderRes, addressesRes, countriesRes, shippingMethodsRes, paymentMethodsRes] =
            await Promise.all([
                query(GetActiveOrderForCheckoutQuery, {}, {useAuthToken: true, currencyCode}),
                query(GetCustomerAddressesQuery, {}, {useAuthToken: true}),
                getAvailableCountriesCached(locale),
                query(GetEligibleShippingMethodsQuery, {}, {useAuthToken: true, currencyCode}),
                query(GetEligiblePaymentMethodsQuery, {}, {useAuthToken: true, currencyCode}),
            ]);

        activeOrder = orderRes.data.activeOrder ?? null;
        addresses = addressesRes.data.activeCustomer?.addresses || [];
        countries = countriesRes;
        shippingMethods = shippingMethodsRes.data.eligibleShippingMethods || [];
        paymentMethods =
            paymentMethodsRes.data.eligiblePaymentMethods?.filter((m) => m.isEligible) || [];
    } catch {
        return redirect({href: '/cart', locale});
    }

    if (!activeOrder || (activeOrder as {lines: unknown[]}).lines.length === 0) {
        return redirect({href: '/cart', locale});
    }

    const order = activeOrder as {state: string; code: string; lines: unknown[]};
    if (order.state !== 'AddingItems' && order.state !== 'ArrangingPayment') {
        return redirect({href: `/order-confirmation/${order.code}`, locale});
    }

    return (
        <div className="min-h-screen bg-muted/40">
            <div className="container mx-auto px-4 py-8 md:py-10">
                <h1 className="text-2xl md:text-3xl font-bold mb-6">{t('pageTitle')}</h1>
                <CheckoutProvider
                    order={activeOrder}
                    addresses={addresses}
                    countries={countries}
                    shippingMethods={shippingMethods}
                    paymentMethods={paymentMethods}
                    isGuest={isGuest}
                >
                    <CheckoutFlow/>
                </CheckoutProvider>
            </div>
        </div>
    );
}
