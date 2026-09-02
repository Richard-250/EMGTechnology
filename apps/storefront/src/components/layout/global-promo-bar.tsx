import {Truck} from 'lucide-react';
import {COMPANY} from '@/lib/company';
import {getTranslations} from 'next-intl/server';
import {WhatsAppIcon} from '@/components/shared/whatsapp-icon';

export async function GlobalPromoBar() {
    const t = await getTranslations('Promo');

    return (
        <div className="bg-muted/40 border-y border-border/60 text-[11px] sm:text-xs md:text-sm">
            <div className="flex items-center justify-between gap-2 py-1.5 px-1 text-foreground">
                <p className="inline-flex items-center gap-1.5 font-medium text-foreground/90 truncate">
                    <Truck className="size-3 sm:size-3.5 shrink-0 text-foreground/70" aria-hidden />
                    <span className="truncate">{t('freeDelivery')}</span>
                </p>
                <a
                    href={COMPANY.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-semibold text-[#128C7E] dark:text-[#25D366] hover:opacity-80 shrink-0 transition-opacity"
                >
                    <WhatsAppIcon className="size-3.5 sm:size-4" />
                    <span className="hidden sm:inline">WhatsApp</span>
                    <span>{COMPANY.phoneDisplay}</span>
                </a>
            </div>
        </div>
    );
}
