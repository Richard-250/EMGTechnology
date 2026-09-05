'use client';

import {useEffect, useState} from 'react';
import {Clock} from 'lucide-react';
import {DealProductCard} from '@/components/commerce/deal-product-card';
import {Link} from '@/i18n/navigation';
import type {DealProductCardData} from '@/lib/discount-display';
import {useTranslations} from 'next-intl';

interface FlashDealsSectionProps {
    products: DealProductCardData[];
}

function useCountdown() {
    const [timeLeft, setTimeLeft] = useState({h: 0, m: 0, s: 0});

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            const diff = end.getTime() - now.getTime();
            setTimeLeft({
                h: Math.floor(diff / 3_600_000),
                m: Math.floor((diff % 3_600_000) / 60_000),
                s: Math.floor((diff % 60_000) / 1000),
            });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    return timeLeft;
}

function Pad({value}: {value: number}) {
    return <span className="tabular-nums">{String(value).padStart(2, '0')}</span>;
}

export function FlashDealsSection({products}: FlashDealsSectionProps) {
    const t = useTranslations('Deals');
    const countdown = useCountdown();

    if (!products.length) return null;

    return (
        <section className="border-b border-border bg-background">
            <div className="container mx-auto px-4 py-6 md:py-8">
                <h2 className="text-center text-lg md:text-xl font-bold mb-4">{t('todaysDeals')}</h2>

                <div className="rounded-xl bg-muted/50 border border-border/60 p-4 md:p-5 flex flex-col lg:flex-row gap-4 md:gap-6">
                    {/* Left promo panel — AliExpress SuperDeals style */}
                    <div className="lg:w-44 xl:w-52 shrink-0 flex flex-row lg:flex-col items-center lg:items-start justify-between lg:justify-center gap-3 lg:gap-4">
                        <div className="space-y-2">
                            <p className="text-xl md:text-2xl font-bold tracking-tight">{t('superDeals')}</p>
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border px-3 py-1.5 text-xs font-medium shadow-sm">
                                <Clock className="size-3.5 text-red-500" />
                                <span className="text-muted-foreground">{t('endsIn')}:</span>
                                <span className="font-mono font-semibold text-foreground">
                                    <Pad value={countdown.h} />:<Pad value={countdown.m} />:<Pad value={countdown.s} />
                                </span>
                            </div>
                        </div>
                        <Link
                            href="/deals"
                            className="inline-flex items-center justify-center rounded-md bg-foreground text-background px-5 py-2.5 text-sm font-bold hover:bg-foreground/90 transition-colors shrink-0"
                        >
                            {t('shopNow')}
                        </Link>
                    </div>

                    {/* Product row */}
                    <div className="flex-1 min-w-0 overflow-x-auto scrollbar-thin">
                        <div className="flex gap-3 pb-1">
                            {products.map(product => (
                                <DealProductCard key={product.productId} product={product} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
