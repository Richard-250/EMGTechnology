import {getRouteLocale} from '@/i18n/server';
import {cacheLife, cacheTag} from 'next/cache';
import {getTopCollections} from '@/lib/vendure/cached';
import Image from "next/image";
import {NavigationLink} from '@/components/shared/navigation-link';
import {getTranslations} from 'next-intl/server';
import {SITE_NAME, SITE_LOGO_LIGHT} from "@/lib/metadata";
import {COMPANY, formatCompanyAddress} from "@/lib/company";
import {MapPin, Mail, Phone} from "lucide-react";

const COPYRIGHT_YEAR = 2026;

function InstagramIcon({className}: {className?: string}) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
    );
}

function TikTokIcon({className}: {className?: string}) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 16.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15Z" />
        </svg>
    );
}

async function Copyright() {
    'use cache'
    cacheLife('days');

    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Footer'});

    return (
        <div>
            &copy; {COPYRIGHT_YEAR} {t('copyright')}
        </div>
    )
}

export async function Footer() {
    'use cache'
    cacheLife('days');

    const locale = await getRouteLocale();
    cacheTag(`footer-${locale}`);

    const t = await getTranslations({locale, namespace: 'Footer'});
    const collections = await getTopCollections(locale);
    const shopCollections = collections.filter((c) => c.slug !== 'featured');
    const addressLine = formatCompanyAddress();

    return (
        <footer className="relative z-0 border-t border-border mt-auto bg-foreground text-background dark:bg-card dark:text-card-foreground">
            <div className="container mx-auto px-4 py-14 md:py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">
                    <div className="sm:col-span-2 lg:col-span-1">
                        <NavigationLink href="/" className="inline-block mb-4 group">
                            <Image
                                src={SITE_LOGO_LIGHT}
                                alt={SITE_NAME}
                                width={200}
                                height={72}
                                className="h-12 w-auto object-contain"
                            />
                        </NavigationLink>
                        <p className="text-sm text-background/70 dark:text-muted-foreground text-balance leading-relaxed max-w-sm">
                            {t('description')}
                        </p>
                        <div className="flex items-center gap-3 mt-5">
                            <a
                                href={COMPANY.social.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex size-10 items-center justify-center rounded-sm border border-background/20 text-background/80 hover:text-electric hover:border-electric transition-colors"
                                aria-label="Instagram"
                            >
                                <InstagramIcon className="size-5" />
                            </a>
                            <a
                                href={COMPANY.social.tiktok}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex size-10 items-center justify-center rounded-sm border border-background/20 text-background/80 hover:text-electric hover:border-electric transition-colors"
                                aria-label="TikTok"
                            >
                                <TikTokIcon className="size-5" />
                            </a>
                        </div>
                    </div>

                    <div>
                        <p className="font-display text-lg tracking-[0.06em] mb-4 text-electric">
                            {t('categories')}
                        </p>
                        <ul className="space-y-2.5 text-sm text-background/70 dark:text-muted-foreground">
                            {shopCollections.map((collection) => (
                                <li key={collection.id}>
                                    <NavigationLink
                                        href={`/collection/${collection.slug}`}
                                        className="hover:text-electric transition-colors"
                                    >
                                        {collection.name}
                                    </NavigationLink>
                                </li>
                            ))}
                            <li>
                                <NavigationLink
                                    href="/search"
                                    className="hover:text-electric transition-colors"
                                >
                                    {t('shopAll')}
                                </NavigationLink>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <p className="font-display text-lg tracking-[0.06em] mb-4 text-electric">
                            {t('customer')}
                        </p>
                        <ul className="space-y-2.5 text-sm text-background/70 dark:text-muted-foreground">
                            <li>
                                <NavigationLink
                                    href="/account/orders"
                                    className="hover:text-electric transition-colors"
                                >
                                    {t('orders')}
                                </NavigationLink>
                            </li>
                            <li>
                                <NavigationLink
                                    href="/account/profile"
                                    className="hover:text-electric transition-colors"
                                >
                                    {t('account')}
                                </NavigationLink>
                            </li>
                            <li>
                                <NavigationLink
                                    href="/privacy-policy"
                                    className="hover:text-electric transition-colors font-medium"
                                >
                                    {t('privacyPolicy')}
                                </NavigationLink>
                            </li>
                            <li>
                                <NavigationLink
                                    href="/terms-of-service"
                                    className="hover:text-electric transition-colors font-medium"
                                >
                                    {t('termsOfService')}
                                </NavigationLink>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <p className="font-display text-lg tracking-[0.06em] mb-4 text-electric">
                            {t('contact')}
                        </p>
                        <ul className="space-y-3.5 text-sm text-background/70 dark:text-muted-foreground">
                            <li className="flex gap-2.5">
                                <MapPin className="size-4 shrink-0 mt-0.5 text-electric" aria-hidden />
                                <div className="space-y-1">
                                    <p>{COMPANY.address.building}</p>
                                    <p>{COMPANY.address.road}</p>
                                    <p>{COMPANY.address.city}, {COMPANY.address.country}</p>
                                    <a
                                        href={COMPANY.mapUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block text-electric hover:underline underline-offset-4"
                                    >
                                        {t('getDirections')}
                                    </a>
                                </div>
                            </li>
                            <li>
                                <a
                                    href={`tel:${COMPANY.phone}`}
                                    className="flex gap-2.5 items-center hover:text-electric transition-colors"
                                >
                                    <Phone className="size-4 shrink-0 text-electric" aria-hidden />
                                    <span>{COMPANY.phoneDisplay}</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href={`mailto:${COMPANY.email}`}
                                    className="flex gap-2.5 items-center hover:text-electric transition-colors break-all"
                                >
                                    <Mail className="size-4 shrink-0 text-electric" aria-hidden />
                                    <span>{COMPANY.email}</span>
                                </a>
                            </li>
                        </ul>
                        <p className="sr-only">{addressLine}</p>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-background/15 dark:border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-background/60 dark:text-muted-foreground">
                    <Copyright/>
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                        <NavigationLink
                            href="/privacy-policy"
                            className="font-medium text-background/80 dark:text-foreground/80 hover:text-electric transition-colors"
                        >
                            {t('privacyPolicy')}
                        </NavigationLink>
                        <NavigationLink
                            href="/terms-of-service"
                            className="font-medium text-background/80 dark:text-foreground/80 hover:text-electric transition-colors"
                        >
                            {t('termsOfService')}
                        </NavigationLink>
                    </div>
                </div>
            </div>
        </footer>
    );
}
