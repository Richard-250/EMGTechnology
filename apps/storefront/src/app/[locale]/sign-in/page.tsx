import type {Metadata} from 'next';
import {Suspense} from 'react';
import {redirect} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import {getActiveCustomer} from '@/lib/vendure/actions';
import {SignInOpenModal} from '@/app/[locale]/sign-in/sign-in-open-modal';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Auth'});
    return {
        title: t('pageTitle'),
    };
}

async function SignInPageContent({searchParams}: PageProps<'/[locale]/sign-in'>) {
    const locale = await getRouteLocale();
    const customer = await getActiveCustomer();

    if (customer) {
        redirect({href: '/account/profile', locale});
    }

    const resolvedParams = await searchParams;
    const tab = resolvedParams?.tab === 'register' ? 'register' : 'sign-in';
    const redirectTo =
        (resolvedParams?.redirectTo as string | undefined) ||
        (resolvedParams?.redirect as string | undefined);
    const message = resolvedParams?.message as string | undefined;

    return (
        <SignInOpenModal
            tab={tab}
            redirectTo={redirectTo}
            message={message}
        />
    );
}

export default function SignInPage(props: PageProps<'/[locale]/sign-in'>) {
    return (
        <Suspense fallback={null}>
            <SignInPageContent {...props} />
        </Suspense>
    );
}
