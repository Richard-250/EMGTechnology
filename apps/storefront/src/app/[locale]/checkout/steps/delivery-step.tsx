'use client';

import {useMemo, useState} from 'react';
import {Button} from '@/components/ui/button';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Label} from '@/components/ui/label';
import {Loader2, Truck, Store, Bike} from 'lucide-react';
import {useRouter} from '@/i18n/navigation';
import {useCheckout} from '../checkout-provider';
import {setShippingMethod as setShippingMethodAction} from '../actions';
import {Price} from '@/components/commerce/price';
import {COMPANY, formatCompanyAddress} from '@/lib/company';
import {useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';

interface DeliveryStepProps {
    onComplete: () => void;
}

function methodIcon(name: string) {
    const n = name.toLowerCase();
    if (n.includes('pickup') || n.includes('collect') || n.includes('store')) return Store;
    if (n.includes('moto') || n.includes('taxi')) return Bike;
    return Truck;
}

export default function DeliveryStep({onComplete}: DeliveryStepProps) {
    const t = useTranslations('Checkout');
    const router = useRouter();
    const {shippingMethods, order} = useCheckout();
    const [selectedMethodId, setSelectedMethodId] = useState<string | null>(() => {
        if (order.shippingLines?.length) return order.shippingLines[0].shippingMethod.id;
        return shippingMethods.length === 1 ? shippingMethods[0].id : null;
    });
    const [deliveryMode, setDeliveryMode] = useState<'tomorrow' | 'other'>('tomorrow');
    const [submitting, setSubmitting] = useState(false);

    const tomorrowLabel = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }, []);

    const handleContinue = async () => {
        if (!selectedMethodId) return;
        setSubmitting(true);
        try {
            await setShippingMethodAction(selectedMethodId);
            if (typeof window !== 'undefined') {
                sessionStorage.setItem(
                    'emg-delivery-date',
                    deliveryMode === 'tomorrow' ? `Delivery Tomorrow — ${tomorrowLabel}` : tomorrowLabel,
                );
            }
            router.refresh();
            onComplete();
        } catch (error) {
            console.error('Error setting shipping method:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (shippingMethods.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">{t('noShippingMethods')}</p>
            </div>
        );
    }

    const selected = shippingMethods.find(m => m.id === selectedMethodId);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold text-base">{t('howReceive')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t('howReceiveHint')}</p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">
                    {t('deliveryZone')}
                </p>
                <p className="font-semibold">{order.shippingAddress?.province || 'Rwanda'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                    {[order.shippingAddress?.city, order.shippingAddress?.streetLine2, order.shippingAddress?.streetLine1]
                        .filter(Boolean)
                        .join(' · ')}
                </p>
            </div>

            <RadioGroup value={selectedMethodId || ''} onValueChange={setSelectedMethodId} className="space-y-2">
                {shippingMethods.map(method => {
                    const Icon = methodIcon(method.name);
                    const active = selectedMethodId === method.id;
                    const isPickup =
                        /pickup|collect|store/i.test(method.name);
                    return (
                        <Label
                            key={method.id}
                            htmlFor={method.id}
                            className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors',
                                active
                                    ? 'border-electric bg-electric/5 ring-1 ring-electric/30'
                                    : 'border-border hover:border-electric/40',
                            )}
                        >
                            <RadioGroupItem value={method.id} id={method.id} />
                            <span className="flex size-10 items-center justify-center rounded-full bg-electric/10 text-electric shrink-0">
                                <Icon className="size-5" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold">
                                    {isPickup && method.priceWithTax === 0
                                        ? t('pickupAtStore')
                                        : method.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {isPickup && method.priceWithTax === 0
                                        ? `${COMPANY.shortName} — ${formatCompanyAddress()}`
                                        : method.description || t('deliveryOption')}
                                </p>
                            </div>
                            <p className="font-semibold text-electric shrink-0">
                                {method.priceWithTax === 0 ? (
                                    t('free')
                                ) : (
                                    <Price value={method.priceWithTax} currencyCode={order.currencyCode} />
                                )}
                            </p>
                        </Label>
                    );
                })}
            </RadioGroup>

            <div className="rounded-xl border border-border p-4 space-y-3">
                <p className="font-semibold text-sm">{t('deliveryDate')}</p>
                <p className="text-xs text-muted-foreground">
                    {t('deliveryDateRecommended', {date: tomorrowLabel})}
                </p>
                <RadioGroup
                    value={deliveryMode}
                    onValueChange={v => setDeliveryMode(v as 'tomorrow' | 'other')}
                    className="space-y-2"
                >
                    <Label
                        className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-lg border p-3',
                            deliveryMode === 'tomorrow' ? 'border-electric bg-electric/5' : 'border-border',
                        )}
                    >
                        <RadioGroupItem value="tomorrow" className="mt-0.5" />
                        <span>
                            <span className="font-medium block">{t('deliveryTomorrow')}</span>
                            <span className="text-xs text-muted-foreground">{t('deliveryTomorrowHint')}</span>
                        </span>
                    </Label>
                    <Label
                        className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-lg border p-3',
                            deliveryMode === 'other' ? 'border-electric bg-electric/5' : 'border-border',
                        )}
                    >
                        <RadioGroupItem value="other" className="mt-0.5" />
                        <span>
                            <span className="font-medium block">{t('chooseAnotherDate')}</span>
                            <span className="text-xs text-muted-foreground">{t('chooseAnotherDateHint')}</span>
                        </span>
                    </Label>
                </RadioGroup>

                <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm space-y-1">
                    <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{t('estimatedDelivery')}</span>
                        <span className="font-medium text-right">
                            {deliveryMode === 'tomorrow'
                                ? t('deliveryTomorrowLabel', {date: tomorrowLabel})
                                : tomorrowLabel}
                        </span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{t('deliveryMethod')}</span>
                        <span className="font-medium text-right">{selected?.name}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">{t('deliveryFee')}</span>
                        <span className="font-medium">
                            {!selected || selected.priceWithTax === 0 ? (
                                t('free').toUpperCase()
                            ) : (
                                <Price value={selected.priceWithTax} currencyCode={order.currencyCode} />
                            )}
                        </span>
                    </div>
                </div>
            </div>

            <Button
                onClick={handleContinue}
                disabled={!selectedMethodId || submitting}
                className="w-full bg-electric hover:bg-electric/90 text-electric-foreground"
            >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('continue')}
            </Button>
        </div>
    );
}
