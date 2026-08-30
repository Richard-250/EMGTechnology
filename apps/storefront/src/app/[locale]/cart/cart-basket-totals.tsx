'use client';

import {useState, useTransition} from 'react';
import {Link} from '@/i18n/navigation';
import {Lock, Send, ShoppingBag, Zap, RotateCcw, CreditCard} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Price} from '@/components/commerce/price';
import {applyPromotionCode} from '@/app/[locale]/cart/actions';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/navigation';

type ActiveOrder = {
    id: string;
    currencyCode: string;
    subTotalWithTax: number;
    shippingWithTax: number;
    totalWithTax: number;
    couponCodes?: string[] | null;
    lines: Array<{
        id: string;
        quantity: number;
        unitPriceWithTax: number;
        productVariant: {
            product: {
                name: string;
                slug: string;
                featuredAsset?: {preview: string} | null;
            };
        };
    }>;
};

const TRUST_ITEMS = [
    {icon: Lock, labelKey: 'trustSecure' as const},
    {icon: Zap, labelKey: 'trustDelivery' as const},
    {icon: CreditCard, labelKey: 'trustPayments' as const},
    {icon: RotateCcw, labelKey: 'trustReturns' as const},
];

export function CartBasketTotals({
    activeOrder,
    checkoutHref,
}: {
    activeOrder: ActiveOrder;
    checkoutHref: string;
}) {
    const t = useTranslations('Cart');
    const router = useRouter();
    const [promoCode, setPromoCode] = useState('');
    const [isPending, startTransition] = useTransition();

    const estimatedTotal = activeOrder.totalWithTax;

    const handleApplyPromo = () => {
        if (!promoCode.trim()) return;
        const fd = new FormData();
        fd.set('code', promoCode.trim());
        startTransition(async () => {
            await applyPromotionCode(fd);
            setPromoCode('');
            router.refresh();
        });
    };

    return (
        <aside className="lg:sticky lg:top-28 space-y-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h2 className="text-lg font-bold mb-4">{t('basketTotals')}</h2>

                <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('subtotal')}</span>
                        <span className="font-medium">
                            <Price
                                value={activeOrder.subTotalWithTax}
                                currencyCode={activeOrder.currencyCode}
                            />
                        </span>
                    </div>
                </div>

                <div className="rounded-lg bg-electric/10 border border-electric/20 px-4 py-3 mb-4">
                    <p className="text-xs text-muted-foreground mb-1">{t('estimatedTotal')}</p>
                    <p className="text-2xl font-bold text-electric">
                        <Price value={estimatedTotal} currencyCode={activeOrder.currencyCode} />
                    </p>
                </div>

                <div className="flex gap-0 mb-4 rounded-lg overflow-hidden border border-border">
                    <Input
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value)}
                        placeholder={t('promoPlaceholder')}
                        className="border-0 rounded-none focus-visible:ring-0"
                    />
                    <Button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={isPending || !promoCode.trim()}
                        className="rounded-none bg-electric hover:bg-electric/90 text-electric-foreground shrink-0 px-5"
                    >
                        {t('apply')}
                    </Button>
                </div>

                <Button
                    render={<Link href={checkoutHref} />}
                    nativeButton={false}
                    size="lg"
                    className="w-full bg-electric hover:bg-electric/90 text-electric-foreground font-semibold mb-2.5 hidden sm:flex"
                >
                    <Send className="size-4 mr-2" />
                    {t('proceedToCheckout')}
                </Button>

                <Button
                    render={<Link href="/search" />}
                    nativeButton={false}
                    variant="outline"
                    size="lg"
                    className="w-full border-electric/40 text-electric hover:bg-electric/5 hidden sm:flex"
                >
                    <ShoppingBag className="size-4 mr-2" />
                    {t('continueShopping')}
                </Button>

                <ul className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-border">
                    {TRUST_ITEMS.map(item => (
                        <li key={item.labelKey} className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-snug">
                            <item.icon className="size-3.5 shrink-0 mt-0.5 text-electric" />
                            {t(item.labelKey)}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Mobile sticky checkout bar */}
            <div className="fixed bottom-14 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md p-3 sm:hidden md:bottom-0">
                <div className="flex items-center gap-3">
                    <Link href="/search" className="flex size-10 items-center justify-center rounded-lg border border-border shrink-0" aria-label={t('continueShopping')}>
                        <ShoppingBag className="size-4" />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground">{t('total')}</p>
                        <p className="font-bold text-electric">
                            <Price value={estimatedTotal} currencyCode={activeOrder.currencyCode} />
                        </p>
                    </div>
                    <Button
                        render={<Link href={checkoutHref} />}
                        nativeButton={false}
                        className="bg-electric hover:bg-electric/90 text-electric-foreground font-semibold shrink-0"
                    >
                        {t('checkout')}
                    </Button>
                </div>
            </div>
        </aside>
    );
}
