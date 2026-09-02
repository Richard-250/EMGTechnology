'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {useRouter} from '@/i18n/navigation';
import {authenticateWithGoogleAction} from '@/app/[locale]/sign-in/google-actions';
import {useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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

export function GoogleSignInButton({redirectTo}: GoogleSignInButtonProps) {
    const t = useTranslations('Auth');
    const router = useRouter();
    const buttonRef = useRef<HTMLDivElement>(null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sdkReady, setSdkReady] = useState(false);

    const handleCredential = useCallback(
        async (response: {credential: string}) => {
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

        const initializeGoogle = () => {
            if (!window.google || !buttonRef.current) {
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
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: buttonRef.current.offsetWidth || 360,
            });
            setSdkReady(true);
        };

        if (window.google) {
            initializeGoogle();
            return;
        }

        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existingScript) {
            existingScript.addEventListener('load', initializeGoogle);
            return () => existingScript.removeEventListener('load', initializeGoogle);
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = initializeGoogle;
        document.head.appendChild(script);

        return () => {
            script.onload = null;
        };
    }, [handleCredential]);

    if (!GOOGLE_CLIENT_ID) {
        return (
            <div className="space-y-2">
                <div
                    className={cn(
                        'flex h-11 w-full items-center justify-center rounded-md border border-dashed border-border/80',
                        'bg-muted/30 px-4 text-sm text-muted-foreground',
                    )}
                >
                    {t('googleUnavailable')}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div
                className={cn(
                    'relative w-full min-h-11 rounded-md border border-border/80 bg-background',
                    'shadow-xs transition-opacity',
                    pending && 'pointer-events-none opacity-70',
                )}
            >
                <div
                    ref={buttonRef}
                    className={cn(
                        'flex w-full justify-center [&>div]:w-full! [&>div]:justify-center!',
                        !sdkReady && 'invisible absolute inset-0',
                    )}
                    aria-hidden={!sdkReady}
                />
                {!sdkReady && (
                    <div className="flex h-11 items-center justify-center gap-2 px-4 text-sm font-medium text-muted-foreground">
                        <span className="size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                        {t('googleLoading')}
                    </div>
                )}
            </div>
            <p className="text-xs text-center text-muted-foreground leading-relaxed">
                {t('googleSignUpHint')}
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
