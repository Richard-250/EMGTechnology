import {COMPANY} from '@/lib/company';
import {WhatsAppIcon} from '@/components/shared/whatsapp-icon';

export function WhatsAppFab() {
    return (
        <a
            href={COMPANY.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed z-40 flex size-12 sm:size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 hover:bg-[#20bd5a] hover:scale-105 active:scale-95 transition-all bottom-20 right-4 sm:bottom-6 sm:right-6 md:bottom-6 safe-area-fab"
            aria-label="Chat on WhatsApp"
        >
            <WhatsAppIcon className="size-6 sm:size-7" />
        </a>
    );
}
