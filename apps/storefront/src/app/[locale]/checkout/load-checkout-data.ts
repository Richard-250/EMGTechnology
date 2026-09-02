import {getRouteLocale} from '@/i18n/server';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {query} from '@/lib/vendure/api';
import {
    GetActiveOrderForCheckoutQuery,
    GetActiveOrderQuery,
    GetCustomerAddressesQuery,
    GetEligiblePaymentMethodsBasicQuery,
    GetEligiblePaymentMethodsQuery,
    GetEligibleShippingMethodsQuery,
} from '@/lib/vendure/queries';
import {getAvailableCountriesCached} from '@/lib/vendure/cached';
import type {CheckoutOrder} from './types';

type QueryOptions = {
    useAuthToken: true;
    currencyCode: string;
    languageCode?: string;
};

export async function loadCheckoutOrder(options: QueryOptions): Promise<CheckoutOrder | null> {
    try {
        const result = await query(GetActiveOrderForCheckoutQuery, {}, options);
        return result.data.activeOrder ?? null;
    } catch (error) {
        console.error('Checkout order query failed, retrying without order customFields:', error);
    }

    try {
        const result = await query(GetActiveOrderQuery, {}, options);
        const order = result.data.activeOrder;
        if (!order) {
            return null;
        }

        return {
            ...order,
            customFields: null,
            customer: null,
            shippingAddress: null,
            billingAddress: null,
            shippingLines: [],
        } as CheckoutOrder;
    } catch (error) {
        console.error('Fallback checkout order query failed:', error);
        return null;
    }
}

export async function loadCheckoutPaymentMethods(options: QueryOptions) {
    try {
        const result = await query(GetEligiblePaymentMethodsQuery, {}, options);
        return result.data.eligiblePaymentMethods?.filter(method => method.isEligible) ?? [];
    } catch (error) {
        console.error('Payment methods query failed, retrying without customFields:', error);
    }

    try {
        const result = await query(GetEligiblePaymentMethodsBasicQuery, {}, options);
        return result.data.eligiblePaymentMethods?.filter(method => method.isEligible) ?? [];
    } catch (error) {
        console.error('Fallback payment methods query failed:', error);
        return [];
    }
}

export async function loadCheckoutPageData() {
    const locale = await getRouteLocale();
    const currencyCode = await getActiveCurrencyCode();
    const options: QueryOptions = {useAuthToken: true, currencyCode, languageCode: locale};

    const [activeOrder, addressesResult, countries, shippingMethodsResult, paymentMethods] =
        await Promise.all([
            loadCheckoutOrder(options),
            query(GetCustomerAddressesQuery, {}, options).catch(error => {
                console.error('Customer addresses query failed:', error);
                return {data: {activeCustomer: null}};
            }),
            getAvailableCountriesCached(locale).catch(error => {
                console.error('Countries query failed:', error);
                return [];
            }),
            query(GetEligibleShippingMethodsQuery, {}, options).catch(error => {
                console.error('Shipping methods query failed:', error);
                return {data: {eligibleShippingMethods: []}};
            }),
            loadCheckoutPaymentMethods(options),
        ]);

    return {
        locale,
        activeOrder,
        addresses: addressesResult.data.activeCustomer?.addresses ?? [],
        countries,
        shippingMethods: shippingMethodsResult.data.eligibleShippingMethods ?? [],
        paymentMethods,
    };
}
