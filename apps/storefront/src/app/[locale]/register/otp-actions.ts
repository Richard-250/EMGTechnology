'use server';

import {parse} from 'graphql';
import type {TadaDocumentNode} from 'gql.tada';
import {mutate} from '@/lib/vendure/api';
import {loginAction} from '@/app/[locale]/sign-in/actions';
import {getTranslations} from 'next-intl/server';

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
    } catch {
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

        const formData = new FormData();
        formData.append('username', input.email);
        formData.append('password', input.password);
        if (input.redirectTo) {
            formData.append('redirectTo', input.redirectTo);
        }
        const loginResult = await loginAction(undefined, formData);
        if (loginResult?.error) {
            return {error: loginResult.error};
        }
        return {success: true as const};
    } catch {
        return {error: t('unexpectedError')};
    }
}
