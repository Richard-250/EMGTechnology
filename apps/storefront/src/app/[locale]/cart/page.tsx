import type {Metadata} from 'next';
import {getRouteLocale} from '@/i18n/server';
import {getTranslations} from 'next-intl/server';
import {Cart} from '@/app/[locale]/cart/cart';
import {Suspense} from 'react';
import {CartSkeleton} from '@/components/shared/skeletons/cart-skeleton';
import {noIndexRobots} from '@/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
    const locale = await getRouteLocale();
    const t = await getTranslations({locale, namespace: 'Cart'});
    return {
        title: t('title'),
        robots: noIndexRobots(),
    };
}

export default async function CartPage() {
    return (
        <div className="min-h-screen bg-muted/40">
            <div className="container mx-auto px-4 py-8 md:py-10">
                <Suspense fallback={<CartSkeleton />}>
                    <Cart />
                </Suspense>
            </div>
        </div>
    );
}
