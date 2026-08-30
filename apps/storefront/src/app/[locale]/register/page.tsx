import type {Metadata} from 'next';
import {Suspense} from 'react';
import {redirect} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Auth'});
    return {
        title: t('createAccount'),
    };
}

async function RegisterRedirect({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const locale = await getRouteLocale();
    const resolvedParams = await searchParams;
    const params = new URLSearchParams();
    params.set('tab', 'register');

    const redirectTo =
        (resolvedParams?.redirectTo as string | undefined) ||
        (resolvedParams?.redirect as string | undefined);
    const message = resolvedParams?.message as string | undefined;
    if (redirectTo) {
        params.set('redirectTo', redirectTo);
    }
    if (message) {
        params.set('message', message);
    }

    return redirect({href: `/sign-in?${params.toString()}`, locale});
}

export default function RegisterPage({searchParams}: PageProps<'/[locale]/register'>) {
    return (
        <Suspense>
            <RegisterRedirect searchParams={searchParams} />
        </Suspense>
    );
}
