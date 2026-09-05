'use client';

import {Home, LayoutGrid, ShoppingCart, User, Zap} from 'lucide-react';
import {useTranslations} from 'next-intl';
import {Link, usePathname} from '@/i18n/navigation';
import {cn} from '@/lib/utils';

const tabs = [
    { href: '/', icon: Home, labelKey: 'home' as const },
    { href: '/search', icon: LayoutGrid, labelKey: 'categories' as const },
    { href: '/deals', icon: Zap, labelKey: 'deals' as const },
    { href: '/cart', icon: ShoppingCart, labelKey: 'cart' as const },
    { href: '/account/profile', icon: User, labelKey: 'account' as const },
];

export function MobileBottomNav() {
    const t = useTranslations('MobileNav');
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md safe-area-pb"
            aria-label={t('label')}
        >
            <div className="grid grid-cols-5 h-14">
                {tabs.map(tab => {
                    const active = isActive(tab.href);
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                'flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                                active ? 'text-electric' : 'text-muted-foreground',
                            )}
                        >
                            <tab.icon className={cn('size-5', active && 'stroke-[2.5]')} />
                            {t(tab.labelKey)}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
