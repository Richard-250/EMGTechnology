import type {Metadata} from 'next';
import { getActiveCustomer } from '@/lib/vendure/actions';
import { ChangePasswordForm } from './change-password-form';
import { EditProfileForm } from './edit-profile-form';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Account'});
    return {
        title: t('profilePageTitle'),
    };
}

export default async function ProfilePage() {
    const customer = await getActiveCustomer();
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Account'});

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                {customer?.customFields?.googleProfileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={customer.customFields.googleProfileImageUrl}
                        alt=""
                        className="size-16 rounded-full object-cover border border-border"
                        referrerPolicy="no-referrer"
                    />
                ) : null}
                <div>
                    <h1 className="text-3xl font-bold">{t('profile')}</h1>
                    <p className="text-muted-foreground mt-2">
                        {t('manageAccountInfo')}
                    </p>
                </div>
            </div>

            <EditProfileForm customer={customer} />

            <ChangePasswordForm />
        </div>
    );
}
