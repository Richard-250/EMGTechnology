import {Phone} from "lucide-react";
import {COMPANY} from "@/lib/company";

export function HomePromoBar() {
    return (
        <div className="bg-electric text-electric-foreground text-sm">
            <div className="container mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="font-medium tracking-wide">
                    Premium fitness equipment, delivery across Rwanda
                </p>
                <a
                    href={`tel:${COMPANY.phone}`}
                    className="inline-flex items-center gap-2 font-semibold hover:underline underline-offset-4"
                >
                    <Phone className="size-4" aria-hidden />
                    {COMPANY.phoneDisplay}
                </a>
            </div>
        </div>
    );
}
