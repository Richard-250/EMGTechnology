import type {Metadata} from 'next';
import {Suspense} from 'react';
import {query} from '@/lib/vendure/api';
import {GetOrderDetailQuery} from '@/lib/vendure/queries';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/i18n/server';
import {OrderDetail} from './order-detail';

type OrderDetailPageProps = PageProps<'/[locale]/account/orders/[code]'>;

// Tell Next.js not to prerender any specific order codes at build time.
// Orders are user-specific and require auth — always render on-demand.
export async function generateStaticParams() {
    return [];
}

export async function generateMetadata({params}: OrderDetailPageProps): Promise<Metadata> {
    const {code} = await params;
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Account'});
    return {
        title: t('order', {code}),
    };
}

export default async function OrderDetailPage(props: PageProps<'/[locale]/account/orders/[code]'>) {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Common'});

    // Start the fetch in the page (dynamic parent) and pass promise into Suspense.
    const orderPromise = props.params.then(({code}) =>
        query(GetOrderDetailQuery, {code}, {useAuthToken: true, fetch: {}})
    );

    return (
        <Suspense fallback={<div className="p-8 text-center">{t('loading')}</div>}>
            <OrderDetail orderPromise={orderPromise} />
        </Suspense>
    );
}
