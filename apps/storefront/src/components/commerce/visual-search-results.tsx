'use client';

import {useEffect, useState} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Camera, Loader2, RefreshCw} from 'lucide-react';
import {ProductCardInteractive} from '@/components/commerce/product-card-interactive';
import {resolveProductImage} from '@/lib/product-images';
import type {SerializedProductCard} from '@/lib/product-price';
import {
    clearPendingVisualSearch,
    getPendingVisualSearchPreview,
    peekPendingVisualSearchFile,
    takePendingVisualSearchFile,
} from '@/lib/visual-search-store';
import {Button} from '@/components/ui/button';
import {Link} from '@/i18n/navigation';

type Status = 'loading' | 'ready' | 'empty' | 'error' | 'missing';

export function VisualSearchResults({searchKey}: {searchKey: string}) {
    const t = useTranslations('Search');
    const locale = useLocale();
    const [status, setStatus] = useState<Status>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [items, setItems] = useState<SerializedProductCard[]>([]);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const previewUrl = getPendingVisualSearchPreview();
        setPreview(previewUrl);
        setStatus('loading');
        setErrorMessage('');
        setItems([]);

        async function run() {
            const file = peekPendingVisualSearchFile();
            if (!file && !previewUrl) {
                if (!cancelled) setStatus('missing');
                return;
            }

            try {
                const form = new FormData();
                if (file) {
                    form.append('image', file);
                } else if (previewUrl?.startsWith('data:')) {
                    const blob = await (await fetch(previewUrl)).blob();
                    form.append('image', blob, 'query.jpg');
                } else {
                    if (!cancelled) setStatus('missing');
                    return;
                }
                form.append('locale', locale);

                const res = await fetch('/api/search/visual', {
                    method: 'POST',
                    body: form,
                });
                const data = (await res.json()) as {
                    items?: SerializedProductCard[];
                    error?: string;
                };

                if (cancelled) return;

                if (!res.ok) {
                    setStatus('error');
                    setErrorMessage(data.error || t('visualSearchError'));
                    return;
                }

                // Drop the in-memory file only after a successful response
                takePendingVisualSearchFile();
                const next = data.items ?? [];
                setItems(next);
                setStatus(next.length > 0 ? 'ready' : 'empty');
            } catch {
                if (!cancelled) {
                    setStatus('error');
                    setErrorMessage(t('visualSearchError'));
                }
            }
        }

        void run();
        return () => {
            cancelled = true;
        };
        // Re-run whenever the search key (timestamp) changes
    }, [searchKey, locale, t]);

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-electric/30 bg-electric/5 px-4 py-3 flex items-start gap-3">
                <div className="rounded-full bg-electric/15 p-2 text-electric shrink-0">
                    <Camera className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{t('visualSearchResults')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {status === 'loading'
                            ? t('visualSearchLoading')
                            : status === 'empty'
                              ? t('visualSearchEmpty')
                              : status === 'error'
                                ? errorMessage
                                : status === 'missing'
                                  ? t('visualSearchMissing')
                                  : t('imageSearchReadyHint')}
                    </p>
                </div>
                {preview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={preview}
                        alt=""
                        className="size-14 rounded-lg object-cover border border-border shrink-0"
                    />
                )}
            </div>

            {status === 'loading' && (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
                    <Loader2 className="size-8 animate-spin text-electric" />
                    <p className="text-sm font-medium">{t('visualSearchLoading')}</p>
                </div>
            )}

            {(status === 'empty' || status === 'error' || status === 'missing') && (
                <div className="rounded-xl border border-border bg-card px-6 py-12 text-center space-y-4">
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        {status === 'empty'
                            ? t('visualSearchEmpty')
                            : status === 'missing'
                              ? t('visualSearchMissing')
                              : errorMessage || t('visualSearchError')}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                if (status === 'error' && (peekPendingVisualSearchFile() || preview)) {
                                    window.location.href = `/${locale}/search?visual=1&t=${Date.now()}`;
                                    return;
                                }
                                clearPendingVisualSearch();
                                window.location.href = `/${locale}/search`;
                            }}
                        >
                            <RefreshCw className="size-4 mr-2" />
                            {t('visualSearchTryAgain')}
                        </Button>
                        <Button
                            nativeButton={false}
                            render={<Link href="/search" onClick={() => clearPendingVisualSearch()} />}
                            variant="default"
                        >
                            {t('visualSearchBrowseCatalog')}
                        </Button>
                    </div>
                </div>
            )}

            {status === 'ready' && (
                <>
                    <p className="text-sm text-muted-foreground">
                        {t('visualSearchCount', {count: items.length})}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 overflow-visible">
                        {items.map(product => (
                            <ProductCardInteractive
                                key={product.productId}
                                data={{
                                    productId: product.productId,
                                    productVariantId: product.productVariantId,
                                    productName: product.productName,
                                    slug: product.slug,
                                    imageSrc: resolveProductImage(product.image, product.slug),
                                    currencyCode: product.currencyCode,
                                    price: product.price,
                                    priceMin: product.priceMin,
                                    priceMax: product.priceMax,
                                    isPriceRange: Boolean(
                                        product.priceMin != null &&
                                            product.priceMax != null &&
                                            product.priceMin !== product.priceMax,
                                    ),
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
