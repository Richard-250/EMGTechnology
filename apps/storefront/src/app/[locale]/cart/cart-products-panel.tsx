'use client';

import Image from 'next/image';
import {useTransition} from 'react';
import {Link} from '@/i18n/navigation';
import {Bookmark, ShoppingCart, Trash2, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Price} from '@/components/commerce/price';
import {adjustQuantity, clearCart, removeFromCart} from '@/app/[locale]/cart/actions';
import {resolveProductImage} from '@/lib/product-images';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/navigation';
import {toast} from 'sonner';

type CartLine = {
    id: string;
    quantity: number;
    unitPriceWithTax: number;
    linePriceWithTax: number;
    productVariant: {
        id: string;
        name: string;
        sku: string;
        product: {
            name: string;
            slug: string;
            collections?: Array<{name: string}> | null;
            featuredAsset?: {preview: string} | null;
        };
    };
};

type ActiveOrder = {
    id: string;
    currencyCode: string;
    lines: CartLine[];
};

export function CartProductsPanel({activeOrder}: {activeOrder: ActiveOrder}) {
    const t = useTranslations('Cart');
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const updateQty = (lineId: string, qty: number) => {
        if (qty < 1) return;
        startTransition(async () => {
            await adjustQuantity(lineId, qty);
            router.refresh();
        });
    };

    const handleRemove = (lineId: string, name: string) => {
        startTransition(async () => {
            await removeFromCart(lineId);
            toast.message(t('itemRemoved', {name}));
            router.refresh();
        });
    };

    const handleClear = () => {
        startTransition(async () => {
            await clearCart(activeOrder.lines.map(l => l.id));
            toast.message(t('cartCleared'));
            router.refresh();
        });
    };

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5 bg-muted/30">
                <span className="font-semibold text-sm">
                    {t('productsCount', {count: activeOrder.lines.length})}
                </span>
                <div className="flex flex-wrap items-center gap-4">
                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive hover:underline disabled:opacity-50"
                    >
                        <Trash2 className="size-3.5" />
                        {t('clear')}
                    </button>
                </div>
            </div>

            <div className="divide-y divide-border">
                {activeOrder.lines.map(line => {
                    const imageSrc = resolveProductImage(
                        line.productVariant.product.featuredAsset?.preview,
                        line.productVariant.product.slug,
                    );
                    const category = line.productVariant.product.collections?.[0]?.name ?? t('uncategorized');
                    const unit = line.unitPriceWithTax;
                    const lineTotal = line.unitPriceWithTax * line.quantity;

                    return (
                        <div key={line.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 border-b border-border last:border-0">
                            <div className="flex gap-3 flex-1 min-w-0">
                            <Link
                                href={`/product/${line.productVariant.product.slug}`}
                                className="relative size-16 sm:size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
                            >
                                <Image src={imageSrc} alt="" fill className="object-cover" sizes="80px" />
                            </Link>

                            <div className="min-w-0 col-span-1 sm:col-span-1">
                                <Link
                                    href={`/product/${line.productVariant.product.slug}`}
                                    className="font-semibold text-sm sm:text-base hover:text-electric line-clamp-2"
                                >
                                    {line.productVariant.product.name}
                                </Link>
                                <p className="text-xs text-muted-foreground mt-0.5">{category}</p>
                                <p className="text-sm mt-1">
                                    <Price value={unit} currencyCode={activeOrder.currencyCode} />{' '}
                                    <span className="text-xs text-muted-foreground">{t('each')}</span>
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                                        onClick={() => toast.message(t('saveForLaterSoon'))}
                                    >
                                        <Bookmark className="size-3.5" />
                                        {t('saveForLater')}
                                    </button>
                                    <span className="text-muted-foreground/50">·</span>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1 text-destructive hover:underline"
                                        onClick={() => handleRemove(line.id, line.productVariant.product.name)}
                                    >
                                        <Trash2 className="size-3.5" />
                                        {t('remove')}
                                    </button>
                                </div>
                            </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 pt-1 sm:pt-0 pl-0 sm:pl-0">
                            <div className="inline-flex items-center rounded-lg border-2 border-electric/25 bg-electric/5 overflow-hidden shrink-0">
                                <button
                                    type="button"
                                    className="px-2.5 py-2 text-lg leading-none hover:bg-electric/10 disabled:opacity-40"
                                    disabled={line.quantity <= 1 || isPending}
                                    onClick={() => updateQty(line.id, line.quantity - 1)}
                                    aria-label={t('decreaseQuantity')}
                                >
                                    −
                                </button>
                                <span className="w-8 text-center text-sm font-semibold tabular-nums">{line.quantity}</span>
                                <button
                                    type="button"
                                    className="px-2.5 py-2 text-lg leading-none hover:bg-electric/10 disabled:opacity-40"
                                    disabled={isPending}
                                    onClick={() => updateQty(line.id, line.quantity + 1)}
                                    aria-label={t('increaseQuantity')}
                                >
                                    +
                                </button>
                            </div>

                            <div className="text-right min-w-[5.5rem]">
                                <p className="font-bold text-base">
                                    <Price value={lineTotal} currencyCode={activeOrder.currencyCode} />
                                </p>
                            </div>

                            <button
                                type="button"
                                className="hidden sm:flex size-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shrink-0"
                                onClick={() => handleRemove(line.id, line.productVariant.product.name)}
                                aria-label={t('remove')}
                            >
                                <X className="size-4" />
                            </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function CartEmptyState() {
    const t = useTranslations('Cart');

    return (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-20 text-center shadow-sm">
            <div className="mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-muted">
                <ShoppingCart className="size-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t('empty')}</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">{t('emptyMessage')}</p>
            <Button
                render={<Link href="/search" />}
                nativeButton={false}
                className="bg-electric hover:bg-electric/90 text-electric-foreground font-semibold"
                size="lg"
            >
                {t('browseShop')}
            </Button>
        </div>
    );
}
