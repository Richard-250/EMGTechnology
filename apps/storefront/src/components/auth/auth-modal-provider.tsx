'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import {useSearchParams} from 'next/navigation';
import {usePathname, useRouter} from '@/i18n/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {AuthTabsPanel} from '@/components/auth/auth-tabs-panel';
import {useTranslations} from 'next-intl';

type AuthTab = 'sign-in' | 'register';

interface OpenAuthOptions {
    tab?: AuthTab;
    redirectTo?: string;
    message?: string;
}

interface AuthModalContextValue {
    openAuth: (options?: OpenAuthOptions) => void;
    closeAuth: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal() {
    const ctx = useContext(AuthModalContext);
    if (!ctx) {
        throw new Error('useAuthModal must be used within AuthModalProvider');
    }
    return ctx;
}

/** Soft open when provider may be missing (e.g. isolated pages). */
export function useAuthModalOptional() {
    return useContext(AuthModalContext);
}

export function AuthModalProvider({children}: {children: ReactNode}) {
    const t = useTranslations('Auth');
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<AuthTab>('sign-in');
    const [redirectTo, setRedirectTo] = useState<string | undefined>();
    const [message, setMessage] = useState<string | undefined>();

    const closeAuth = useCallback(() => {
        setOpen(false);
        setMessage(undefined);
    }, []);

    const openAuth = useCallback((options?: OpenAuthOptions) => {
        setTab(options?.tab ?? 'sign-in');
        setRedirectTo(options?.redirectTo);
        setMessage(options?.message);
        setOpen(true);
    }, []);

    // Deep-link: ?auth=sign-in|register on any page
    useEffect(() => {
        const authParam = searchParams.get('auth');
        if (authParam === 'sign-in' || authParam === 'register') {
            openAuth({
                tab: authParam,
                redirectTo: searchParams.get('redirectTo') || searchParams.get('redirect') || undefined,
                message: searchParams.get('message') || undefined,
            });
        }
    }, [searchParams, openAuth]);

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            closeAuth();
            if (pathname === '/sign-in' || pathname.endsWith('/sign-in')) {
                router.replace('/');
            } else if (searchParams.get('auth')) {
                const params = new URLSearchParams(searchParams.toString());
                params.delete('auth');
                params.delete('redirectTo');
                params.delete('redirect');
                params.delete('message');
                const qs = params.toString();
                router.replace(qs ? `${pathname}?${qs}` : pathname);
            }
        }
    };

    const value = useMemo(() => ({openAuth, closeAuth}), [openAuth, closeAuth]);

    return (
        <AuthModalContext.Provider value={value}>
            {children}
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent
                    showCloseButton
                    className="max-w-md p-0 gap-0 overflow-hidden border-border/80 shadow-2xl sm:rounded-2xl"
                >
                    <DialogHeader className="sr-only">
                        <DialogTitle>{tab === 'register' ? t('createAccount') : t('signIn')}</DialogTitle>
                        <DialogDescription>{t('welcomeBack')}</DialogDescription>
                    </DialogHeader>
                    <AuthTabsPanel
                        key={`${tab}-${redirectTo ?? ''}-${message ?? ''}`}
                        defaultTab={tab}
                        redirectTo={redirectTo}
                        message={message}
                        variant="modal"
                        onTabChange={setTab}
                    />
                </DialogContent>
            </Dialog>
        </AuthModalContext.Provider>
    );
}
