export function buildSignInHref(options: {
    redirectTo?: string;
    message?: string;
}): string {
    const params = new URLSearchParams();
    if (options.redirectTo) {
        params.set('redirectTo', options.redirectTo);
    }
    if (options.message) {
        params.set('message', options.message);
    }
    const query = params.toString();
    return query ? `/sign-in?${query}` : '/sign-in';
}
