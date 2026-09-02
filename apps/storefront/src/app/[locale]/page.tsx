import type {Metadata} from "next";

import {Suspense} from "react";

import {getRouteLocale} from "@/i18n/server";

import {HomeHeroSection} from "@/components/commerce/home-hero-section";

import {FlashDealsLoader} from "@/components/commerce/flash-deals-loader";

import {FeaturedProducts} from "@/components/commerce/featured-products";
import {HomeFitnessCatalogSection} from "@/components/commerce/home-fitness-catalog-section";

import {SITE_NAME, SITE_URL, buildCanonicalUrl} from "@/lib/metadata";

import {Truck, ShieldCheck, Headphones} from "lucide-react";

import {getTranslations} from "next-intl/server";

import {toOgLocale} from "@/i18n/locale-utils";



export async function generateMetadata(): Promise<Metadata> {

    const locale = await getRouteLocale();

    const t = await getTranslations({locale, namespace: "Home"});

    const ogLocale = toOgLocale(locale);



    return {

        title: {

            absolute: `${SITE_NAME} - ${t("pageTitle")}`,

        },

        description: t("description"),

        alternates: {

            canonical: buildCanonicalUrl("/"),

        },

        openGraph: {

            title: `${SITE_NAME} - ${t("pageTitle")}`,

            description: t("ogDescription"),

            type: "website",

            locale: ogLocale,

            url: SITE_URL,

        },

    };

}



export default async function Home() {
    return (
        <div className="min-h-screen">
            <Suspense>
                <HomeHeroSection />
            </Suspense>
            <Suspense>
                <FlashDealsLoader />
            </Suspense>
            <Suspense>
                <FeaturedProducts />
            </Suspense>
            <Suspense>
                <HomeFitnessCatalogSection />
            </Suspense>
        </div>
    );
}

