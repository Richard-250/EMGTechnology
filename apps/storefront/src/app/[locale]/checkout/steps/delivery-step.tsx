'use client';

import {useMemo, useState} from 'react';
import {Button} from '@/components/ui/button';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Label} from '@/components/ui/label';
import {Calendar} from '@/components/ui/calendar';
import {Loader2, Truck, Store, Bike, MapPin, CalendarDays, Package} from 'lucide-react';
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

function isPickupMethod(name: string) {
    return /pickup|collect|store/i.test(name);
}

type DeliveryDateMode = 'ship-today' | 'next-day' | 'choose-date';

export default function DeliveryStep({onComplete}: DeliveryStepProps) {
    const t = useTranslations('Checkout');
    const router = useRouter();
    const {shippingMethods, order} = useCheckout();

    const [selectedMethodId, setSelectedMethodId] = useState<string | null>(() => {
        if (order.shippingLines?.length) return order.shippingLines[0].shippingMethod.id;
        return shippingMethods.length === 1 ? shippingMethods[0].id : null;
    });
    const [deliveryDateMode, setDeliveryDateMode] = useState<DeliveryDateMode>('ship-today');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [submitting, setSubmitting] = useState(false);

    // Compute minimum selectable date: day after tomorrow
    const minSelectableDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    // Default "choose date" selection
    const defaultChooseDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const todayLabel = useMemo(() => {
        return new Date().toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }, []);

    const selected = shippingMethods.find(m => m.id === selectedMethodId);
    const isPickup = selected ? isPickupMethod(selected.name) : false;

    const deliveryZoneName = order.shippingAddress?.province || 'Rwanda';
    const deliveryZoneDetails = [
        order.shippingAddress?.city,
        order.shippingAddress?.streetLine2,
        order.shippingAddress?.streetLine1,
    ]
        .filter(Boolean)
        .join(' · ');

    // Compute the displayed estimated date
    const estimatedDateLabel = useMemo(() => {
        if (deliveryDateMode === 'ship-today') {
            return `Today — ${todayLabel}`;
        }
        if (deliveryDateMode === 'next-day') {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            return d.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        }
        if (selectedDate) {
            return `Scheduled — ${selectedDate.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            })}`;
        }
        return '';
    }, [deliveryDateMode, selectedDate, todayLabel]);

    const handleContinue = async () => {
        if (!selectedMethodId) return;
        setSubmitting(true);
        try {
            await setShippingMethodAction(selectedMethodId);
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('emg-delivery-date', estimatedDateLabel);
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="font-semibold text-base">{t('howReceive')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t('howReceiveHint')}</p>
            </div>

            {/* Delivery Zone Card */}
            <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <span className="flex size-8 items-center justify-center rounded-full bg-electric/15 text-electric shrink-0 mt-0.5">
                            <MapPin className="size-4" />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                {t('deliveryZone')}
                            </p>
                            <p className="font-semibold text-base mt-0.5">{deliveryZoneName}</p>
                            {deliveryZoneDetails && (
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    {deliveryZoneDetails}
                                </p>
                            )}
                        </div>
                    </div>
                    <span className="text-xs font-semibold bg-electric/10 text-electric px-2.5 py-1 rounded-full shrink-0">
                        {shippingMethods.length} {shippingMethods.length === 1 ? 'option' : 'options'}
                    </span>
                </div>
            </div>

            {/* Shipping Methods */}
            <RadioGroup value={selectedMethodId || ''} onValueChange={setSelectedMethodId} className="space-y-2">
                {shippingMethods.map(method => {
                    const Icon = methodIcon(method.name);
                    const active = selectedMethodId === method.id;
                    const pickup = isPickupMethod(method.name);
                    return (
                        <Label
                            key={method.id}
                            htmlFor={method.id}
                            className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200',
                                active
                                    ? 'border-electric bg-electric/5 shadow-sm shadow-electric/10'
                                    : 'border-border/60 hover:border-electric/40 hover:bg-muted/30',
                            )}
                        >
                            <RadioGroupItem value={method.id} id={method.id} />
                            <span
                                className={cn(
                                    'flex size-10 items-center justify-center rounded-lg shrink-0 transition-colors',
                                    active
                                        ? 'bg-electric text-electric-foreground'
                                        : 'bg-electric/10 text-electric',
                                )}
                            >
                                <Icon className="size-5" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold">
                                    {pickup && method.priceWithTax === 0
                                        ? t('pickupAtStore')
                                        : method.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {pickup && method.priceWithTax === 0
                                        ? `${COMPANY.shortName} — ${formatCompanyAddress()}`
                                        : method.description || t('deliveryOption')}
                                </p>
                            </div>
                            <p
                                className={cn(
                                    'font-bold shrink-0 text-sm',
                                    method.priceWithTax === 0 ? 'text-green-500' : 'text-electric',
                                )}
                            >
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

            {/* Delivery Date Section — hidden for Pickup at Store */}
            {!isPickup && (
                <div className="rounded-xl border border-border p-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="size-4 text-electric" />
                        <p className="font-semibold text-sm">{t('deliveryDate')}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Recommended: <strong>Today — {todayLabel}</strong> — you can choose another date if needed.
                    </p>

                    <RadioGroup
                        value={deliveryDateMode}
                        onValueChange={v => {
                            const mode = v as DeliveryDateMode;
                            setDeliveryDateMode(mode);
                            if (mode === 'choose-date' && !selectedDate) {
                                setSelectedDate(defaultChooseDate);
                            }
                        }}
                        className="space-y-2"
                    >
                        {/* Ship today */}
                        <Label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all',
                                deliveryDateMode === 'ship-today'
                                    ? 'border-electric bg-electric/5'
                                    : 'border-border/60 hover:border-electric/40',
                            )}
                        >
                            <RadioGroupItem value="ship-today" className="mt-0.5" />
                            <div>
                                <span className="font-semibold block">Ship today</span>
                                <span className="text-xs text-muted-foreground">
                                    Order is before cutoff on a working day
                                </span>
                            </div>
                        </Label>

                        {/* Next shipping day */}
                        <Label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all',
                                deliveryDateMode === 'next-day'
                                    ? 'border-electric bg-electric/5'
                                    : 'border-border/60 hover:border-electric/40',
                            )}
                        >
                            <RadioGroupItem value="next-day" className="mt-0.5" />
                            <div>
                                <span className="font-semibold block">Next shipping day</span>
                                <span className="text-xs text-muted-foreground">
                                    Next available working day
                                </span>
                            </div>
                        </Label>

                        {/* Choose another date */}
                        <Label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all',
                                deliveryDateMode === 'choose-date'
                                    ? 'border-electric bg-electric/5'
                                    : 'border-border/60 hover:border-electric/40',
                            )}
                        >
                            <RadioGroupItem value="choose-date" className="mt-0.5" />
                            <div>
                                <span className="font-semibold block">Choose another date</span>
                                <span className="text-xs text-muted-foreground">
                                    Scheduled delivery on an eligible date
                                </span>
                            </div>
                        </Label>
                    </RadioGroup>

                    {/* Date Picker — shown only when "Choose another date" is selected */}
                    {deliveryDateMode === 'choose-date' && (
                        <div className="space-y-2 pt-1">
                            <p className="text-sm font-medium">Select date</p>
                            <div className="rounded-xl border border-border p-2 inline-block">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => {
                                        if (date) setSelectedDate(date);
                                    }}
                                    disabled={(date) => {
                                        // Disable: past dates, today, and tomorrow
                                        // Also disable Sundays
                                        const d = new Date(date);
                                        d.setHours(0, 0, 0, 0);
                                        return d < minSelectableDate || d.getDay() === 0;
                                    }}
                                    defaultMonth={minSelectableDate}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Sundays and non-working weekdays are not selectable.
                            </p>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-sm space-y-1.5">
                        <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">Estimated delivery date</span>
                            <span className="font-semibold text-right">{estimatedDateLabel}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">Delivery method</span>
                            <span className="font-semibold text-right">{selected?.name}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">Delivery fee</span>
                            <span className="font-semibold">
                                {!selected || selected.priceWithTax === 0 ? (
                                    'FREE'
                                ) : (
                                    <Price value={selected.priceWithTax} currencyCode={order.currencyCode} />
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Continue Button */}
            <Button
                onClick={handleContinue}
                disabled={!selectedMethodId || submitting || (deliveryDateMode === 'choose-date' && !isPickup && !selectedDate)}
                className="w-full bg-electric hover:bg-electric/90 text-electric-foreground"
            >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('continue')}
            </Button>
        </div>
    );
}
