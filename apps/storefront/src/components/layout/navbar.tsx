import Image from 'next/image';
import {NavigationLink} from '@/components/shared/navigation-link';
import {NavbarCart} from '@/components/layout/navbar/navbar-cart';
import {NavbarUserIcon} from '@/components/layout/navbar/navbar-user-icon';
import {LanguagePicker} from '@/components/layout/navbar/language-picker';
import {ThemeSwitcher} from '@/components/layout/navbar/theme-switcher';
import {CurrencyPickerWrapper} from '@/components/layout/navbar/currency-picker-wrapper';
import {MobileNavWrapper} from '@/components/layout/navbar/mobile-nav-wrapper';
import {NavbarSearchBarLoader} from '@/components/layout/navbar/navbar-search-loader';
import {NavbarSubnav} from '@/components/layout/navbar/navbar-subnav';
import {GlobalPromoBar} from '@/components/layout/global-promo-bar';
import {Suspense} from 'react';
import {NavbarUserSkeleton} from '@/components/shared/skeletons/navbar-user-skeleton';
import {SearchInputSkeleton} from '@/components/shared/skeletons/search-input-skeleton';
import {SITE_NAME, SITE_LOGO} from '@/lib/metadata';
import {COMPANY} from '@/lib/company';
import {WhatsAppIcon} from '@/components/shared/whatsapp-icon';

function RwandaFlag() {
    return (
        <span
            className="inline-flex size-6 items-center justify-center rounded-full overflow-hidden border border-border/60 text-base leading-none"
            title={COMPANY.address.country}
            aria-hidden
        >
            🇷🇼
        </span>
    );
}

export function Navbar() {
    return (
        <>
            <div className="fixed top-0 left-0 right-0 z-50 bg-background shadow-sm">
                <header className="border-b border-border">
                    <div className="container mx-auto px-4">
                        {/* Top row — logo, search, utilities */}
                        <div className="flex items-center gap-3 md:gap-4 h-16">
                            <div className="flex items-center gap-2 md:gap-3 shrink-0">
                                <Suspense>
                                    <MobileNavWrapper />
                                </Suspense>
                                <NavigationLink href="/" className="flex items-center shrink-0">
                                    <Image
                                        src={SITE_LOGO}
                                        alt={SITE_NAME}
                                        width={180}
                                        height={64}
                                        priority
                                        className="h-9 md:h-11 w-auto object-contain"
                                    />
                                </NavigationLink>
                            </div>

                            <div className="hidden sm:flex flex-1 max-w-2xl mx-auto px-2">
                                <Suspense fallback={<SearchInputSkeleton />}>
                                    <NavbarSearchBarLoader />
                                </Suspense>
                            </div>

                            <div className="flex items-center gap-1 md:gap-2 ml-auto shrink-0">
                                <a
                                    href={COMPANY.whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex size-9 items-center justify-center rounded-full text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
                                    aria-label="Chat on WhatsApp"
                                >
                                    <WhatsAppIcon className="size-5" />
                                </a>
                                <Suspense fallback={null}>
                                    <ThemeSwitcher />
                                </Suspense>
                                <Suspense>
                                    <LanguagePicker />
                                </Suspense>
                                <div className="hidden lg:flex items-center">
                                    <RwandaFlag />
                                </div>
                                <Suspense>
                                    <CurrencyPickerWrapper />
                                </Suspense>
                                <Suspense fallback={<NavbarUserSkeleton />}>
                                    <NavbarUserIcon />
                                </Suspense>
                                <Suspense>
                                    <NavbarCart />
                                </Suspense>
                            </div>
                        </div>

                        {/* Mobile search */}
                        <div className="sm:hidden pb-3">
                            <Suspense fallback={<SearchInputSkeleton />}>
                                <NavbarSearchBarLoader />
                            </Suspense>
                        </div>

                        {/* Promo — below logo & search, above subnav */}
                        <GlobalPromoBar />

                        <Suspense fallback={null}>
                            <NavbarSubnav />
                        </Suspense>
                    </div>
                </header>
            </div>
            {/* Spacer for fixed header */}
            <div className="h-[9.5rem] sm:h-[8.75rem] md:h-[9.25rem]" aria-hidden />
        </>
    );
}
