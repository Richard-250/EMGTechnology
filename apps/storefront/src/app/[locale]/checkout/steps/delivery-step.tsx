'use client';

import {useMemo, useState} from 'react';
import {Button} from '@/components/ui/button';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Label} from '@/components/ui/label';
import {Calendar} from '@/components/ui/calendar';
import {
    Loader2,
    Truck,
    Store,
    Bike,
    MapPin,
    CalendarDays,
    Clock,
    Building2,
    Phone,
    PackageCheck,
} from 'lucide-react';
import {useRouter} from '@/i18n/navigation';
import {useCheckout} from '../checkout-provider';
import {setOrderDeliveryDate, setShippingMethod as setShippingMethodAction} from '../actions';
import {Price} from '@/components/commerce/price';
import {COMPANY, formatCompanyAddress} from '@/lib/company';
import {useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';
import type {LucideIcon} from 'lucide-react';

interface DeliveryStepProps {
    onComplete: () => void;
}

type DeliveryDateMode = 'ship-today' | 'next-day' | 'choose-date';

interface ShippingMethodOption {
    id: string;
    name: string;
    code: string;
    description: string;
    priceWithTax: number;
    icon: LucideIcon;
    isPickup: boolean;
}

function resolveShippingIcon(name: string, code: string): LucideIcon {
    const label = `${name} ${code}`.toLowerCase();
    if (/pickup|store|collect/.test(label)) return Store;
    if (/moto|taxi|bike/.test(label)) return Bike;
    if (/express|hour|speed|courier/.test(label)) return Truck;
    return PackageCheck;
}

function isPickupMethod(name: string, code: string): boolean {
    const label = `${name} ${code}`.toLowerCase();
    return /pickup|store|collect/.test(label);
}

function resolveDescription(name: string, code: string, apiDescription?: string | null): string {
    if (apiDescription?.trim()) return apiDescription.trim();
    if (isPickupMethod(name, code)) {
        return `${COMPANY.legalName} — ${formatCompanyAddress()}`;
    }
    return name;
}

export default function DeliveryStep({onComplete}: DeliveryStepProps) {
    const t = useTranslations('Checkout');
    const router = useRouter();
    const {shippingMethods, order, setDeliveryDateLabel} = useCheckout();

    const deliveryOptions = useMemo<ShippingMethodOption[]>(() => {
        return (shippingMethods ?? []).map(method => ({
            id: method.id,
            name: method.name,
            code: method.code,
            description: resolveDescription(method.name, method.code, method.description),
            priceWithTax: method.priceWithTax ?? 0,
            icon: resolveShippingIcon(method.name, method.code),
            isPickup: isPickupMethod(method.name, method.code),
        }));
    }, [shippingMethods]);

    const [selectedMethodId, setSelectedMethodId] = useState<string>(() => {
        if (order.shippingLines?.length) {
            return order.shippingLines[0].shippingMethod.id;
        }
        return deliveryOptions[0]?.id ?? '';
    });

    const [deliveryDateMode, setDeliveryDateMode] = useState<DeliveryDateMode>('ship-today');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [submitting, setSubmitting] = useState(false);

    const minSelectableDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        d.setHours(0, 0, 0, 0);
        return d;
    }, []);

    const defaultChooseDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        d.setHours(0, 0, 0, 0);
        if (d.getDay() === 0) {
            d.setDate(d.getDate() + 1);
        }
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

    const selectedOption =
        deliveryOptions.find(opt => opt.id === selectedMethodId) ?? deliveryOptions[0];
    const isPickup = selectedOption?.isPickup ?? false;

    const estimatedDateLabel = useMemo(() => {
        if (isPickup) return 'Ready for pickup in 1-2 hours';
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
    }, [isPickup, deliveryDateMode, selectedDate, todayLabel]);

    const handleContinue = async () => {
        if (!selectedOption) return;

        setSubmitting(true);
        try {
            await setShippingMethodAction(selectedOption.id);
            await setOrderDeliveryDate(estimatedDateLabel);
            setDeliveryDateLabel(estimatedDateLabel);
            router.refresh();
            onComplete();
        } catch (error) {
            console.error('Error setting shipping method:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (deliveryOptions.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">{t('noShippingMethods')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-electric/20 bg-electric/5 p-4 md:p-5 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-electric/15 text-electric shrink-0 mt-0.5">
                            <MapPin className="size-5" />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-electric">
                                {t('deliveryZone')}
                            </p>
                            <p className="font-bold text-base md:text-lg text-foreground mt-0.5">Rwanda</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                Covers Rulindo, Gakenke, Musanze, Gicumbi, North · Muhanga, Ruhango, Nyanza, Huye, Nyamagabe, South · Rwamagana, Kayonza, Gatsibo, Nyagatare, Ngoma, Kirehe, East · Karongi, Rusizi, Rubavu, Nyabihu, Nyamasheke, West
                            </p>
                        </div>
                    </div>
                    <span className="text-xs font-bold bg-electric text-electric-foreground px-3 py-1 rounded-full shrink-0 shadow-xs">
                        {deliveryOptions.length} options
                    </span>
                </div>
            </div>

            <RadioGroup
                value={selectedMethodId}
                onValueChange={setSelectedMethodId}
                className="space-y-3"
            >
                {deliveryOptions.map(option => {
                    const Icon = option.icon;
                    const active = selectedMethodId === option.id;
                    return (
                        <Label
                            key={option.id}
                            htmlFor={`delivery-${option.id}`}
                            className={cn(
                                'flex cursor-pointer items-center gap-3.5 rounded-2xl border-2 p-4 md:p-4.5 transition-all duration-200 select-none',
                                active
                                    ? 'border-electric bg-electric/5 shadow-sm ring-1 ring-electric'
                                    : 'border-border/70 hover:border-electric/40 bg-card hover:bg-muted/30',
                            )}
                        >
                            <RadioGroupItem
                                value={option.id}
                                id={`delivery-${option.id}`}
                                className="shrink-0 text-electric border-electric"
                            />
                            <span
                                className={cn(
                                    'flex size-11 items-center justify-center rounded-xl shrink-0 transition-colors',
                                    active
                                        ? 'bg-electric text-electric-foreground shadow-xs'
                                        : 'bg-electric/10 text-electric',
                                )}
                            >
                                <Icon className="size-5" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm md:text-base text-foreground">{option.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {option.description}
                                </p>
                            </div>
                            <div className="font-bold shrink-0 text-sm md:text-base text-electric">
                                {option.priceWithTax === 0 ? (
                                    t('free')
                                ) : (
                                    <Price value={option.priceWithTax} currencyCode={order.currencyCode} />
                                )}
                            </div>
                        </Label>
                    );
                })}
            </RadioGroup>

            {isPickup && selectedOption && (
                <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 md:p-5 space-y-3">
                    <div className="flex items-center gap-2 text-foreground font-bold text-base">
                        <Building2 className="size-5 text-electric" />
                        <h4>{COMPANY.legalName} — Store Pickup Location</h4>
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground space-y-1.5 pl-7">
                        <p className="flex items-center gap-2">
                            <MapPin className="size-4 text-electric shrink-0" />
                            <span>{COMPANY.address.building}, {COMPANY.address.road}, {COMPANY.address.city}</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <Clock className="size-4 text-electric shrink-0" />
                            <span>Open Monday – Saturday: 8:00 AM – 6:00 PM</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <Phone className="size-4 text-electric shrink-0" />
                            <span>Call for assistance: {COMPANY.phoneDisplay}</span>
                        </p>
                    </div>
                    <div className="mt-3 rounded-xl bg-electric/10 px-3 py-2 text-xs text-electric font-medium">
                        ✓ No delivery fee. You will receive an SMS/Email notification when your package is ready.
                    </div>
                </div>
            )}

            {!isPickup && selectedOption && (
                <div className="rounded-2xl border border-border/80 p-4 md:p-5 space-y-4 bg-card">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="size-5 text-electric" />
                        <p className="font-bold text-sm md:text-base text-foreground">{t('deliveryDate')}</p>
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
                        className="space-y-2.5"
                    >
                        <Label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all select-none',
                                deliveryDateMode === 'ship-today'
                                    ? 'border-electric bg-electric/5 shadow-xs'
                                    : 'border-border/70 hover:border-electric/40 bg-card',
                            )}
                        >
                            <RadioGroupItem value="ship-today" className="mt-0.5 text-electric border-electric" />
                            <div>
                                <span className="font-bold text-sm block text-foreground">Ship today</span>
                                <span className="text-xs text-muted-foreground">
                                    Order is before cutoff on a working day
                                </span>
                            </div>
                        </Label>

                        <Label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all select-none',
                                deliveryDateMode === 'next-day'
                                    ? 'border-electric bg-electric/5 shadow-xs'
                                    : 'border-border/70 hover:border-electric/40 bg-card',
                            )}
                        >
                            <RadioGroupItem value="next-day" className="mt-0.5 text-electric border-electric" />
                            <div>
                                <span className="font-bold text-sm block text-foreground">Next shipping day</span>
                                <span className="text-xs text-muted-foreground">Next available working day</span>
                            </div>
                        </Label>

                        <Label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all select-none',
                                deliveryDateMode === 'choose-date'
                                    ? 'border-electric bg-electric/5 shadow-xs'
                                    : 'border-border/70 hover:border-electric/40 bg-card',
                            )}
                        >
                            <RadioGroupItem value="choose-date" className="mt-0.5 text-electric border-electric" />
                            <div>
                                <span className="font-bold text-sm block text-foreground">Choose another date</span>
                                <span className="text-xs text-muted-foreground">
                                    Scheduled delivery on an eligible future date
                                </span>
                            </div>
                        </Label>
                    </RadioGroup>

                    {deliveryDateMode === 'choose-date' && (
                        <div className="space-y-2 pt-2 border-t border-border/60">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Select Future Delivery Date
                            </p>
                            <div className="rounded-xl border border-border p-2 inline-block bg-background">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={date => {
                                        if (date) setSelectedDate(date);
                                    }}
                                    disabled={date => {
                                        const d = new Date(date);
                                        d.setHours(0, 0, 0, 0);
                                        return d < minSelectableDate || d.getDay() === 0;
                                    }}
                                    defaultMonth={minSelectableDate}
                                />
                            </div>
                        </div>
                    )}

                    <div className="rounded-xl bg-muted/60 px-4 py-3 text-sm space-y-2 border border-border/50">
                        <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground text-xs md:text-sm">Estimated delivery date</span>
                            <span className="font-semibold text-xs md:text-sm text-right text-foreground">
                                {estimatedDateLabel}
                            </span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground text-xs md:text-sm">Delivery method</span>
                            <span className="font-semibold text-xs md:text-sm text-right text-foreground">
                                {selectedOption.name}
                            </span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground text-xs md:text-sm">{t('deliveryFee')}</span>
                            <span className="font-bold text-xs md:text-sm text-electric">
                                {selectedOption.priceWithTax === 0 ? (
                                    t('free')
                                ) : (
                                    <Price value={selectedOption.priceWithTax} currencyCode={order.currencyCode} />
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <Button
                onClick={handleContinue}
                disabled={submitting || (deliveryDateMode === 'choose-date' && !isPickup && !selectedDate)}
                className="w-full bg-electric hover:bg-electric/90 text-electric-foreground font-bold py-6 rounded-xl shadow-sm text-base"
            >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('continue')}
            </Button>
        </div>
    );
}
