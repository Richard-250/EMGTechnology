'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {useRouter} from '@/i18n/navigation';
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
 * Google Identity Services button (icon only).
 * Profile photo appears on the account icon after a successful sign-in.
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

        const renderGoogleButton = () => {
            if (cancelled || !window.google || !buttonRef.current) {
                return;
            }

            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredential,
                auto_select: false,
                cancel_on_tap_outside: true,
            });

            buttonRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(buttonRef.current, {
                type: 'icon',
                theme: 'outline',
                size: 'large',
                shape: 'circle',
            });

            const iframe = buttonRef.current.querySelector('iframe');
            if (iframe) {
                iframe.style.pointerEvents = 'auto';
            }
            buttonRef.current.style.pointerEvents = 'auto';

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
        };
    }, [handleCredential]);

    if (!GOOGLE_CLIENT_ID) {
        return (
            <div
                className={cn(
                    'flex size-11 items-center justify-center rounded-full border border-dashed border-border/80',
                    'bg-muted/30 text-xs text-muted-foreground',
                )}
                title={t('googleUnavailable')}
            >
                G
            </div>
        );
    }

    if (sdkError) {
        return (
            <div
                className={cn(
                    'flex size-11 items-center justify-center rounded-full border border-dashed border-border/80',
                    'bg-muted/30 text-xs text-muted-foreground text-center px-1',
                )}
                title={t('googleAuthFailed')}
            >
                G
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-2">
            <div
                className={cn(
                    'relative flex size-11 items-center justify-center overflow-hidden rounded-full',
                    'border border-border/80 bg-background shadow-xs',
                    pending && 'pointer-events-none opacity-70',
                )}
            >
                <div
                    ref={buttonRef}
                    className={cn(
                        'relative z-10 flex items-center justify-center',
                        '[&_iframe]:pointer-events-auto!',
                        !sdkReady && 'invisible absolute inset-0',
                    )}
                    aria-hidden={!sdkReady}
                />
                {!sdkReady && (
                    <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                )}
            </div>
            {pending && (
                <p className="text-xs text-muted-foreground">{t('googleSigningIn')}</p>
            )}
            {error && (
                <p className="text-sm text-destructive text-center" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
