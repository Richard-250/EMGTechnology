import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import {HomeHeroCarousel} from '@/components/commerce/home-hero-carousel';
import {STORE_IMAGES} from '@/lib/store-images';

export async function HomeHeroSection() {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Hero'});

    const slides = [
        {
            image: STORE_IMAGES.hero,
            href: '/search',
            title: t('title'),
            subtitle: t('subtitle'),
            cta: t('shopNow'),
        },
        {
            image: STORE_IMAGES.cardio,
            href: '/collection/cardio',
            title: t('cardioTitle'),
            subtitle: t('cardioSubtitle'),
            cta: t('shopNow'),
        },
        {
            image: STORE_IMAGES.strength,
            href: '/collection/strength',
            title: t('strengthTitle'),
            subtitle: t('strengthSubtitle'),
            cta: t('shopNow'),
        },
    ];

    return <HomeHeroCarousel slides={slides} />;
}
