'use client';

import {useMemo, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Loader2, MapPin} from 'lucide-react';
import {useRouter} from '@/i18n/navigation';
import {useCheckout} from '../checkout-provider';
import {setShippingAddress} from '../actions';
import {RWANDA_LOCATIONS, getRwandaDistrict, getRwandaProvince} from '@/lib/rwanda-locations';
import {useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';

interface ShippingAddressStepProps {
    onComplete: () => void;
}

export default function ShippingAddressStep({onComplete}: ShippingAddressStepProps) {
    const t = useTranslations('Checkout');
    const router = useRouter();
    const {order, countries} = useCheckout();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const rwanda = countries.find(c => c.code === 'RW') ?? countries[0];
    const customerName = order.customer
        ? `${order.customer.firstName} ${order.customer.lastName}`.trim()
        : '';

    const [province, setProvince] = useState(order.shippingAddress?.province || '');
    const [district, setDistrict] = useState(order.shippingAddress?.city || '');
    const [sector, setSector] = useState(order.shippingAddress?.streetLine2 || '');
    const [street, setStreet] = useState(order.shippingAddress?.streetLine1 || '');
    const [phoneNumber, setPhoneNumber] = useState(
        order.shippingAddress?.phoneNumber || order.customer?.phoneNumber || '',
    );
    const [fullName, setFullName] = useState(order.shippingAddress?.fullName || customerName);

    const districts = useMemo(
        () => getRwandaProvince(province)?.districts ?? [],
        [province],
    );
    const sectors = useMemo(
        () => getRwandaDistrict(province, district)?.sectors ?? [],
        [province, district],
    );

    const handleProvinceChange = (value: string) => {
        setProvince(value);
        setDistrict('');
        setSector('');
    };

    const handleDistrictChange = (value: string) => {
        setDistrict(value);
        setSector('');
    };

    const handleContinue = async () => {
        if (!province || !district || !street.trim() || !fullName.trim()) {
            setError(t('fillDeliveryLocation'));
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await setShippingAddress({
                fullName: fullName.trim(),
                streetLine1: street.trim(),
                streetLine2: sector || undefined,
                city: district,
                province,
                postalCode: '',
                countryCode: rwanda?.code || 'RW',
                phoneNumber: phoneNumber.trim() || '',
                company: undefined,
            }, true);
            router.refresh();
            onComplete();
        } catch {
            setError(t('unexpectedError'));
        } finally {
            setLoading(false);
        }
    };

    const selectClass =
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-semibold text-base">{t('whereDeliver')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t('whereDeliverHint')}</p>
            </div>

            <div className="rounded-xl border border-electric/30 bg-electric/5 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <span className="flex size-10 items-center justify-center rounded-full bg-electric text-electric-foreground shrink-0">
                        <MapPin className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="font-semibold">{t('shippingZoneRwanda')}</p>
                        <p className="text-xs text-muted-foreground">{t('shippingZoneFrom')}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <p className="font-medium text-sm">{t('deliveryLocation')}</p>
                <p className="text-xs text-muted-foreground">{t('deliveryLocationHint')}</p>

                <div className="grid sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                        <Label>{t('province')}</Label>
                        <select
                            className={selectClass}
                            value={province}
                            onChange={e => handleProvinceChange(e.target.value)}
                        >
                            <option value="">{t('selectProvince')}</option>
                            {RWANDA_LOCATIONS.map(p => (
                                <option key={p.name} value={p.name}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>{t('district')}</Label>
                        <select
                            className={cn(selectClass, !province && 'opacity-60')}
                            value={district}
                            disabled={!province}
                            onChange={e => handleDistrictChange(e.target.value)}
                        >
                            <option value="">{t('selectDistrict')}</option>
                            {districts.map(d => (
                                <option key={d.name} value={d.name}>
                                    {d.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <Label>{t('sectorCell')}</Label>
                        <select
                            className={cn(selectClass, !district && 'opacity-60')}
                            value={sector}
                            disabled={!district}
                            onChange={e => setSector(e.target.value)}
                        >
                            <option value="">{t('selectSector')}</option>
                            {sectors.map(s => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label>{t('streetLandmark')}</Label>
                    <Input
                        value={street}
                        onChange={e => setStreet(e.target.value)}
                        placeholder={t('streetLandmarkPlaceholder')}
                    />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <Label>{t('fullName')}</Label>
                        <Input value={fullName} onChange={e => setFullName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label>{t('phoneNumber')}</Label>
                        <Input
                            value={phoneNumber}
                            onChange={e => setPhoneNumber(e.target.value)}
                            placeholder="078..."
                        />
                    </div>
                </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
                type="button"
                onClick={handleContinue}
                disabled={loading}
                className="w-full bg-electric hover:bg-electric/90 text-electric-foreground"
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('continue')}
            </Button>
        </div>
    );
}
