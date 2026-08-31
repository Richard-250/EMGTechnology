'use server';

import {parse} from 'graphql';
import type {TadaDocumentNode} from 'gql.tada';
import {mutate} from '@/lib/vendure/api';
import {LoginMutation} from '@/lib/vendure/mutations';
import {setAuthToken} from '@/lib/auth';
import {redirect} from '@/i18n/navigation';
import {revalidatePath} from 'next/cache';
import {getLocale, getTranslations} from 'next-intl/server';
import {isRedirectError} from 'next/dist/client/components/redirect-error';

function shopMutation<TResult, TVariables>(source: string) {
    return parse(source) as unknown as TadaDocumentNode<TResult, TVariables>;
}

const RequestSignupOtpDoc = shopMutation<
    {requestSignupOtp: boolean},
    {email: string; firstName: string; lastName: string}
>(`
    mutation RequestSignupOtp($email: String!, $firstName: String!, $lastName: String!) {
        requestSignupOtp(email: $email, firstName: $firstName, lastName: $lastName)
    }
`);

const VerifySignupOtpDoc = shopMutation<{verifySignupOtp: boolean}, {email: string; code: string}>(`
    mutation VerifySignupOtp($email: String!, $code: String!) {
        verifySignupOtp(email: $email, code: $code)
    }
`);

const CompleteSignupDoc = shopMutation<
    {completeSignup: {success: boolean; message: string} | null},
    {email: string; password: string; phoneNumber: string | null}
>(`
    mutation CompleteSignup($email: String!, $password: String!, $phoneNumber: String) {
        completeSignup(email: $email, password: $password, phoneNumber: $phoneNumber) {
            success
            message
        }
    }
`);

export async function requestSignupOtpAction(input: {
    email: string;
    firstName: string;
    lastName: string;
}) {
    const t = await getTranslations('Errors');
    try {
        const result = await mutate(RequestSignupOtpDoc, input);
        if (!result.data.requestSignupOtp) {
            return {error: t('unexpectedError')};
        }
        return {success: true as const};
    } catch (err: any) {
        const message = err?.message || '';
        if (message.includes('EMAIL_EXISTS')) {
            return {error: 'An account with this email address already exists. Please sign in instead.'};
        }
        return {error: t('unexpectedError')};
    }
}

export async function verifySignupOtpAction(email: string, code: string) {
    const t = await getTranslations('Errors');
    try {
        const result = await mutate(VerifySignupOtpDoc, {email, code});
        if (!result.data.verifySignupOtp) {
            return {error: t('invalidOtp')};
        }
        return {success: true as const};
    } catch {
        return {error: t('invalidOtp')};
    }
}

export async function completeSignupAction(input: {
    email: string;
    password: string;
    phoneNumber?: string;
    redirectTo?: string | null;
}) {
    const t = await getTranslations('Errors');
    let targetRedirect: string | null = null;
    let targetLocale = 'en';

    try {
        const result = await mutate(CompleteSignupDoc, {
            email: input.email,
            password: input.password,
            phoneNumber: input.phoneNumber || null,
        });
        const payload = result.data.completeSignup;
        if (!payload?.success) {
            return {error: payload?.message || t('unexpectedError')};
        }

        // Automatically log in the freshly created user
        const loginResult = await mutate(LoginMutation, {
            username: input.email,
            password: input.password,
        }, { useAuthToken: true });

        const authData = loginResult.data.login;
        if (authData.__typename !== 'CurrentUser') {
            return {error: t('invalidCredentials')};
        }

        if (loginResult.token) {
            await setAuthToken(loginResult.token);
        }

        targetLocale = await getLocale();
        revalidatePath(`/${targetLocale}`, 'layout');

        // Safe redirect target: forward user directly to checkout or cart
        const safeRedirect = input.redirectTo?.startsWith('/') && !input.redirectTo.startsWith('//')
            ? input.redirectTo
            : '/checkout';

        targetRedirect = safeRedirect;
    } catch (err) {
        if (isRedirectError(err)) {
            throw err;
        }
        return {error: t('unexpectedError')};
    }

    if (targetRedirect) {
        redirect({href: targetRedirect, locale: targetLocale});
    }
}
