'use client';

import {useState, useTransition} from 'react';
import {Search} from 'lucide-react';
import {useRouter} from '@/i18n/navigation';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {useTranslations} from 'next-intl';

export function ProductNotFoundSearch() {
    const t = useTranslations('ProductNotFound');
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;
        startTransition(() => {
            router.push(`/search?q=${encodeURIComponent(trimmed)}`);
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="h-11 pl-9 bg-background"
                    disabled={isPending}
                    aria-label={t('searchPlaceholder')}
                />
            </div>
            <Button type="submit" size="lg" className="h-11 sm:px-6" disabled={isPending || !query.trim()}>
                {t('searchButton')}
            </Button>
        </form>
    );
}
