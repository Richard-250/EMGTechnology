import type {Metadata} from "next";

import {Suspense} from "react";

import {getRouteLocale} from "@/i18n/server";

import {HomeHeroSection} from "@/components/commerce/home-hero-section";

import {FlashDealsLoader} from "@/components/commerce/flash-deals-loader";

import {FeaturedProducts} from "@/components/commerce/featured-products";

import {CategorySection} from "@/components/layout/category-section";

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



const featureKeys = [

    {icon: Truck, key: "fastDelivery"},

    {icon: ShieldCheck, key: "highQuality"},

    {icon: Headphones, key: "bestPrices"},

] as const;



export default async function Home() {

    const locale = await getRouteLocale();

    const t = await getTranslations({locale, namespace: "Home"});



    return (

        <div className="min-h-screen">

            <HomeHeroSection />

            <Suspense>

                <FlashDealsLoader />

            </Suspense>

            <Suspense>

                <FeaturedProducts />

            </Suspense>

            <Suspense>

                <HomeFitnessCatalogSection />

            </Suspense>

            <CategorySection />



            <section className="border-t border-border py-14 md:py-16 bg-muted/30">

                <div className="container mx-auto px-4">

                    <h2 className="font-display text-3xl md:text-4xl tracking-[0.03em] text-center mb-10">

                        {t("whyShopWithUs")}

                    </h2>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">

                        {featureKeys.map(feature => (

                            <div key={feature.key} className="text-center space-y-3 group">

                                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-electric/10 text-electric transition-transform group-hover:scale-110">

                                    <feature.icon className="size-6 stroke-[1.5]" aria-hidden />

                                </div>

                                <h3 className="font-display text-xl tracking-[0.04em]">

                                    {t(`features.${feature.key}.title`)}

                                </h3>

                                <p className="text-muted-foreground text-sm leading-relaxed">

                                    {t(`features.${feature.key}.description`)}

                                </p>

                            </div>

                        ))}

                    </div>

                </div>

            </section>

        </div>

    );

}

