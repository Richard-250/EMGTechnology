'use client';

import {useState} from 'react';
import {LoginForm} from '@/app/[locale]/sign-in/login-form';
import {RegistrationForm} from '@/app/[locale]/register/registration-form';
import {GoogleSignInButton} from '@/components/auth/google-sign-in-button';
import {Card, CardContent} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {useTranslations} from 'next-intl';

type AuthTab = 'sign-in' | 'register';

interface AuthTabsPanelProps {
    defaultTab?: AuthTab;
    redirectTo?: string;
    message?: string;
}

export function AuthTabsPanel({defaultTab = 'sign-in', redirectTo, message}: AuthTabsPanelProps) {
    const t = useTranslations('Auth');
    const [activeTab, setActiveTab] = useState<AuthTab>(defaultTab);

    return (
        <Card className="shadow-xl border-border/70 overflow-hidden">
            <div className="flex border-b border-border bg-muted/20">
                <button
                    type="button"
                    onClick={() => setActiveTab('sign-in')}
                    className={cn(
                        'flex-1 py-3.5 text-sm font-semibold transition-colors',
                        activeTab === 'sign-in'
                            ? 'text-electric border-b-2 border-electric bg-background'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {t('signIn')}
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('register')}
                    className={cn(
                        'flex-1 py-3.5 text-sm font-semibold transition-colors',
                        activeTab === 'register'
                            ? 'text-electric border-b-2 border-electric bg-background'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {t('createAccount')}
                </button>
            </div>

            <CardContent className="space-y-6 pt-6 pb-7">
                {message && (
                    <div
                        role="alert"
                        className="rounded-lg border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                    >
                        {message}
                    </div>
                )}

                <div className="rounded-xl border border-border/70 bg-gradient-to-b from-muted/30 to-background p-4 space-y-3">
                    <div className="text-center space-y-1">
                        <p className="text-sm font-semibold text-foreground">{t('quickSignIn')}</p>
                        <p className="text-xs text-muted-foreground">{t('googleSignUpHint')}</p>
                    </div>
                    <GoogleSignInButton redirectTo={redirectTo} />
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wide">
                        <span className="bg-card px-3 text-muted-foreground">{t('orWithEmail')}</span>
                    </div>
                </div>

                {activeTab === 'sign-in' ? (
                    <LoginForm redirectTo={redirectTo} embedded />
                ) : (
                    <RegistrationForm redirectTo={redirectTo} embedded />
                )}
            </CardContent>
        </Card>
    );
}
