'use client';

import {useTranslations} from 'next-intl';
import {Coins} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {useRouter} from '@/i18n/navigation';
import {switchCurrency} from '@/lib/actions/switch-currency';
import {useTransition} from 'react';

interface CurrencyPickerProps {
    availableCurrencyCodes: string[];
    activeCurrencyCode: string;
}

const CURRENCY_LABELS: Record<string, string> = {
    RWF: 'Rwandan Franc (RWF)',
    USD: 'US Dollar (USD)',
};

export function CurrencyPicker({availableCurrencyCodes, activeCurrencyCode}: CurrencyPickerProps) {
    const t = useTranslations('Navigation');
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleCurrencyChange = (currencyCode: string) => {
        startTransition(async () => {
            await switchCurrency(currencyCode);
            router.refresh();
        });
    };

    if (availableCurrencyCodes.length <= 1) {
        return (
            <span
                className="inline-flex items-center gap-1 px-1.5 text-xs font-semibold text-foreground"
                title={activeCurrencyCode}
            >
                {activeCurrencyCode}
            </span>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button variant="ghost" size="sm" className="gap-1 px-2 font-semibold text-foreground" aria-label={t('switchCurrency')} />
                }
            >
                <Coins className="size-4 hidden sm:block" />
                <span>{activeCurrencyCode}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {availableCurrencyCodes.map((code) => (
                    <DropdownMenuItem
                        key={code}
                        onClick={() => handleCurrencyChange(code)}
                        disabled={isPending}
                    >
                        <span>{CURRENCY_LABELS[code] ?? code}</span>
                        {activeCurrencyCode === code && <span className="ml-auto text-xs">✓</span>}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
