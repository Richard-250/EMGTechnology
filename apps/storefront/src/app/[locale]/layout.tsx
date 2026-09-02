import type {Metadata, Viewport} from "next";
import {Suspense} from "react";
import {locale as rootLocale} from "next/root-params";
import {hasLocale, NextIntlClientProvider} from "next-intl";
import {Bebas_Neue, Manrope, Geist_Mono} from "next/font/google";
import {getMessages, getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import {routing} from "@/i18n/routing";
import {toOgLocale} from "@/i18n/locale-utils";
import {getRouteLocale} from "@/i18n/server";
import {Toaster} from "@/components/ui/sonner";
import {Navbar} from "@/components/layout/navbar";
import {Footer} from "@/components/layout/footer";
import {MobileBottomNav} from "@/components/layout/mobile-bottom-nav";
import {WhatsAppFab} from "@/components/layout/whatsapp-fab";
import {CartConfirmationProvider} from "@/components/commerce/cart-confirmation-provider";
import {CartConfirmationDrawer} from "@/components/commerce/cart-confirmation-drawer";
import {ThemeProvider} from "@/components/providers/theme-provider";
import {SITE_NAME, SITE_URL} from "@/lib/metadata";
import "./globals.css";

const bebasNeue = Bebas_Neue({
    weight: "400",
    variable: "--font-bebas",
    subsets: ["latin"],
});

const manrope = Manrope({
    variable: "--font-manrope",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export function generateStaticParams() {
    return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const ogLocale = toOgLocale(locale);
    const t = await getTranslations({locale, namespace: 'Common'});

    return {
        metadataBase: new URL(SITE_URL),
        title: {
            default: SITE_NAME,
            template: `%s | ${SITE_NAME}`,
        },
        description: t('siteDescription', {siteName: SITE_NAME}),
        icons: {
            icon: [
                { url: '/logo.png', type: 'image/png', sizes: '32x32' },
            ],
            apple: '/logo.png',
            shortcut: '/logo.png',
        },
        openGraph: {
            type: "website",
            siteName: SITE_NAME,
            locale: ogLocale,
        },
        twitter: {
            card: "summary_large_image",
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                "max-video-preview": -1,
                "max-image-preview": "large",
                "max-snippet": -1,
            },
        },
        alternates: {
            languages: Object.fromEntries(
                routing.locales.map((l) => [l, `/${l}`])
            ),
        },
    };
}

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: [
        {media: "(prefers-color-scheme: light)", color: "#F2F4F3"},
        {media: "(prefers-color-scheme: dark)", color: "#0C1210"},
    ],
};

export default async function LocaleLayout({children}: {children: React.ReactNode}) {
    const locale = await rootLocale();

    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    setRequestLocale(locale);
    const messages = await getMessages({locale});

    return (
        <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
            <body
                className={`${bebasNeue.variable} ${manrope.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
            >
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <ThemeProvider>
                        <CartConfirmationProvider>
                        <Navbar />
                        <main className="flex-1 pb-14 md:pb-0">{children}</main>
                        <Footer/>
                        <Suspense fallback={null}>
                            <MobileBottomNav />
                        </Suspense>
                        <CartConfirmationDrawer />
                        <WhatsAppFab />
                        <Toaster/>
                        </CartConfirmationProvider>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
