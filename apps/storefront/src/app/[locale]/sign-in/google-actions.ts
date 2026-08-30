'use server';

import {mutate} from '@/lib/vendure/api';
import {AuthenticateGoogleMutation} from '@/lib/vendure/mutations';
import {setAuthToken} from '@/lib/auth';
import {redirect} from '@/i18n/navigation';
import {revalidatePath} from 'next/cache';
import {getLocale, getTranslations} from 'next-intl/server';

export async function authenticateWithGoogleAction(token: string, redirectTo?: string) {
    const t = await getTranslations('Errors');

    const result = await mutate(
        AuthenticateGoogleMutation,
        {
            input: {
                google: {token},
            },
        } as never,
        {useAuthToken: true},
    );

    const authResult = result.data.authenticate;

    if (authResult.__typename !== 'CurrentUser') {
        return {error: t('googleAuthFailed')};
    }

    if (result.token) {
        await setAuthToken(result.token);
    }

    const locale = await getLocale();
    revalidatePath(`/${locale}`, 'layout');

    const safeRedirect =
        redirectTo?.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/account/profile';

    redirect({href: safeRedirect, locale});
}
