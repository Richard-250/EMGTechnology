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
        <Card className="shadow-lg border-border/80">
            <div className="flex border-b border-border">
                <button
                    type="button"
                    onClick={() => setActiveTab('sign-in')}
                    className={cn(
                        'flex-1 py-3.5 text-sm font-semibold transition-colors',
                        activeTab === 'sign-in'
                            ? 'text-electric border-b-2 border-electric'
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
                            ? 'text-electric border-b-2 border-electric'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    {t('createAccount')}
                </button>
            </div>

            <CardContent className="space-y-5 pt-5">
                {message && (
                    <div
                        role="alert"
                        className="rounded-lg border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                    >
                        {message}
                    </div>
                )}

                <GoogleSignInButton redirectTo={redirectTo} />

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">{t('orWithEmail')}</span>
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
