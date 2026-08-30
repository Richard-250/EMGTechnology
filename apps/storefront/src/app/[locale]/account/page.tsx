import {redirect} from '@/i18n/navigation';
import {getRouteLocale} from '@/i18n/server';

export default async function AccountIndexPage() {
    const locale = await getRouteLocale();
    redirect({href: '/account/profile', locale});
}
