import {hasLocale} from 'next-intl';
import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

function deepMergeMessages(
    base: Record<string, unknown>,
    override: Record<string, unknown>,
): Record<string, unknown> {
    const out: Record<string, unknown> = {...base};
    for (const [key, value] of Object.entries(override)) {
        const existing = out[key];
        if (
            value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            existing &&
            typeof existing === 'object' &&
            !Array.isArray(existing)
        ) {
            out[key] = deepMergeMessages(
                existing as Record<string, unknown>,
                value as Record<string, unknown>,
            );
        } else {
            out[key] = value;
        }
    }
    return out;
}

export default getRequestConfig(async ({requestLocale}) => {
    const requested = (await requestLocale) as string;
    const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
    const en = (await import('../../messages/en.json')).default as Record<string, unknown>;
    const localized =
        locale === 'en'
            ? en
            : ((await import(`../../messages/${locale}.json`)).default as Record<string, unknown>);
    return {
        locale,
        // Always fall back to English for any missing nested keys (prevents checkout SSR crashes)
        messages: locale === 'en' ? en : deepMergeMessages(en, localized),
    };
});
