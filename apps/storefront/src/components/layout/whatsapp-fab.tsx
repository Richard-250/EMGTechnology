import {COMPANY} from '@/lib/company';
import {WhatsAppIcon} from '@/components/shared/whatsapp-icon';

export function WhatsAppFab() {
    return (
        <a
            href={COMPANY.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 hover:bg-[#20bd5a] hover:scale-105 active:scale-95 transition-all"
            aria-label="Chat on WhatsApp"
        >
            <WhatsAppIcon className="size-7" />
        </a>
    );
}
