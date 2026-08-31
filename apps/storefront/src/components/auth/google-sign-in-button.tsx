'use client';

import {useEffect, useRef, useState} from 'react';
import {useRouter} from '@/i18n/navigation';
import {authenticateWithGoogleAction} from '@/app/[locale]/sign-in/google-actions';
import {useTranslations} from 'next-intl';
import {Button} from '@/components/ui/button';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: {credential: string}) => void;
                    }) => void;
                    renderButton: (
                        parent: HTMLElement,
                        options: Record<string, string | boolean | number>,
                    ) => void;
                };
            };
        };
    }
}

function GoogleIcon() {
    return (
        <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
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

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            return;
        }

        const handleCredential = async (response: {credential: string}) => {
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
        };

        const initializeGoogle = () => {
            if (!window.google || !buttonRef.current) {
                return;
            }
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleCredential,
            });
            buttonRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(buttonRef.current, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                width: buttonRef.current.offsetWidth || 360,
            });
            setSdkReady(true);
        };

        if (window.google) {
            initializeGoogle();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = initializeGoogle;
        document.head.appendChild(script);

        return () => {
            script.remove();
        };
    }, [redirectTo, router, t]);

    return (
        <div className="space-y-2">
            <div ref={buttonRef} className="w-full min-h-10 flex justify-center [&>div]:w-full!">
                {(!GOOGLE_CLIENT_ID || !sdkReady) && (
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full h-11 font-medium flex items-center justify-center gap-2 border-border/80 hover:bg-muted/50"
                        disabled={pending}
                        onClick={() => {
                            if (!GOOGLE_CLIENT_ID) {
                                setError('Google Sign-In requires NEXT_PUBLIC_GOOGLE_CLIENT_ID configured in environment.');
                            }
                        }}
                    >
                        <GoogleIcon />
                        <span>{pending ? t('googleSigningIn') : (t('continueWithGoogle') || 'Continue with Google')}</span>
                    </Button>
                )}
            </div>
            <p className="text-xs text-center text-muted-foreground">{t('googleSignUpHint')}</p>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>
    );
}
