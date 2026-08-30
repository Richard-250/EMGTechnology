import {Suspense} from 'react';
import {redirect} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';

async function LoginRedirect({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const locale = await getRouteLocale();
    const resolvedParams = await searchParams;
    const params = new URLSearchParams();

    const redirectTo =
        (resolvedParams?.redirectTo as string | undefined) ||
        (resolvedParams?.redirect as string | undefined);
    const message = resolvedParams?.message as string | undefined;
    const tab = resolvedParams?.tab as string | undefined;

    if (redirectTo) {
        params.set('redirectTo', redirectTo);
    }
    if (message) {
        params.set('message', message);
    }
    if (tab) {
        params.set('tab', tab);
    }

    const query = params.toString();
    return redirect({href: query ? `/sign-in?${query}` : '/sign-in', locale});
}

export default function LoginAliasPage({searchParams}: PageProps<'/[locale]/login'>) {
    return (
        <Suspense>
            <LoginRedirect searchParams={searchParams} />
        </Suspense>
    );
}
