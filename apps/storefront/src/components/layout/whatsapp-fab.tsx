'use client';

import {COMPANY} from '@/lib/company';
import {WhatsAppIcon} from '@/components/shared/whatsapp-icon';
import {usePathname} from '@/i18n/navigation';
import {cn} from '@/lib/utils';

/**
 * Floating WhatsApp button. Sits above the mobile bottom nav, and higher on
 * checkout/cart so it does not cover Continue / Place order actions.
 */
export function WhatsAppFab() {
    const pathname = usePathname();
    const liftForActions =
        pathname.startsWith('/checkout') ||
        pathname.startsWith('/cart') ||
        pathname.includes('/checkout') ||
        pathname.includes('/cart');

    return (
        <a
            href={COMPANY.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                'fixed z-40 flex size-12 sm:size-14 items-center justify-center rounded-full',
                'bg-whatsapp text-whatsapp-foreground shadow-lg shadow-black/20',
                'hover:opacity-90 hover:scale-105 active:scale-95 transition-all',
                'right-4 sm:right-6 md:bottom-6',
                // Mobile: clear bottom nav (h-14) + leave room for page CTAs
                liftForActions ? 'bottom-32' : 'bottom-24',
                'sm:bottom-6',
            )}
            aria-label="Chat on WhatsApp"
        >
            <WhatsAppIcon className="size-6 sm:size-7" />
        </a>
    );
}
