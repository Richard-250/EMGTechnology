'use client';

import Image from 'next/image';
import {useEffect, useMemo, useState, useTransition} from 'react';
import {Link} from '@/i18n/navigation';
import {Button} from '@/components/ui/button';
import {Minus, Plus, X, ShoppingCart} from 'lucide-react';
import {Price} from '@/components/commerce/price';
import {removeFromCart, updateCartLines} from '@/app/[locale]/cart/actions';
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
            featuredAsset?: {
                preview: string;
            } | null;
        };
    };
};

type ActiveOrder = {
    id: string;
    currencyCode: string;
    totalQuantity: number;
    lines: CartLine[];
};

export function CartItemsClient({activeOrder}: {activeOrder: ActiveOrder | null}) {
    const t = useTranslations('Cart');
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const initialQuantities = useMemo(() => {
        const map: Record<string, number> = {};
        activeOrder?.lines.forEach(line => {
            map[line.id] = line.quantity;
        });
        return map;
    }, [activeOrder]);

    const [quantities, setQuantities] = useState<Record<string, number>>(initialQuantities);

    useEffect(() => {
        setQuantities(initialQuantities);
    }, [initialQuantities]);

    const isDirty = useMemo(() => {
        if (!activeOrder) return false;
        return activeOrder.lines.some(line => quantities[line.id] !== line.quantity);
    }, [activeOrder, quantities]);

    if (!activeOrder || activeOrder.lines.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <ShoppingCart className="size-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold mb-2">{t('empty')}</h2>
                <p className="text-muted-foreground mb-8 max-w-sm mx-auto">{t('emptyMessage')}</p>
                <Button
                    render={<Link href="/search" />}
                    nativeButton={false}
                    className="bg-electric hover:bg-electric/90 text-electric-foreground"
                >
                    {t('browseShop')}
                </Button>
            </div>
        );
    }

    const handleUpdateCart = () => {
        const updates = activeOrder.lines
            .filter(line => quantities[line.id] !== line.quantity)
            .map(line => ({lineId: line.id, quantity: quantities[line.id]}));

        if (!updates.length) return;

        startTransition(async () => {
            await updateCartLines(updates);
            toast.success(t('cartUpdated'));
            router.refresh();
        });
    };

    const handleRemove = (lineId: string) => {
        startTransition(async () => {
            await removeFromCart(lineId);
            router.refresh();
        });
    };

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-border overflow-hidden bg-card divide-y divide-border">
                {activeOrder.lines.map(line => {
                    const qty = quantities[line.id] ?? line.quantity;
                    const imageSrc = resolveProductImage(
                        line.productVariant.product.featuredAsset?.preview,
                        line.productVariant.product.slug,
                    );

                    return (
                        <div key={line.id} className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
                            <Link
                                href={`/product/${line.productVariant.product.slug}`}
                                className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted"
                            >
                                <Image src={imageSrc} alt={line.productVariant.product.name} fill className="object-cover" sizes="96px" />
                            </Link>

                            <div className="flex-1 min-w-0">
                                <Link
                                    href={`/product/${line.productVariant.product.slug}`}
                                    className="font-semibold hover:text-electric transition-colors line-clamp-2"
                                >
                                    {line.productVariant.product.name}
                                </Link>
                                {line.productVariant.name !== line.productVariant.product.name && (
                                    <p className="text-sm text-muted-foreground mt-1">{line.productVariant.name}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">{t('sku', {sku: line.productVariant.sku})}</p>

                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <div className="inline-flex items-center rounded-lg border border-border">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-9 rounded-r-none"
                                            disabled={qty <= 1 || isPending}
                                            onClick={() => setQuantities(prev => ({...prev, [line.id]: Math.max(1, qty - 1)}))}
                                        >
                                            <Minus className="size-4" />
                                        </Button>
                                        <span className="w-10 text-center text-sm font-semibold tabular-nums">{qty}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-9 rounded-l-none"
                                            disabled={isPending}
                                            onClick={() => setQuantities(prev => ({...prev, [line.id]: qty + 1}))}
                                        >
                                            <Plus className="size-4" />
                                        </Button>
                                    </div>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        disabled={isPending}
                                        onClick={() => handleRemove(line.id)}
                                    >
                                        <X className="size-4 mr-1" />
                                        {t('remove')}
                                    </Button>
                                </div>
                            </div>

                            <div className="sm:text-right shrink-0">
                                <p className="font-bold text-lg text-electric">
                                    <Price value={line.unitPriceWithTax * qty} currencyCode={activeOrder.currencyCode} />
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    <Price value={line.unitPriceWithTax} currencyCode={activeOrder.currencyCode} /> {t('each')}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <Button
                    variant="outline"
                    render={<Link href="/search" />}
                    nativeButton={false}
                >
                    {t('continueShopping')}
                </Button>
                <Button
                    onClick={handleUpdateCart}
                    disabled={!isDirty || isPending}
                    className="bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
                >
                    {isPending ? t('updatingCart') : t('updateCart')}
                </Button>
            </div>
        </div>
    );
}
