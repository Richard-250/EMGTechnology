import type {Metadata} from 'next';
import {Suspense} from 'react';
import Image from 'next/image';
import {redirect} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import {AuthTabsPanel} from '@/components/auth/auth-tabs-panel';
import {Skeleton} from '@/components/ui/skeleton';
import {SITE_NAME, SITE_LOGO} from '@/lib/metadata';
import {COMPANY} from '@/lib/company';
import {getActiveCustomer} from '@/lib/vendure/actions';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Auth'});
    return {
        title: t('pageTitle'),
    };
}

function AuthPanelSkeleton() {
    return (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    );
}

function SignInPageSkeleton() {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] mt-16">
            <div className="hidden lg:flex lg:w-1/2 bg-[#0C1210] items-center justify-center p-12 rounded-br-3xl">
                <Skeleton className="h-16 w-48 bg-white/10" />
            </div>
            <div className="flex w-full lg:w-1/2 items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <AuthPanelSkeleton />
                </div>
            </div>
        </div>
    );
}

async function SignInContent({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const resolvedParams = await searchParams;
    const redirectTo =
        (resolvedParams?.redirectTo as string | undefined) ||
        (resolvedParams?.redirect as string | undefined);
    const message = resolvedParams?.message as string | undefined;
    const tab = resolvedParams?.tab === 'register' ? 'register' : 'sign-in';

    return (
        <AuthTabsPanel defaultTab={tab} redirectTo={redirectTo} message={message} />
    );
}

async function SignInPageContent({searchParams}: PageProps<'/[locale]/sign-in'>) {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Auth'});
    const customer = await getActiveCustomer();

    if (customer) {
        redirect({href: '/account/profile', locale});
    }

    return (
        <div className="flex min-h-[calc(100vh-4rem)] mt-16">
            <div className="hidden lg:flex lg:w-1/2 bg-[#0C1210] items-center justify-center p-12 rounded-br-3xl">
                <div className="max-w-md text-white space-y-6">
                    <Image
                        src={SITE_LOGO}
                        alt={SITE_NAME}
                        width={240}
                        height={86}
                        className="h-16 w-auto object-contain"
                        priority
                    />
                    <p className="text-xl text-white/80 leading-relaxed">{t('welcomeBack')}</p>
                    <div className="flex gap-8 pt-4">
                        <div>
                            <p className="text-3xl font-bold text-electric">{t('featureFast')}</p>
                            <p className="text-sm text-white/70">{t('featureCheckout')}</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-electric">{t('featureSecure')}</p>
                            <p className="text-sm text-white/70">{t('featurePayments')}</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-electric">{t('featureEasy')}</p>
                            <p className="text-sm text-white/70">{t('featureReturns')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex w-full lg:w-1/2 items-center justify-center px-4 py-12">
                <div className="w-full max-w-md space-y-6">
                    <div className="space-y-2 text-center">
                        <div className="flex justify-center lg:hidden mb-4">
                            <Image
                                src={SITE_LOGO}
                                alt={SITE_NAME}
                                width={160}
                                height={58}
                                className="h-10 w-auto object-contain"
                            />
                        </div>
                        <h1 className="text-3xl font-bold">{t('signIn')}</h1>
                        <p className="text-muted-foreground">{COMPANY.shortName}</p>
                    </div>
                    <Suspense fallback={<AuthPanelSkeleton />}>
                        <SignInContent searchParams={searchParams} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

export default function SignInPage(props: PageProps<'/[locale]/sign-in'>) {
    return (
        <Suspense fallback={<SignInPageSkeleton />}>
            <SignInPageContent {...props} />
        </Suspense>
    );
}
