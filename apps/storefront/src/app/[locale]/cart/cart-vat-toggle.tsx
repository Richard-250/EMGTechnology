'use client';

import {Switch} from '@/components/ui/switch';
import {Label} from '@/components/ui/label';
import {useCartVat} from '@/app/[locale]/cart/cart-vat-context';
import {useTranslations} from 'next-intl';

export function CartVatToggle({compact = false}: {compact?: boolean}) {
    const t = useTranslations('Cart');
    const {includeVat, toggleVat, vatRate} = useCartVat();

    return (
        <div className={`flex items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
            <Switch id="vat-toggle" checked={includeVat} onCheckedChange={() => toggleVat()} className="scale-90" />
            <Label htmlFor="vat-toggle" className="cursor-pointer text-muted-foreground font-normal">
                {t('includeVat', {rate: vatRate})}
                <span className="ml-1 font-medium text-foreground">
                    {includeVat ? t('inclVat') : t('exclVat')}
                </span>
            </Label>
        </div>
    );
}
