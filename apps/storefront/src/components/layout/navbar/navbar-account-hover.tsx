'use client';

import {User, Package, MapPin} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {Button} from '@/components/ui/button';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {LoginButton} from '@/components/layout/navbar/login-button';
import {useHoverOpen} from '@/lib/use-hover-open';
import {useTranslations} from 'next-intl';
import {cn} from '@/lib/utils';

interface CustomerSummary {
    firstName: string;
    profileImageUrl?: string | null;
}

interface NavbarAccountHoverProps {
    customer: CustomerSummary | null;
}

export function NavbarAccountHover({customer}: NavbarAccountHoverProps) {
    const t = useTranslations('Navigation');
    const {open, setOpen, onEnter, onLeave} = useHoverOpen();

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <div onMouseEnter={onEnter} onMouseLeave={onLeave}>
                <PopoverTrigger
                    render={
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-foreground"
                            aria-label={customer ? t('account') : t('signIn')}
                        />
                    }
                >
                    {customer?.profileImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={customer.profileImageUrl}
                            alt=""
                            className="size-5 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <User className="size-5" />
                    )}
                </PopoverTrigger>
            </div>
            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-72 p-0 overflow-hidden"
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
            >
                {customer ? (
                    <LoggedInPanel customer={customer} />
                ) : (
                    <GuestPanel />
                )}
            </PopoverContent>
        </Popover>
    );
}

function GuestPanel() {
    const t = useTranslations('Navigation');

    return (
        <div>
            <div className="flex items-center gap-3 px-4 py-4 border-b border-border/60">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <User className="size-5 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-sm font-semibold">{t('welcome')}</p>
                    <p className="text-xs text-muted-foreground">{t('signInPrompt')}</p>
                </div>
            </div>
            <div className="p-4 space-y-3">
                <Button
                    render={<Link href="/sign-in" />}
                    nativeButton={false}
                    className="w-full bg-electric hover:bg-electric/90 text-electric-foreground font-semibold"
                >
                    {t('signIn')}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                    {t('newCustomer')}{' '}
                    <Link href="/register" className="font-semibold text-electric hover:underline">
                        {t('register')}
                    </Link>
                </p>
            </div>
            <div className="border-t border-border/60 py-1">
                <AccountQuickLink href="/sign-in" icon={Package} label={t('orders')} />
                <AccountQuickLink href="/sign-in" icon={User} label={t('account')} />
            </div>
        </div>
    );
}

function LoggedInPanel({customer}: {customer: CustomerSummary}) {
    const t = useTranslations('Navigation');

    return (
        <div>
            <div className="px-4 py-3 border-b border-border/60 bg-muted/30 flex items-center gap-3">
                {customer.profileImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={customer.profileImageUrl}
                        alt=""
                        className="size-9 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                        <User className="size-4 text-muted-foreground" />
                    </div>
                )}
                <p className="text-sm font-semibold">{t('greeting', {name: customer.firstName})}</p>
            </div>
            <div className="py-1">
                <AccountQuickLink href="/account/profile" icon={User} label={t('profile')} />
                <AccountQuickLink href="/account/orders" icon={Package} label={t('orders')} />
                <AccountQuickLink href="/account/addresses" icon={MapPin} label={t('addresses')} />
            </div>
            <div className="border-t border-border/60 p-2">
                <LoginButton
                    isLoggedIn
                    className="w-full rounded-md px-3 py-2 text-sm text-left text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                />
            </div>
        </div>
    );
}

function AccountQuickLink({
    href,
    icon: Icon,
    label,
}: {
    href: string;
    icon: typeof User;
    label: string;
}) {
    return (
        <Link
            href={href}
            className={cn(
                'flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground',
                'hover:bg-muted/60 transition-colors',
            )}
        >
            <Icon className="size-4 text-muted-foreground" />
            {label}
        </Link>
    );
}
