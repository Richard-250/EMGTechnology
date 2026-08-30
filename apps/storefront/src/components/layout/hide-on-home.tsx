'use client';

import {usePathname} from '@/i18n/navigation';

/** Hide category bar on homepage — filters row includes All Categories there. */
export function HideOnHome({children}: {children: React.ReactNode}) {
    const pathname = usePathname();
    const isHome = pathname === '/' || pathname === '';

    if (isHome) {
        return null;
    }

    return <>{children}</>;
}
