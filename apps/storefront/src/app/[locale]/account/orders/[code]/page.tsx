import type {Metadata} from 'next';
import {Suspense} from 'react';
import {query} from '@/lib/vendure/api';
import {GetOrderDetailQuery} from '@/lib/vendure/queries';
import {getTranslations} from 'next-intl/server';
import {getRouteLocale} from '@/i18n/server';
import {OrderDetail} from './order-detail';

type OrderDetailPageProps = PageProps<'/[locale]/account/orders/[code]'>;

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
    // Wrap in try-catch so build-time prerender doesn't fail if Vendure is offline.
    const orderPromise = props.params.then(async ({code}) => {
        try {
            return await query(GetOrderDetailQuery, {code}, {useAuthToken: true, fetch: {}});
        } catch {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return { data: { orderByCode: null } } as any;
        }
    });

    return (
        <Suspense fallback={<div className="p-8 text-center">{t('loading')}</div>}>
            <OrderDetail orderPromise={orderPromise} />
        </Suspense>
    );
}
