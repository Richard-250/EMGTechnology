import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';

interface SearchTermProps {
    searchParams: Promise<{
        q?: string;
        visual?: string;
    }>;
}

export async function SearchTerm({searchParams}: SearchTermProps) {
    const searchParamsResolved = await searchParams;
    const searchTerm = (searchParamsResolved.q as string) || '';
    const isVisual = searchParamsResolved.visual === '1';
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Search'});

    const heading = isVisual
        ? t('visualSearchPageTitle')
        : searchTerm
          ? t('resultsFor', {query: searchTerm})
          : t('title');

    return (
        <div className="mb-6">
            <h1 className="font-display text-4xl md:text-5xl tracking-[0.03em]">{heading}</h1>
        </div>
    );
}

export function SearchTermSkeleton() {
    return (
        <div className="mb-6">
            <div className="h-9 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
    );
}
