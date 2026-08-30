import {Phone, Truck} from 'lucide-react';
import {COMPANY} from '@/lib/company';
import {getTranslations} from 'next-intl/server';

export async function GlobalPromoBar() {
    const t = await getTranslations('Promo');

    return (
        <div className="bg-electric/10 border-y border-electric/20 text-[11px] sm:text-xs md:text-sm">
            <div className="flex items-center justify-between gap-2 py-1.5 px-1 text-foreground">
                <p className="inline-flex items-center gap-1.5 font-medium text-foreground/90 truncate">
                    <Truck className="size-3 sm:size-3.5 shrink-0 text-electric" aria-hidden />
                    <span className="truncate">{t('freeDelivery')}</span>
                </p>
                <a
                    href={`tel:${COMPANY.phone}`}
                    className="inline-flex items-center gap-1 font-semibold text-electric hover:underline underline-offset-2 shrink-0"
                >
                    <Phone className="size-3 sm:size-3.5" aria-hidden />
                    <span>{COMPANY.phoneDisplay}</span>
                </a>
            </div>
        </div>
    );
}
