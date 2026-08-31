import { InitialData, LanguageCode, Permission } from '@vendure/core';

/**
 * Base commerce setup + fitness collections (filtered by product facets).
 */
export const initialData: InitialData = {
    defaultLanguage: LanguageCode.en,
    defaultZone: 'Africa',
    countries: [
        { name: 'Rwanda', code: 'RW', zone: 'Africa' },
        { name: 'Kenya', code: 'KE', zone: 'Africa' },
        { name: 'Uganda', code: 'UG', zone: 'Africa' },
        { name: 'Tanzania', code: 'TZ', zone: 'Africa' },
        { name: 'United States', code: 'US', zone: 'Americas' },
        { name: 'United Kingdom', code: 'GB', zone: 'Europe' },
    ],
    taxRates: [
        { name: 'Standard Tax', percentage: 18 },
        { name: 'Zero Tax', percentage: 0 },
    ],
    shippingMethods: [
        { name: 'Kigali - Moto-taxi', price: 0 },
        { name: 'Pickup at Store', price: 0 },
        { name: 'Express 2-Hour - Kigali', price: 350000 },
    ],
    paymentMethods: [
        {
            name: 'Card',
            handler: {
                code: 'dummy-payment-handler',
                arguments: [{ name: 'automaticSettle', value: 'true' }],
            },
        },
        {
            name: 'MTN Rwanda',
            handler: {
                code: 'dummy-payment-handler',
                arguments: [{ name: 'automaticSettle', value: 'true' }],
            },
        },
        {
            name: 'Airtel Rwanda',
            handler: {
                code: 'dummy-payment-handler',
                arguments: [{ name: 'automaticSettle', value: 'true' }],
            },
        },
    ],
    collections: [
        {
            name: 'Featured',
            filters: [
                {
                    code: 'facet-value-filter',
                    args: { facetValueNames: ['Featured'], containsAny: false },
                },
            ],
        },
        {
            name: 'Cardio',
            filters: [
                {
                    code: 'facet-value-filter',
                    args: { facetValueNames: ['Cardio'], containsAny: false },
                },
            ],
        },
        {
            name: 'Strength',
            filters: [
                {
                    code: 'facet-value-filter',
                    args: { facetValueNames: ['Strength'], containsAny: false },
                },
            ],
        },
        {
            name: 'Home Gyms',
            filters: [
                {
                    code: 'facet-value-filter',
                    args: { facetValueNames: ['Home Gyms'], containsAny: false },
                },
            ],
        },
        {
            name: 'Accessories',
            filters: [
                {
                    code: 'facet-value-filter',
                    args: { facetValueNames: ['Accessories'], containsAny: false },
                },
            ],
        },
    ],
    roles: [
        {
            code: 'administrator',
            description: 'Administrator',
            permissions: [
                Permission.CreateCatalog,
                Permission.ReadCatalog,
                Permission.UpdateCatalog,
                Permission.DeleteCatalog,
                Permission.CreateSettings,
                Permission.ReadSettings,
                Permission.UpdateSettings,
                Permission.DeleteSettings,
                Permission.CreateCustomer,
                Permission.ReadCustomer,
                Permission.UpdateCustomer,
                Permission.DeleteCustomer,
                Permission.CreateCustomerGroup,
                Permission.ReadCustomerGroup,
                Permission.UpdateCustomerGroup,
                Permission.DeleteCustomerGroup,
                Permission.CreateOrder,
                Permission.ReadOrder,
                Permission.UpdateOrder,
                Permission.DeleteOrder,
                Permission.CreateSystem,
                Permission.ReadSystem,
                Permission.UpdateSystem,
                Permission.DeleteSystem,
            ],
        },
    ],
};
