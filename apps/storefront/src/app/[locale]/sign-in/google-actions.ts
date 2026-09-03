'use server';

import {mutate} from '@/lib/vendure/api';
import {AuthenticateGoogleMutation} from '@/lib/vendure/mutations';
import {setAuthToken} from '@/lib/auth';
import {redirect} from '@/i18n/navigation';
import {revalidatePath} from 'next/cache';
import {getLocale, getTranslations} from 'next-intl/server';

function mapGoogleAuthError(message: string | undefined, t: Awaited<ReturnType<typeof getTranslations>>) {
    if (!message) {
        return t('googleAuthFailed');
    }
    if (message.includes('GOOGLE_EMAIL_NOT_VERIFIED') || /unverified/i.test(message)) {
        return t('googleEmailNotVerified');
    }
    return message.length < 160 ? message : t('googleAuthFailed');
}

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
            },
            {useAuthToken: true},
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : undefined;
        return {error: mapGoogleAuthError(message, t)};
    }

    const authResult = result.data.authenticate;

    if (authResult.__typename !== 'CurrentUser') {
        const message =
            'message' in authResult && authResult.message
                ? String(authResult.message)
                : undefined;
        return {error: mapGoogleAuthError(message, t)};
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
