'use server';

import {mutate} from '@/lib/vendure/api';
import {AuthenticateGoogleMutation} from '@/lib/vendure/mutations';
import {setAuthToken} from '@/lib/auth';
import {redirect} from '@/i18n/navigation';
import {revalidatePath} from 'next/cache';
import {getLocale, getTranslations} from 'next-intl/server';

export async function authenticateWithGoogleAction(token: string, redirectTo?: string) {
    const t = await getTranslations('Errors');

    if (!token?.trim()) {
        return {error: t('googleAuthFailed')};
    }

    let result;
    try {
        result = await mutate(
            AuthenticateGoogleMutation,
            {
                input: {
                    google: {token},
                },
            } as never,
            {useAuthToken: true},
        );
    } catch {
        return {error: t('googleAuthFailed')};
    }

    const authResult = result.data.authenticate;

    if (authResult.__typename !== 'CurrentUser') {
        const message =
            'message' in authResult && authResult.message
                ? String(authResult.message)
                : t('googleAuthFailed');
        return {error: message};
    }

    if (result.token) {
        await setAuthToken(result.token);
    } else {
        return {error: t('googleAuthFailed')};
    }

    const locale = await getLocale();
    revalidatePath(`/${locale}`, 'layout');

    const safeRedirect =
        redirectTo?.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/account/profile';

    redirect({href: safeRedirect, locale});
}
