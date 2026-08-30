import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['en', 'fr', 'rw'],
    defaultLocale: 'en',
});

export type Locale = (typeof routing.locales)[number];

export const localeNames: Record<Locale, string> = {
    en: 'English',
    fr: 'Français',
    rw: 'Ikinyarwanda',
};
