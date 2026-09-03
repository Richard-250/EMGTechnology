'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {Link, useRouter} from '@/i18n/navigation';
import {authenticateWithGoogleAction} from '@/app/[locale]/sign-in/google-actions';
import {useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';

const GOOGLE_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: {credential: string}) => void;
                        auto_select?: boolean;
                        cancel_on_tap_outside?: boolean;
                        use_fedcm_for_prompt?: boolean;
                    }) => void;
                    renderButton: (
                        parent: HTMLElement,
                        options: Record<string, string | boolean | number>,
                    ) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

interface GoogleSignInButtonProps {
    redirectTo?: string;
}

/**
 * Google Identity Services "Continue with Google" button.
 * Works for new customers (creates account) and existing customers (login / email link).
 * Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID at storefront build time.
 */
export function GoogleSignInButton({redirectTo}: GoogleSignInButtonProps) {
    const t = useTranslations('Auth');
    const router = useRouter();
    const buttonRef = useRef<HTMLDivElement>(null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sdkReady, setSdkReady] = useState(false);
    const [sdkError, setSdkError] = useState(false);

    const handleCredential = useCallback(
        async (response: {credential: string}) => {
            if (!response?.credential) {
                setError(t('googleAuthFailed'));
                return;
            }
            setPending(true);
            setError(null);
            try {
                const result = await authenticateWithGoogleAction(response.credential, redirectTo);
                if (result?.error) {
                    setError(result.error);
                    return;
                }
                router.refresh();
            } catch {
                setError(t('googleAuthFailed'));
            } finally {
                setPending(false);
            }
        },
        [redirectTo, router, t],
    );

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            return;
        }

        let cancelled = false;
        let resizeObserver: ResizeObserver | null = null;

        const renderGoogleButton = () => {
            if (cancelled || !window.google || !buttonRef.current) {
                return;
            }

            const width = Math.max(buttonRef.current.offsetWidth || 0, 280);

            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredential,
                auto_select: false,
                cancel_on_tap_outside: true,
            });

            buttonRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(buttonRef.current, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width,
            });

            // Ensure the rendered iframe/button is interactive and full-width.
            const iframe = buttonRef.current.querySelector('iframe');
            if (iframe) {
                iframe.style.maxWidth = '100%';
                iframe.style.pointerEvents = 'auto';
            }
            buttonRef.current.style.pointerEvents = 'auto';
            buttonRef.current.style.minHeight = '44px';

            if (!cancelled) {
                setSdkReady(true);
                setSdkError(false);
            }
        };

        const initializeGoogle = () => {
            if (cancelled || !window.google || !buttonRef.current) {
                return;
            }

            renderGoogleButton();

            resizeObserver = new ResizeObserver(() => {
                renderGoogleButton();
            });
            resizeObserver.observe(buttonRef.current);
        };

        if (window.google) {
            initializeGoogle();
        } else {
            const existingScript = document.querySelector(
                'script[src="https://accounts.google.com/gsi/client"]',
            ) as HTMLScriptElement | null;

            if (existingScript) {
                if (window.google) {
                    initializeGoogle();
                } else {
                    existingScript.addEventListener('load', initializeGoogle);
                }
            } else {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                script.onload = initializeGoogle;
                script.onerror = () => {
                    if (!cancelled) {
                        setSdkError(true);
                    }
                };
                document.head.appendChild(script);
            }
        }

        return () => {
            cancelled = true;
            resizeObserver?.disconnect();
        };
    }, [handleCredential]);

    if (!GOOGLE_CLIENT_ID) {
        return (
            <div className="space-y-2">
                <div
                    className={cn(
                        'flex h-11 w-full items-center justify-center rounded-md border border-dashed border-border/80',
                        'bg-muted/30 px-4 text-sm text-muted-foreground text-center',
                    )}
                >
                    {t('googleUnavailable')}
                </div>
            </div>
        );
    }

    if (sdkError) {
        return (
            <div className="space-y-2">
                <div
                    className={cn(
                        'flex h-11 w-full items-center justify-center rounded-md border border-dashed border-border/80',
                        'bg-muted/30 px-4 text-sm text-muted-foreground text-center',
                    )}
                >
                    {t('googleAuthFailed')}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div
                className={cn(
                    'relative w-full min-h-11 overflow-hidden rounded-md border border-border/80 bg-background',
                    'shadow-xs transition-opacity',
                    pending && 'pointer-events-none opacity-70',
                )}
            >
                <div
                    ref={buttonRef}
                    className={cn(
                        'relative z-10 flex w-full min-h-11 items-center justify-center',
                        '[&>div]:w-full! [&>div]:flex! [&>div]:justify-center!',
                        '[&_iframe]:pointer-events-auto!',
                        !sdkReady && 'invisible absolute inset-0',
                    )}
                    aria-hidden={!sdkReady}
                />
                {!sdkReady && (
                    <div className="pointer-events-none flex h-11 items-center justify-center gap-2 px-4 text-sm font-medium text-muted-foreground">
                        <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                        {t('googleLoading')}
                    </div>
                )}
            </div>
            <p className="text-xs text-center text-muted-foreground leading-relaxed">
                {t('googleSignUpHint')}
            </p>
            <p className="text-xs text-center text-muted-foreground leading-relaxed">
                {t.rich('googleLegalNotice', {
                    privacy: chunks => (
                        <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
                            {chunks}
                        </Link>
                    ),
                    terms: chunks => (
                        <Link href="/terms-of-service" className="underline underline-offset-2 hover:text-foreground">
                            {chunks}
                        </Link>
                    ),
                })}
            </p>
            {pending && (
                <p className="text-sm text-center text-muted-foreground">{t('googleSigningIn')}</p>
            )}
            {error && (
                <p className="text-sm text-destructive text-center" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
