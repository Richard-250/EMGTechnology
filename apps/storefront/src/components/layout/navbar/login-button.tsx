'use client';

import {ComponentProps, useTransition} from 'react';
import {logoutAction} from '@/app/[locale]/sign-in/actions';
import {useTranslations} from 'next-intl';
import {useAuthModalOptional} from '@/components/auth/auth-modal-provider';

interface LoginButtonProps extends ComponentProps<'button'> {
    isLoggedIn: boolean;
}

export function LoginButton({isLoggedIn, ...props}: LoginButtonProps) {
    const t = useTranslations('Navigation');
    const [isPending, startTransition] = useTransition();
    const authModal = useAuthModalOptional();

    return (
        <button
            {...props}
            aria-disabled={isPending}
            onClick={() => {
                if (isLoggedIn) {
                    startTransition(async () => {
                        await logoutAction();
                    });
                } else if (authModal) {
                    authModal.openAuth({tab: 'sign-in'});
                }
            }}
        >
            {isLoggedIn ? t('signOut') : t('signIn')}
        </button>
    );
}
