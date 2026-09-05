'use client';

import {useCallback, useEffect, useMemo, useRef, useState, useTransition} from 'react';
import {useSearchParams} from 'next/navigation';
import {useRouter} from '@/i18n/navigation';
import {Camera, Clock, Search, X} from 'lucide-react';
import Image from 'next/image';
import {useLocale, useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';
import {Price} from '@/components/commerce/price';
import {resolveProductImage} from '@/lib/product-images';
import type {SerializedProductCard} from '@/lib/product-price';
import {
    addSearchHistory,
    blendProductsWithSearchHistory,
    clearSearchHistory,
    getSearchHistory,
    removeSearchHistoryItem,
    setSearchHistoryOwner,
    type SearchHistoryEntry,
} from '@/lib/search-history';
import {toast} from 'sonner';

interface BrowseCategory {
    slug: string;
    name: string;
    collectionSlug: string;
}

interface NavbarSearchBarProps {
    className?: string;
    browseCategories: BrowseCategory[];
    categoryProducts: Record<string, SerializedProductCard[]>;
    /** Vendure customer id when logged in; null/undefined for guests. */
    customerId?: string | null;
}

export function NavbarSearchBar({
    className,
    browseCategories,
    categoryProducts,
    customerId = null,
}: NavbarSearchBarProps) {
    const t = useTranslations('Search');
    const tNav = useTranslations('Navigation');
    const locale = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');
    const [isOpen, setIsOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState(browseCategories[0]?.slug ?? '');
    const [suggestions, setSuggestions] = useState<SerializedProductCard[]>([]);
    const [historyItems, setHistoryItems] = useState<SearchHistoryEntry[]>([]);
    const [historyProducts, setHistoryProducts] = useState<SerializedProductCard[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [loadingHistoryProducts, setLoadingHistoryProducts] = useState(false);
    const [visualSearchActive, setVisualSearchActive] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const catalogPool = useMemo(() => {
        const seen = new Set<string>();
        const items: SerializedProductCard[] = [];
        for (const list of Object.values(categoryProducts)) {
            for (const item of list) {
                if (seen.has(item.productId)) continue;
                seen.add(item.productId);
                items.push(item);
            }
        }
        return items;
    }, [categoryProducts]);

    useEffect(() => {
        setSearchHistoryOwner(customerId);
        setHistoryItems(getSearchHistory());
    }, [customerId]);

    useEffect(() => {
        setSearchValue(searchParams.get('q') || '');
    }, [searchParams]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadHistoryProducts = useCallback(
        async (history: SearchHistoryEntry[]) => {
            if (history.length === 0) {
                setHistoryProducts([]);
                return;
            }

            const terms = history.map(h => h.query);
            const fromCatalog = blendProductsWithSearchHistory(
                catalogPool,
                item => item.productName,
                terms,
            ).slice(0, 6);

            if (fromCatalog.length >= 3) {
                setHistoryProducts(fromCatalog);
                return;
            }

            setLoadingHistoryProducts(true);
            try {
                // One lightweight suggest for the latest term only (avoids slowing search UX)
                const latest = history[0]?.query;
                if (!latest) {
                    setHistoryProducts(fromCatalog);
                    return;
                }
                const params = new URLSearchParams({q: latest, locale});
                const res = await fetch(`/api/search/suggest?${params}`);
                const data = (await res.json()) as {items: SerializedProductCard[]};
                const merged = blendProductsWithSearchHistory(
                    [...fromCatalog, ...(data.items ?? [])],
                    item => item.productName,
                    terms,
                );
                const seen = new Set<string>();
                const unique = merged.filter(item => {
                    if (seen.has(item.productId)) return false;
                    seen.add(item.productId);
                    return true;
                });
                setHistoryProducts(unique.slice(0, 6));
            } catch {
                setHistoryProducts(fromCatalog);
            } finally {
                setLoadingHistoryProducts(false);
            }
        },
        [catalogPool, locale],
    );

    useEffect(() => {
        if (isOpen && !searchValue.trim()) {
            const history = getSearchHistory();
            setHistoryItems(history);
            void loadHistoryProducts(history);
        }
    }, [isOpen, searchValue, loadHistoryProducts]);

    const fetchSuggestions = useCallback(
        async (term: string) => {
            if (!term.trim()) {
                setSuggestions([]);
                return;
            }
            setLoadingSuggestions(true);
            try {
                const params = new URLSearchParams({q: term.trim(), locale});
                const res = await fetch(`/api/search/suggest?${params}`);
                const data = (await res.json()) as {items: SerializedProductCard[]};
                const items = data.items ?? [];
                const historyTerms = getSearchHistory().map(h => h.query);
                setSuggestions(
                    historyTerms.length
                        ? blendProductsWithSearchHistory(items, i => i.productName, historyTerms)
                        : items,
                );
            } catch {
                setSuggestions([]);
            } finally {
                setLoadingSuggestions(false);
            }
        },
        [locale],
    );

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!searchValue.trim()) {
            setSuggestions([]);
            return;
        }
        debounceRef.current = setTimeout(() => {
            void fetchSuggestions(searchValue);
        }, 250);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchValue, fetchSuggestions]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsOpen(false);

        if (visualSearchActive) {
            sessionStorage.setItem('emg-visual-search', String(Date.now()));
            startTransition(() => {
                router.push(`/search?visual=1&sort=shuffle&t=${Date.now()}`);
            });
            return;
        }

        if (!searchValue.trim()) return;
        const nextHistory = addSearchHistory(searchValue.trim());
        setHistoryItems(nextHistory);
        startTransition(() => {
            router.push(`/search?q=${encodeURIComponent(searchValue.trim())}&sort=shuffle`);
        });
    };

    const searchFromHistory = (query: string) => {
        setSearchValue(query);
        addSearchHistory(query);
        setHistoryItems(getSearchHistory());
        setIsOpen(false);
        startTransition(() => {
            router.push(`/search?q=${encodeURIComponent(query)}&sort=shuffle`);
        });
    };

    const removeHistoryItem = (query: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setHistoryItems(removeSearchHistoryItem(query));
        setHistoryProducts(prev =>
            blendProductsWithSearchHistory(
                prev,
                item => item.productName,
                getSearchHistory().map(h => h.query),
            ),
        );
    };

    const handleClearHistory = (e: React.MouseEvent) => {
        e.stopPropagation();
        setHistoryItems(clearSearchHistory());
        setHistoryProducts([]);
    };

    const goTo = (href: string) => {
        setIsOpen(false);
        startTransition(() => router.push(href));
    };

    const handleImageSearch = () => {
        fileInputRef.current?.click();
    };

    const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error(t('imageSearchInvalid'));
            return;
        }
        setVisualSearchActive(true);
        setSearchValue('');
        toast.success(t('imageSearchReady'), {
            description: t('imageSearchReadyHint'),
        });
    };

    const trimmed = searchValue.trim();
    const isTyping = trimmed.length > 0;
    const activeProducts =
        categoryProducts[activeCategory] ?? categoryProducts[browseCategories[0]?.slug] ?? [];
    const activeCategoryName =
        browseCategories.find(c => c.slug === activeCategory)?.name ?? browseCategories[0]?.name;

    const showPanel = isOpen && (isTyping ? true : browseCategories.length > 0 || historyItems.length > 0);

    return (
        <div
            ref={wrapperRef}
            className={cn('relative w-full', className)}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <form
                onSubmit={handleSubmit}
                className="flex w-full items-center rounded-full border-2 border-foreground/10 bg-background overflow-hidden shadow-sm focus-within:border-foreground/30 transition-colors"
            >
                <input
                    type="search"
                    placeholder={visualSearchActive ? t('imageSearchPlaceholder') : tNav('searchProducts')}
                    className={cn(
                        'flex-1 min-w-0 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground',
                        visualSearchActive && 'text-electric font-medium',
                    )}
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    disabled={isPending}
                    autoComplete="off"
                />
                <button
                    type="button"
                    onClick={handleImageSearch}
                    className={cn(
                        'flex size-9 shrink-0 items-center justify-center transition-colors',
                        visualSearchActive ? 'text-electric' : 'text-muted-foreground hover:text-foreground',
                    )}
                    aria-label={t('searchByImage')}
                >
                    <Camera className="size-4" />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelected}
                />
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex h-10 w-12 shrink-0 items-center justify-center bg-foreground text-background hover:bg-foreground/90 transition-colors m-0.5 rounded-full"
                    aria-label={tNav('searchProducts')}
                >
                    <Search className="size-4" />
                </button>
            </form>

            {showPanel && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-border bg-background shadow-2xl overflow-hidden">
                    {isTyping ? (
                        <div className="max-h-[28rem] overflow-y-auto">
                            <p className="px-4 py-2.5 text-xs font-semibold text-muted-foreground border-b border-border">
                                {loadingSuggestions
                                    ? t('searching')
                                    : t('suggestionsFor', {query: trimmed})}
                            </p>
                            {suggestions.length === 0 && !loadingSuggestions ? (
                                <div className="px-4 py-6 text-center space-y-3">
                                    <p className="text-sm text-muted-foreground">
                                        {t('noSuggestions')}
                                    </p>
                                    <button
                                        type="button"
                                        className="text-sm font-semibold text-electric hover:underline"
                                        onMouseDown={e => e.preventDefault()}
                                        onClick={() => {
                                            addSearchHistory(trimmed);
                                            setHistoryItems(getSearchHistory());
                                            goTo(`/search?q=${encodeURIComponent(trimmed)}&sort=shuffle`);
                                        }}
                                    >
                                        {t('viewAllResults', {query: trimmed})}
                                    </button>
                                </div>
                            ) : (
                                <ul>
                                    {suggestions.map(item => (
                                        <li key={item.productId}>
                                            <button
                                                type="button"
                                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted/60 transition-colors"
                                                onMouseDown={e => e.preventDefault()}
                                                onClick={() => goTo(`/product/${item.slug}`)}
                                            >
                                                <div className="relative size-12 shrink-0 rounded-md overflow-hidden bg-muted">
                                                    <Image
                                                        src={resolveProductImage(item.image, item.slug)}
                                                        alt=""
                                                        fill
                                                        className="object-cover"
                                                        sizes="48px"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium line-clamp-2">
                                                        {item.productName}
                                                    </p>
                                                    {item.price != null && (
                                                        <p className="text-sm font-semibold text-electric mt-0.5">
                                                            <Price
                                                                value={item.price}
                                                                currencyCode={item.currencyCode}
                                                            />
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <button
                                type="button"
                                className="w-full border-t border-border px-4 py-3 text-sm font-medium text-electric hover:bg-muted/40 transition-colors"
                                onMouseDown={e => e.preventDefault()}
                                onClick={() => {
                                    addSearchHistory(trimmed);
                                    setHistoryItems(getSearchHistory());
                                    goTo(`/search?q=${encodeURIComponent(trimmed)}&sort=shuffle`);
                                }}
                            >
                                {t('viewAllResults', {query: trimmed})}
                            </button>
                        </div>
                    ) : (
                        <div className="max-h-[28rem] overflow-y-auto">
                            {historyItems.length > 0 && (
                                <div className="border-b border-border">
                                    <div className="px-4 py-2.5 flex items-center justify-between gap-2">
                                        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                            <Clock className="size-3.5" />
                                            {t('recentSearches')}
                                        </p>
                                        <button
                                            type="button"
                                            className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
                                            onMouseDown={e => e.preventDefault()}
                                            onClick={handleClearHistory}
                                        >
                                            {t('clearHistory')}
                                        </button>
                                    </div>
                                    <ul>
                                        {historyItems.map(entry => (
                                            <li key={entry.query}>
                                                <button
                                                    type="button"
                                                    className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-muted/60 transition-colors group"
                                                    onMouseDown={e => e.preventDefault()}
                                                    onClick={() => searchFromHistory(entry.query)}
                                                >
                                                    <Search className="size-3.5 text-muted-foreground shrink-0" />
                                                    <span className="text-sm flex-1 truncate">{entry.query}</span>
                                                    <span
                                                        role="button"
                                                        tabIndex={0}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground"
                                                        onClick={e => removeHistoryItem(entry.query, e)}
                                                        aria-label={t('removeFromHistory')}
                                                    >
                                                        <X className="size-3.5" />
                                                    </span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {(historyProducts.length > 0 || loadingHistoryProducts) && (
                                <div className="px-4 py-3 border-b border-border">
                                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                                        {t('basedOnYourSearches')}
                                    </p>
                                    {loadingHistoryProducts ? (
                                        <p className="text-sm text-muted-foreground py-2">{t('searching')}</p>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {historyProducts.map(item => (
                                                <button
                                                    key={item.productId}
                                                    type="button"
                                                    className="group text-left"
                                                    onMouseDown={e => e.preventDefault()}
                                                    onClick={() => goTo(`/product/${item.slug}`)}
                                                >
                                                    <div className="relative aspect-square rounded-md overflow-hidden bg-muted mb-1">
                                                        <Image
                                                            src={resolveProductImage(item.image, item.slug)}
                                                            alt=""
                                                            fill
                                                            className="object-cover group-hover:scale-105 transition-transform"
                                                            sizes="72px"
                                                        />
                                                    </div>
                                                    <p className="text-[10px] line-clamp-2 text-muted-foreground group-hover:text-foreground">
                                                        {item.productName}
                                                    </p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex min-h-[16rem] max-h-[24rem]">
                            <div className="w-44 shrink-0 border-r border-border bg-muted/20 overflow-y-auto">
                                <p className="px-3 py-2.5 text-xs font-bold text-foreground">
                                    {t('discoverMore')}
                                </p>
                                <ul>
                                    {browseCategories.map(category => (
                                        <li key={category.slug}>
                                            <button
                                                type="button"
                                                onMouseEnter={() => setActiveCategory(category.slug)}
                                                onFocus={() => setActiveCategory(category.slug)}
                                                onMouseDown={e => e.preventDefault()}
                                                onClick={() =>
                                                    goTo(`/collection/${category.collectionSlug}`)
                                                }
                                                className={cn(
                                                    'w-full text-left px-3 py-2 text-sm transition-colors',
                                                    activeCategory === category.slug
                                                        ? 'bg-background font-medium text-foreground'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-background/60',
                                                )}
                                            >
                                                {category.name}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex-1 p-4 overflow-y-auto">
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <p className="text-sm font-bold">{activeCategoryName}</p>
                                    <button
                                        type="button"
                                        onMouseDown={e => e.preventDefault()}
                                        onClick={() =>
                                            goTo(
                                                `/collection/${
                                                    browseCategories.find(c => c.slug === activeCategory)
                                                        ?.collectionSlug ?? activeCategory
                                                }`,
                                            )
                                        }
                                        className="text-xs text-electric hover:underline shrink-0"
                                    >
                                        {t('otherRecommendations')}
                                    </button>
                                </div>
                                {activeProducts.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-8 text-center">
                                        {t('noSuggestions')}
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                        {activeProducts.slice(0, 10).map(product => (
                                            <button
                                                key={product.productId}
                                                type="button"
                                                onMouseDown={e => e.preventDefault()}
                                                onClick={() => goTo(`/product/${product.slug}`)}
                                                className="group text-left"
                                            >
                                                <div className="relative aspect-square rounded-md overflow-hidden bg-muted mb-1.5">
                                                    <Image
                                                        src={resolveProductImage(
                                                            product.image,
                                                            product.slug,
                                                        )}
                                                        alt=""
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                                                        sizes="80px"
                                                    />
                                                </div>
                                                <p className="text-[11px] leading-snug line-clamp-2 text-muted-foreground group-hover:text-foreground">
                                                    {product.productName}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
