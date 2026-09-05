'use client';

import {useEffect, useState} from 'react';
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
    variant?: 'page' | 'modal';
    onTabChange?: (tab: AuthTab) => void;
}

export function AuthTabsPanel({
    defaultTab = 'sign-in',
    redirectTo,
    message,
    variant = 'page',
    onTabChange,
}: AuthTabsPanelProps) {
    const t = useTranslations('Auth');
    const [activeTab, setActiveTab] = useState<AuthTab>(defaultTab);

    useEffect(() => {
        setActiveTab(defaultTab);
    }, [defaultTab]);

    const switchTab = (tab: AuthTab) => {
        setActiveTab(tab);
        onTabChange?.(tab);
    };

    const isModal = variant === 'modal';

    return (
        <Card
            className={cn(
                'overflow-hidden border-border/70',
                isModal ? 'border-0 shadow-none rounded-none bg-transparent' : 'shadow-xl',
            )}
        >
            <div className="flex border-b border-border bg-muted/20">
                <button
                    type="button"
                    onClick={() => switchTab('sign-in')}
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
                    onClick={() => switchTab('register')}
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

            <CardContent className={cn('space-y-5', isModal ? 'pt-5 pb-6 px-5' : 'pt-6 pb-7')}>
                {message && (
                    <div
                        role="alert"
                        className="rounded-lg border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950"
                    >
                        {message}
                    </div>
                )}

                <div className="flex justify-center py-1">
                    <GoogleSignInButton redirectTo={redirectTo} />
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wide">
                        <span className={cn('px-3 text-muted-foreground', isModal ? 'bg-background' : 'bg-card')}>
                            {t('orWithEmail')}
                        </span>
                    </div>
                </div>

                {activeTab === 'sign-in' ? (
                    <LoginForm
                        redirectTo={redirectTo}
                        embedded
                        onSwitchToRegister={() => switchTab('register')}
                    />
                ) : (
                    <RegistrationForm redirectTo={redirectTo} embedded />
                )}
            </CardContent>
        </Card>
    );
}
