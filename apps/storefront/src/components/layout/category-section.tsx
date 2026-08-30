import Image from "next/image";
import { Link } from "@/i18n/navigation";
import {getTranslations} from "next-intl/server";
import {getRouteLocale} from "@/i18n/server";

import {STORE_IMAGES} from "@/lib/store-images";

const CATEGORIES = [
    {
        slug: "cardio",
        image: STORE_IMAGES.cardio,
        nameKey: "cardio" as const,
    },
    {
        slug: "strength",
        image: STORE_IMAGES.strength,
        nameKey: "strength" as const,
    },
    {
        slug: "home-gyms",
        image: STORE_IMAGES.homeGyms,
        nameKey: "homeGyms" as const,
    },
    {
        slug: "accessories",
        image: STORE_IMAGES.accessories,
        nameKey: "accessories" as const,
    },
] as const;

export async function CategorySection() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: "Home"});

    return (
        <section className="py-10 md:py-14 border-t border-border bg-background">
            <div className="container mx-auto px-4">
                <div className="mb-10 md:mb-12 max-w-xl">
                    <h2 className="font-display text-4xl md:text-5xl tracking-[0.03em] text-foreground">
                        {t("shopByCategory")}
                    </h2>
                    <p className="mt-3 text-muted-foreground text-base md:text-lg leading-relaxed">
                        {t("shopByCategorySubtitle")}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                    {CATEGORIES.map((cat) => (
                        <Link
                            key={cat.slug}
                            href={`/collection/${cat.slug}`}
                            className="group relative block aspect-[4/5] overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Image
                                src={cat.image}
                                alt=""
                                fill
                                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                            <div
                                className="absolute inset-0 bg-gradient-to-t from-[#0C1210]/85 via-[#0C1210]/25 to-transparent"
                                aria-hidden
                            />
                            <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                                <span className="font-display text-2xl md:text-3xl text-white tracking-[0.04em] group-hover:text-electric transition-colors duration-300">
                                    {t(`categories.${cat.nameKey}`)}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
