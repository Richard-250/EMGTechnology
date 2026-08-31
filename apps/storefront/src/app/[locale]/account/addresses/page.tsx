import type {Metadata} from 'next';
import {getRouteLocale} from '@/i18n/server';
import { query } from '@/lib/vendure/api';
import { GetCustomerAddressesQuery, GetAvailableCountriesQuery } from '@/lib/vendure/queries';
import { AddressesClient } from './addresses-client';
import {getTranslations} from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Account'});
    return {
        title: t('addressesPageTitle'),
    };
}

export default async function AddressesPage() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Account'});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let addresses: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let countries: any[] = [];

    try {
        const [addressesResult, countriesResult] = await Promise.all([
            query(GetCustomerAddressesQuery, {}, { useAuthToken: true }),
            query(GetAvailableCountriesQuery, {}, { languageCode: locale }),
        ]);
        addresses = addressesResult.data.activeCustomer?.addresses || [];
        countries = countriesResult.data.availableCountries || [];
    } catch {
        // If Vendure is unreachable at build time, render with empty data.
        // At runtime the data will load correctly.
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t('addresses')}</h1>
                <p className="text-muted-foreground mt-2">
                    {t('manageAddresses')}
                </p>
            </div>

            <AddressesClient addresses={addresses} countries={countries} />
        </div>
    );
}
