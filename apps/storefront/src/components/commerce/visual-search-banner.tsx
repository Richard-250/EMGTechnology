'use client';

import {useTranslations} from 'next-intl';
import {Camera} from 'lucide-react';

export function VisualSearchBanner() {
    const t = useTranslations('Search');

    return (
        <div className="mb-6 rounded-xl border border-electric/30 bg-electric/5 px-4 py-3 flex items-start gap-3">
            <div className="rounded-full bg-electric/15 p-2 text-electric shrink-0">
                <Camera className="size-4" />
            </div>
            <div>
                <p className="text-sm font-semibold text-foreground">{t('visualSearchResults')}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('imageSearchReadyHint')}</p>
            </div>
        </div>
    );
}
