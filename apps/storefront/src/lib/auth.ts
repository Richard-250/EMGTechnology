import {cookies} from 'next/headers';

const AUTH_TOKEN_COOKIE = process.env.VENDURE_AUTH_TOKEN_COOKIE || 'vendure-auth-token';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // matches Vendure authOptions.sessionDuration (7d)
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function authCookieOptions() {
    return {
        httpOnly: true,
        secure: IS_PRODUCTION,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: SESSION_MAX_AGE_SECONDS,
    };
}

export async function setAuthToken(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_TOKEN_COOKIE, token, authCookieOptions());
}

export async function getAuthToken(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
}

export async function removeAuthToken() {
    const cookieStore = await cookies();
    cookieStore.delete({
        name: AUTH_TOKEN_COOKIE,
        path: '/',
    });
}
