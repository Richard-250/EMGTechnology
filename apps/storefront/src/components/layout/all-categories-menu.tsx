'use client';

import {useEffect, useState} from 'react';
import Image from 'next/image';
import {Link} from '@/i18n/navigation';
import {
    ChevronRight,
    Dumbbell,
    HeartPulse,
    Home,
    LayoutGrid,
    Menu,
    Package,
    Star,
} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from '@/components/ui/sheet';
import {Button} from '@/components/ui/button';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {useHoverOpen} from '@/lib/use-hover-open';
import {Price} from '@/components/commerce/price';
import {resolveProductImage} from '@/lib/product-images';
import {CATEGORY_SUB_LINKS} from '@/lib/search-catalog';
import type {SerializedProductCard} from '@/lib/product-price';

import {ProductPreviewModal} from '@/components/commerce/product-preview-modal';

export interface CategoryMenuItem {
    id: string;
    name: string;
    slug: string;
    image: string;
    description: string;
}

interface AllCategoriesMenuProps {
    categories: CategoryMenuItem[];
    categoryProducts: Record<string, SerializedProductCard[]>;
    labels: {
        allCategories: string;
        shopAll: string;
        viewAll: string;
        recommended: string;
    };
    className?: string;
    variant?: 'bar' | 'subnav';
}

const CATEGORY_ICONS: Record<string, typeof Star> = {
    featured: Star,
    cardio: HeartPulse,
    strength: Dumbbell,
    'home-gyms': Home,
    accessories: Package,
};

function CategoryIcon({slug}: {slug: string}) {
    const Icon = CATEGORY_ICONS[slug] ?? LayoutGrid;
    return <Icon className="size-4 shrink-0 opacity-70" aria-hidden />;
}

function MegaMenuProductCard({
    product,
    onNavigate,
}: {
    product: SerializedProductCard;
    onNavigate?: () => void;
}) {
    const [previewOpen, setPreviewOpen] = useState(false);

    const modalData = {
        productId: product.productId,
        productVariantId: product.productVariantId,
        productName: product.productName,
        slug: product.slug,
        imageSrc: resolveProductImage(product.image, product.slug),
        currencyCode: product.currencyCode,
        price: product.price,
        priceMin: product.priceMin,
        priceMax: product.priceMax,
        isPriceRange: false,
    };

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    setPreviewOpen(true);
                    onNavigate?.();
                }}
                className="group shrink-0 w-[5.5rem] text-left cursor-pointer focus-visible:outline-none"
            >
                <div className="relative aspect-square rounded-md overflow-hidden bg-muted mb-1 border border-border/50 group-hover:border-electric/50 transition-colors">
                    <Image
                        src={modalData.imageSrc}
                        alt=""
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="88px"
                    />
                </div>
                <p className="text-[10px] leading-tight line-clamp-2 text-muted-foreground group-hover:text-foreground transition-colors">
                    {product.productName}
                </p>
                {product.price != null && (
                    <p className="text-[10px] font-semibold text-electric mt-0.5">
                        <Price value={product.price} currencyCode={product.currencyCode} />
                    </p>
                )}
            </button>

            <ProductPreviewModal
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                initialData={modalData}
            />
        </>
    );
}

function CategoryMegaPanel({
    category,
    products,
    viewAllLabel,
    recommendedLabel,
    onNavigate,
}: {
    category: CategoryMenuItem;
    products: SerializedProductCard[];
    viewAllLabel: string;
    recommendedLabel: string;
    onNavigate?: () => void;
}) {
    const subLinks = CATEGORY_SUB_LINKS[category.slug] ?? [];

    return (
        <div className="flex h-full flex-col animate-in fade-in-0 slide-in-from-right-3 duration-200">
            <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="font-bold text-base">{category.name}</h3>
                <Link
                    href={`/collection/${category.slug}`}
                    onClick={onNavigate}
                    className="text-xs font-medium text-electric hover:underline shrink-0"
                >
                    {viewAllLabel.replace('{category}', category.name)}
                </Link>
            </div>

            {products.length > 0 && (
                <div className="mb-4">
                    <p className="text-xs font-bold mb-2">{recommendedLabel}</p>
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {products.slice(0, 8).map(product => (
                            <MegaMenuProductCard
                                key={product.productId}
                                product={product}
                                onNavigate={onNavigate}
                            />
                        ))}
                    </div>
                </div>
            )}

            {subLinks.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 border-t border-border/60 pt-3 mt-auto">
                    {subLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={onNavigate}
                            className="text-xs text-muted-foreground hover:text-electric transition-colors truncate py-0.5"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function CategoryList({
    categories,
    shopAllLabel,
    activeSlug,
    onHover,
    onNavigate,
}: {
    categories: CategoryMenuItem[];
    shopAllLabel: string;
    activeSlug: string;
    onHover: (slug: string) => void;
    onNavigate?: () => void;
}) {
    return (
        <ul className="py-2">
            {categories.map(category => (
                <li key={category.id}>
                    <Link
                        href={`/collection/${category.slug}`}
                        onMouseEnter={() => onHover(category.slug)}
                        onFocus={() => onHover(category.slug)}
                        onClick={onNavigate}
                        className={cn(
                            'flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors duration-150',
                            activeSlug === category.slug
                                ? 'bg-electric/10 font-medium text-electric'
                                : 'text-foreground hover:bg-muted/60',
                        )}
                    >
                        <span className="flex min-w-0 items-center gap-2.5">
                            <CategoryIcon slug={category.slug} />
                            <span className="truncate">{category.name}</span>
                        </span>
                        <ChevronRight
                            className={cn(
                                'size-3.5 shrink-0 transition-opacity duration-150',
                                activeSlug === category.slug ? 'opacity-70' : 'opacity-40',
                            )}
                        />
                    </Link>
                </li>
            ))}
            <li className="mt-1 border-t border-border/60 pt-1">
                <Link
                    href="/search"
                    onClick={onNavigate}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
                >
                    <LayoutGrid className="size-4 opacity-70" />
                    {shopAllLabel}
                </Link>
            </li>
        </ul>
    );
}

export function AllCategoriesMenu({
    categories,
    categoryProducts,
    labels,
    className,
    variant = 'bar',
}: AllCategoriesMenuProps) {
    const {open, setOpen, onEnter, onLeave} = useHoverOpen();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeSlug, setActiveSlug] = useState(categories[0]?.slug ?? '');

    const activeCategory = categories.find(c => c.slug === activeSlug) ?? categories[0];
    const activeProducts = categoryProducts[activeSlug] ?? [];

    useEffect(() => {
        if (categories.length && !categories.some(c => c.slug === activeSlug)) {
            setActiveSlug(categories[0].slug);
        }
    }, [categories, activeSlug]);

    if (!categories.length) {
        return null;
    }

    const isSubnav = variant === 'subnav';

    const triggerClassName = cn(
        'inline-flex shrink-0 items-center gap-2 font-medium transition-all duration-200',
        isSubnav ? 'h-8 px-3 rounded-md text-sm' : 'h-9 px-3 md:px-4 text-sm',
        open
            ? 'bg-electric text-electric-foreground shadow-sm'
            : isSubnav
              ? 'bg-muted/60 text-foreground hover:bg-muted'
              : 'bg-muted/60 text-foreground hover:bg-muted',
        className,
    );

    const megaMenu = (
        <div className="flex min-h-[22rem]">
            <div className="w-52 shrink-0 border-r border-border/60 bg-muted/20">
                <CategoryList
                    categories={categories}
                    shopAllLabel={labels.shopAll}
                    activeSlug={activeSlug}
                    onHover={setActiveSlug}
                    onNavigate={() => setOpen(false)}
                />
            </div>
            {activeCategory && (
                <div className="flex-1 p-4 overflow-y-auto">
                    <CategoryMegaPanel
                        category={activeCategory}
                        products={activeProducts}
                        viewAllLabel={labels.viewAll}
                        recommendedLabel={labels.recommended}
                        onNavigate={() => setOpen(false)}
                    />
                </div>
            )}
        </div>
    );

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <div
                    className="hidden md:block"
                    onMouseEnter={onEnter}
                    onMouseLeave={onLeave}
                >
                    <PopoverTrigger
                        render={
                            <button
                                type="button"
                                aria-haspopup="true"
                                aria-expanded={open}
                                className={cn(triggerClassName, 'hidden md:inline-flex')}
                            />
                        }
                    >
                        <Menu className="size-4" />
                        {labels.allCategories}
                    </PopoverTrigger>
                </div>
                <PopoverContent
                    align="start"
                    side="bottom"
                    sideOffset={isSubnav ? 0 : 10}
                    className={cn(
                        'w-[min(52rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border-border p-0 shadow-2xl',
                        'duration-200 data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-top-2',
                    )}
                    onMouseEnter={onEnter}
                    onMouseLeave={onLeave}
                >
                    {megaMenu}
                </PopoverContent>
            </Popover>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger
                    render={
                        <Button type="button" variant="ghost" className={cn(triggerClassName, 'md:hidden')} />
                    }
                >
                    <Menu className="size-4" />
                    {labels.allCategories}
                </SheetTrigger>
                <SheetContent side="left" className="w-full overflow-y-auto p-0 sm:max-w-sm">
                    <SheetHeader className="border-b border-border/60 px-4 pb-2 pt-4">
                        <SheetTitle>{labels.allCategories}</SheetTitle>
                    </SheetHeader>
                    <CategoryList
                        categories={categories}
                        shopAllLabel={labels.shopAll}
                        activeSlug={activeSlug}
                        onHover={setActiveSlug}
                        onNavigate={() => setMobileOpen(false)}
                    />
                    {activeCategory && (
                        <div className="border-t border-border/60 px-4 pb-6 pt-2">
                            <CategoryMegaPanel
                                category={activeCategory}
                                products={activeProducts}
                                viewAllLabel={labels.viewAll}
                                recommendedLabel={labels.recommended}
                                onNavigate={() => setMobileOpen(false)}
                            />
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}
