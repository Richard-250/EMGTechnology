'use client';

import {useMemo, useState} from 'react';
import {Button} from '@/components/ui/button';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Label} from '@/components/ui/label';
import {Calendar} from '@/components/ui/calendar';
import {Loader2, Truck, Store, Bike, MapPin, CalendarDays, Clock, Building2, Phone, PackageCheck} from 'lucide-react';
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

type DeliveryDateMode = 'ship-today' | 'next-day' | 'choose-date';

interface DisplayShippingOption {
    key: string;
    backendId: string;
    name: string;
    description: string;
    priceWithTax: number;
    priceDisplayPrefix?: string;
    icon: typeof Bike | typeof Store | typeof Truck;
    isPickup: boolean;
}

export default function DeliveryStep({onComplete}: DeliveryStepProps) {
    const t = useTranslations('Checkout');
    const router = useRouter();
    const {shippingMethods, order} = useCheckout();

    // Map shipping methods dynamically from the Vendure database so admin changes to name, description, and price reflect immediately
    const deliveryOptions = useMemo<DisplayShippingOption[]>(() => {
        if (shippingMethods && shippingMethods.length > 0) {
            return shippingMethods.map((m, index) => {
                const name = m.name;
                const desc = m.description || '';
                const isMoto = /moto|taxi|bike/i.test(name) || /moto|taxi/i.test(m.code || '');
                const isPickup = /pickup|store|collect/i.test(name) || /pickup|store/i.test(m.code || '');
                const isExpress = /express|2-hour|hour|speed/i.test(name) || /express/i.test(m.code || '');

                let icon = Truck;
                let key = `method-${m.id}`;

                if (isPickup) {
                    icon = Store;
                    key = 'pickup';
                } else if (isMoto) {
                    icon = Bike;
                    key = 'moto';
                } else if (isExpress) {
                    icon = Truck;
                    key = 'express';
                } else {
                    icon = Truck;
                    key = `custom-${index}`;
                }

                // If moto method has price = 0, show "From RWF 0" (negotiable)
                const priceDisplayPrefix = (isMoto && m.priceWithTax === 0) ? 'From ' : undefined;

                return {
                    key,
                    backendId: m.id,
                    name: m.name,
                    description: desc || (isPickup
                        ? `${COMPANY.legalName} — ${formatCompanyAddress()}`
                        : isMoto
                            ? 'Negotiable fare with moto-taxi riders'
                            : 'Fast delivery across Kigali'),
                    priceWithTax: m.priceWithTax,
                    priceDisplayPrefix,
                    icon,
                    isPickup,
                };
            });
        }

        // Fallback default list if methods are loading
        return [
            {
                key: 'moto',
                backendId: 'kigali-moto-taxi',
                name: 'Kigali - Moto-taxi',
                description: 'Negotiable fare with moto-taxi riders',
                priceWithTax: 0,
                priceDisplayPrefix: 'From ',
                icon: Bike,
                isPickup: false,
            },
            {
                key: 'pickup',
                backendId: 'pickup-at-store',
                name: 'Pickup at Store',
                description: `${COMPANY.legalName} — ${formatCompanyAddress()}`,
                priceWithTax: 0,
                icon: Store,
                isPickup: true,
            },
            {
                key: 'express',
                backendId: 'express-2-hour-kigali',
                name: 'Express 2-Hour - Kigali',
                description: 'Kigali',
                priceWithTax: 350000,
                icon: Truck,
                isPickup: false,
            },
        ];
    }, [shippingMethods]);

    const [selectedOptionKey, setSelectedOptionKey] = useState<string>(() => {
        if (order.shippingLines?.length) {
            const currentMethodId = order.shippingLines[0].shippingMethod.id;
            const match = deliveryOptions.find(opt => opt.backendId === currentMethodId);
            if (match) return match.key;
        }
        return deliveryOptions[0]?.key || 'moto';
    });

    const [deliveryDateMode, setDeliveryDateMode] = useState<DeliveryDateMode>('ship-today');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [submitting, setSubmitting] = useState(false);

    // Compute minimum selectable date: strictly 2 days from today (no past, no today, no tomorrow)
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
            d.setDate(d.getDate() + 1); // skip Sunday if min date falls on Sunday
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

    const selectedOption = deliveryOptions.find(opt => opt.key === selectedOptionKey) || deliveryOptions[0];
    const isPickup = selectedOption?.isPickup ?? false;

    // Estimated date label
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
        setSubmitting(true);
        try {
            const backendId = selectedOption.backendId;
            if (backendId && backendId !== 'kigali-moto-taxi' && backendId !== 'pickup-at-store' && backendId !== 'express-2-hour-kigali') {
                await setShippingMethodAction(backendId);
            } else if (shippingMethods.length > 0) {
                await setShippingMethodAction(shippingMethods[0].id);
            }

            if (typeof window !== 'undefined') {
                sessionStorage.setItem('emg-delivery-date', estimatedDateLabel);
                sessionStorage.setItem('emg-delivery-method-name', selectedOption.name);
                sessionStorage.setItem('emg-delivery-method-id', selectedOption.backendId);
            }
            router.refresh();
            onComplete();
        } catch (error) {
            console.error('Error setting shipping method:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Delivery Zone Card (EMG Green Style) */}
            <div className="rounded-2xl border border-emerald-200/90 dark:border-emerald-800/50 bg-emerald-50/70 dark:bg-emerald-950/25 p-4 md:p-5 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                            <MapPin className="size-5" />
                        </span>
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                DELIVERY ZONE
                            </p>
                            <p className="font-bold text-base md:text-lg text-foreground mt-0.5">Rwanda</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                Covers Rulindo, Gakenke, Musanze, Gicumbi, North · Muhanga, Ruhango, Nyanza, Huye, Nyamagabe, South · Rwamagana, Kayonza, Gatsibo, Nyagatare, Ngoma, Kirehe, East · Karongi, Rusizi, Rubavu, Nyabihu, Nyamasheke, West
                            </p>
                        </div>
                    </div>
                    <span className="text-xs font-bold bg-emerald-600 text-white px-3 py-1 rounded-full shrink-0 shadow-xs">
                        {deliveryOptions.length} options
                    </span>
                </div>
            </div>

            {/* Shipping Options (Radio Group) */}
            <RadioGroup
                value={selectedOptionKey}
                onValueChange={(val) => setSelectedOptionKey(val)}
                className="space-y-3"
            >
                {deliveryOptions.map(option => {
                    const Icon = option.icon;
                    const active = selectedOptionKey === option.key;
                    return (
                        <Label
                            key={option.key}
                            htmlFor={`delivery-${option.key}`}
                            className={cn(
                                'flex cursor-pointer items-center gap-3.5 rounded-2xl border-2 p-4 md:p-4.5 transition-all duration-200 select-none',
                                active
                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm ring-1 ring-emerald-500'
                                    : 'border-border/70 hover:border-emerald-300 dark:hover:border-emerald-700 bg-card hover:bg-muted/30',
                            )}
                        >
                            <RadioGroupItem value={option.key} id={`delivery-${option.key}`} className="shrink-0 text-emerald-600 border-emerald-500" />
                            <span
                                className={cn(
                                    'flex size-11 items-center justify-center rounded-xl shrink-0 transition-colors',
                                    active
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
                                )}
                            >
                                <Icon className="size-5" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm md:text-base text-foreground">
                                    {option.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {option.description}
                                </p>
                            </div>
                            <div className="font-bold shrink-0 text-sm md:text-base text-emerald-600 dark:text-emerald-400">
                                {option.priceDisplayPrefix || ''}
                                {option.priceWithTax === 0 ? (
                                    'RWF 0'
                                ) : (
                                    <Price value={option.priceWithTax} currencyCode={order.currencyCode} />
                                )}
                            </div>
                        </Label>
                    );
                })}
            </RadioGroup>

            {/* Store Information Card (shown when Pickup at Store is selected) */}
            {isPickup && (
                <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 md:p-5 space-y-3">
                    <div className="flex items-center gap-2 text-foreground font-bold text-base">
                        <Building2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                        <h4>{COMPANY.legalName} — Store Pickup Location</h4>
                    </div>
                    <div className="text-xs md:text-sm text-muted-foreground space-y-1.5 pl-7">
                        <p className="flex items-center gap-2">
                            <MapPin className="size-4 text-emerald-600 shrink-0" />
                            <span>{COMPANY.address.building}, {COMPANY.address.road}, {COMPANY.address.city}</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <Clock className="size-4 text-emerald-600 shrink-0" />
                            <span>Open Monday – Saturday: 8:00 AM – 6:00 PM</span>
                        </p>
                        <p className="flex items-center gap-2">
                            <Phone className="size-4 text-emerald-600 shrink-0" />
                            <span>Call for assistance: {COMPANY.phoneDisplay}</span>
                        </p>
                    </div>
                    <div className="mt-3 rounded-xl bg-emerald-100/60 dark:bg-emerald-900/30 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                        ✓ No delivery fee. You will receive an SMS/Email notification when your package is ready.
                    </div>
                </div>
            )}

            {/* Delivery Date Section — shown for Kigali Moto-taxi, Express, and courier delivery */}
            {!isPickup && (
                <div className="rounded-2xl border border-border/80 p-4 md:p-5 space-y-4 bg-card">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="size-5 text-emerald-600 dark:text-emerald-400" />
                        <p className="font-bold text-sm md:text-base text-foreground">Delivery Date</p>
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
                        {/* Ship today */}
                        <Label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all select-none',
                                deliveryDateMode === 'ship-today'
                                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs'
                                    : 'border-border/70 hover:border-emerald-300 dark:hover:border-emerald-700 bg-card',
                            )}
                        >
                            <RadioGroupItem value="ship-today" className="mt-0.5 text-emerald-600 border-emerald-500" />
                            <div>
                                <span className="font-bold text-sm block text-foreground">Ship today</span>
                                <span className="text-xs text-muted-foreground">
                                    Order is before cutoff on a working day
                                </span>
                            </div>
                        </Label>

                        {/* Next shipping day */}
                        <Label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all select-none',
                                deliveryDateMode === 'next-day'
                                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs'
                                    : 'border-border/70 hover:border-emerald-300 dark:hover:border-emerald-700 bg-card',
                            )}
                        >
                            <RadioGroupItem value="next-day" className="mt-0.5 text-emerald-600 border-emerald-500" />
                            <div>
                                <span className="font-bold text-sm block text-foreground">Next shipping day</span>
                                <span className="text-xs text-muted-foreground">
                                    Next available working day
                                </span>
                            </div>
                        </Label>

                        {/* Choose another date */}
                        <Label
                            className={cn(
                                'flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all select-none',
                                deliveryDateMode === 'choose-date'
                                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs'
                                    : 'border-border/70 hover:border-emerald-300 dark:hover:border-emerald-700 bg-card',
                            )}
                        >
                            <RadioGroupItem value="choose-date" className="mt-0.5 text-emerald-600 border-emerald-500" />
                            <div>
                                <span className="font-bold text-sm block text-foreground">Choose another date</span>
                                <span className="text-xs text-muted-foreground">
                                    Scheduled delivery on an eligible future date
                                </span>
                            </div>
                        </Label>
                    </RadioGroup>

                    {/* Date Picker — shown ONLY when "Choose another date" is selected */}
                    {deliveryDateMode === 'choose-date' && (
                        <div className="space-y-2 pt-2 border-t border-border/60">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Select Future Delivery Date
                            </p>
                            <div className="rounded-xl border border-border p-2 inline-block bg-background">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => {
                                        if (date) setSelectedDate(date);
                                    }}
                                    disabled={(date) => {
                                        // Strict restriction: no past dates, no today, no tomorrow, and no Sundays
                                        const d = new Date(date);
                                        d.setHours(0, 0, 0, 0);
                                        return d < minSelectableDate || d.getDay() === 0;
                                    }}
                                    defaultMonth={minSelectableDate}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                ℹ️ Note: Past dates, today, tomorrow, and Sundays are non-selectable for scheduled bookings.
                            </p>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="rounded-xl bg-muted/60 dark:bg-muted/30 px-4 py-3 text-sm space-y-2 border border-border/50">
                        <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground text-xs md:text-sm">Estimated delivery date</span>
                            <span className="font-semibold text-xs md:text-sm text-right text-foreground">{estimatedDateLabel}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground text-xs md:text-sm">Delivery method</span>
                            <span className="font-semibold text-xs md:text-sm text-right text-foreground">{selectedOption.name}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground text-xs md:text-sm">Delivery fee</span>
                            <span className="font-bold text-xs md:text-sm text-emerald-600 dark:text-emerald-400">
                                {optionFee(selectedOption, order.currencyCode)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Continue Button (EMG Green) */}
            <Button
                onClick={handleContinue}
                disabled={submitting || (deliveryDateMode === 'choose-date' && !isPickup && !selectedDate)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 rounded-xl shadow-sm text-base transition-all cursor-pointer"
            >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('continue')}
            </Button>
        </div>
    );
}

function optionFee(option: DisplayShippingOption, currencyCode: string) {
    if (option.priceWithTax === 0) {
        return option.priceDisplayPrefix ? `${option.priceDisplayPrefix}RWF 0` : 'FREE';
    }
    return (
        <>
            {option.priceDisplayPrefix || ''}
            <Price value={option.priceWithTax} currencyCode={currencyCode} />
        </>
    );
}
