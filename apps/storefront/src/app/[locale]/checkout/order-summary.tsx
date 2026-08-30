'use client';

import {useState, useTransition} from 'react';
import Image from 'next/image';
import {Lock, RotateCcw, Zap, CreditCard} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Price} from '@/components/commerce/price';
import {useCheckout} from './checkout-provider';
import {applyPromotionCode} from '@/app/[locale]/cart/actions';
import {resolveProductImage} from '@/lib/product-images';
import {useTranslations} from 'next-intl';
import {useRouter} from '@/i18n/navigation';

const TRUST_KEYS = ['trustSecure', 'trustDelivery', 'trustReturns'] as const;
const TRUST_ICONS = [Lock, Zap, RotateCcw] as const;

export default function OrderSummary() {
    const t = useTranslations('Checkout');
    const tCart = useTranslations('Cart');
    const router = useRouter();
    const {order} = useCheckout();
    const [promoCode, setPromoCode] = useState('');
    const [isPending, startTransition] = useTransition();

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
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="text-lg font-bold mb-4">{tCart('basketTotals')}</h3>

            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {order.lines.map(line => (
                    <div key={line.id} className="flex gap-2.5">
                        <div className="relative size-12 shrink-0 rounded-md overflow-hidden bg-muted border border-border">
                            <Image
                                src={resolveProductImage(
                                    line.productVariant.product.featuredAsset?.preview,
                                    line.productVariant.product.slug,
                                )}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="48px"
                            />
                            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-electric text-[9px] font-bold text-electric-foreground">
                                {line.quantity}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium line-clamp-2">{line.productVariant.product.name}</p>
                            <p className="text-xs text-electric font-semibold mt-0.5">
                                <Price value={line.linePriceWithTax} currencyCode={order.currencyCode} />
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-0 mb-3 rounded-lg overflow-hidden border border-border">
                <Input
                    value={promoCode}
                    onChange={e => setPromoCode(e.target.value)}
                    placeholder={tCart('promoPlaceholder')}
                    className="border-0 rounded-none text-sm h-9 focus-visible:ring-0"
                />
                <Button
                    type="button"
                    size="sm"
                    onClick={handleApplyPromo}
                    disabled={isPending || !promoCode.trim()}
                    className="rounded-none bg-electric hover:bg-electric/90 text-electric-foreground shrink-0 px-4"
                >
                    {tCart('apply')}
                </Button>
            </div>

            <div className="space-y-2 text-sm mb-3">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('subtotal')}</span>
                    <Price value={order.subTotalWithTax} currencyCode={order.currencyCode} />
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('shipping')}</span>
                    <span>
                        {order.shippingWithTax > 0
                            ? <Price value={order.shippingWithTax} currencyCode={order.currencyCode} />
                            : t('toBeCalculated')}
                    </span>
                </div>
            </div>

            <div className="rounded-lg bg-electric/10 border border-electric/20 px-4 py-3 mt-3 mb-4">
                <p className="text-xs text-muted-foreground">{tCart('estimatedTotal')}</p>
                <p className="text-xl font-bold text-electric">
                    <Price value={order.totalWithTax} currencyCode={order.currencyCode} />
                </p>
            </div>

            <ul className="space-y-2 pt-3 border-t border-border">
                {TRUST_KEYS.map((key, i) => {
                    const Icon = TRUST_ICONS[i] ?? CreditCard;
                    return (
                        <li key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Icon className="size-3.5 text-electric shrink-0" />
                            {tCart(key)}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
