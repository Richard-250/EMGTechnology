'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {useRouter} from '@/i18n/navigation';
import {authenticateWithGoogleAction} from '@/app/[locale]/sign-in/google-actions';
import {useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';
import {isRedirectError} from 'next/dist/client/components/redirect-error';
import {useAuthModalOptional} from '@/components/auth/auth-modal-provider';

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
    /** Passed from the server so the button works even if client env is missing. */
    clientId?: string;
}

function GoogleMark({className}: {className?: string}) {
    return (
        <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    );
}

/**
 * Visible full-width Continue with Google control.
 * GIS renders into a transparent overlay so the branded button stays visible.
 */
export function GoogleSignInButton({redirectTo, clientId}: GoogleSignInButtonProps) {
    const t = useTranslations('Auth');
    const router = useRouter();
    const authModal = useAuthModalOptional();
    const hostRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sdkReady, setSdkReady] = useState(false);
    const [sdkError, setSdkError] = useState(false);

    const resolvedClientId = (
        clientId ||
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        ''
    ).trim();

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
                // Successful auth redirects via the server action.
                authModal?.closeAuth();
                router.refresh();
            } catch (err) {
                // redirect() throws NEXT_REDIRECT — treat as success and close the modal.
                if (isRedirectError(err)) {
                    authModal?.closeAuth();
                    return;
                }
                setError(t('googleAuthFailed'));
            } finally {
                setPending(false);
            }
        },
        [authModal, redirectTo, router, t],
    );

    useEffect(() => {
        if (!resolvedClientId) {
            return;
        }

        let cancelled = false;

        const renderGoogleButton = () => {
            if (cancelled || !window.google || !overlayRef.current || !hostRef.current) {
                return;
            }

            window.google.accounts.id.initialize({
                client_id: resolvedClientId,
                callback: handleCredential,
                auto_select: false,
                cancel_on_tap_outside: true,
            });

            const width = Math.max(hostRef.current.clientWidth || 320, 240);

            overlayRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(overlayRef.current, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width,
            });

            // Make the GIS iframe fill the host so clicks hit Google, while our
            // branded button remains visible underneath for a consistent look.
            const iframe = overlayRef.current.querySelector('iframe');
            if (iframe) {
                iframe.style.width = '100%';
                iframe.style.height = '100%';
                iframe.style.opacity = '0.011';
            }
            overlayRef.current.style.width = '100%';
            overlayRef.current.style.height = '100%';

            if (!cancelled) {
                setSdkReady(true);
                setSdkError(false);
            }
        };

        const initializeGoogle = () => {
            if (cancelled || !window.google) return;
            renderGoogleButton();
        };

        if (window.google) {
            initializeGoogle();
        } else {
            const existingScript = document.querySelector(
                'script[src="https://accounts.google.com/gsi/client"]',
            ) as HTMLScriptElement | null;

            if (existingScript) {
                existingScript.addEventListener('load', initializeGoogle);
                if (window.google) initializeGoogle();
            } else {
                const script = document.createElement('script');
                script.src = 'https://accounts.google.com/gsi/client';
                script.async = true;
                script.defer = true;
                script.onload = initializeGoogle;
                script.onerror = () => {
                    if (!cancelled) setSdkError(true);
                };
                document.head.appendChild(script);
            }
        }

        const onResize = () => {
            if (window.google && overlayRef.current) {
                renderGoogleButton();
            }
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelled = true;
            window.removeEventListener('resize', onResize);
        };
    }, [handleCredential, resolvedClientId]);

    if (!resolvedClientId) {
        return (
            <div
                className={cn(
                    'flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border',
                    'bg-background text-sm font-semibold text-muted-foreground shadow-xs',
                )}
                title={t('googleUnavailable')}
            >
                <GoogleMark className="size-5 opacity-50" />
                {t('continueWithGoogle')}
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col gap-2">
            <div
                ref={hostRef}
                className={cn(
                    'relative flex h-11 w-full items-center justify-center overflow-hidden rounded-md',
                    'border border-border bg-background shadow-xs',
                    pending && 'pointer-events-none opacity-70',
                )}
            >
                {/* Visible branded face — always shown so the control never looks empty */}
                <div
                    className={cn(
                        'pointer-events-none absolute inset-0 z-0 flex items-center justify-center gap-2',
                        'px-4 text-sm font-semibold text-foreground',
                    )}
                    aria-hidden
                >
                    <GoogleMark className="size-5 shrink-0" />
                    <span>{t('continueWithGoogle')}</span>
                </div>

                {/* Invisible GIS hit-target on top */}
                <div
                    ref={overlayRef}
                    className={cn(
                        'absolute inset-0 z-10',
                        (!sdkReady || sdkError) && 'pointer-events-none',
                    )}
                    aria-label={t('continueWithGoogle')}
                />

                {!sdkReady && !sdkError && (
                    <span className="absolute right-3 size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                )}
            </div>
            {pending && (
                <p className="text-center text-xs text-muted-foreground">{t('googleSigningIn')}</p>
            )}
            {(error || sdkError) && (
                <p className="text-center text-sm text-destructive" role="alert">
                    {error || t('googleAuthFailed')}
                </p>
            )}
        </div>
    );
}
