'use client';

import {useCallback, useEffect, useRef, useState, useTransition} from 'react';
import {useSearchParams} from 'next/navigation';
import {useRouter} from '@/i18n/navigation';
import {Camera, Search} from 'lucide-react';
import Image from 'next/image';
import {useLocale, useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';
import {Price} from '@/components/commerce/price';
import {resolveProductImage} from '@/lib/product-images';
import type {SerializedProductCard} from '@/lib/product-price';
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
}

export function NavbarSearchBar({
    className,
    browseCategories,
    categoryProducts,
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
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
                setSuggestions(data.items ?? []);
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
        if (!searchValue.trim()) return;
        setIsOpen(false);
        startTransition(() => {
            router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
        });
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
        toast.info(t('imageSearchComingSoon'), {
            description: t('imageSearchComingSoonHint'),
        });
    };

    const trimmed = searchValue.trim();
    const isTyping = trimmed.length > 0;
    const activeProducts =
        categoryProducts[activeCategory] ?? categoryProducts[browseCategories[0]?.slug] ?? [];
    const activeCategoryName =
        browseCategories.find(c => c.slug === activeCategory)?.name ?? browseCategories[0]?.name;

    const showPanel = isOpen && (isTyping ? true : browseCategories.length > 0);

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
                    placeholder={tNav('searchProducts')}
                    className="flex-1 min-w-0 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
                    value={searchValue}
                    onChange={e => setSearchValue(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                    disabled={isPending}
                    autoComplete="off"
                />
                <button
                    type="button"
                    onClick={handleImageSearch}
                    className="flex size-9 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
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
                                <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                                    {t('noSuggestions')}
                                </p>
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
                                onClick={() =>
                                    goTo(`/search?q=${encodeURIComponent(trimmed)}`)
                                }
                            >
                                {t('viewAllResults', {query: trimmed})}
                            </button>
                        </div>
                    ) : (
                        <div className="flex min-h-[20rem] max-h-[28rem]">
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
                                            goTo(`/collection/${activeCategory}`)
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
                    )}
                </div>
            )}
        </div>
    );
}
