'use client';

import {useEffect} from 'react';
import {useAuthModalOptional} from '@/components/auth/auth-modal-provider';

interface SignInOpenModalProps {
    tab: 'sign-in' | 'register';
    redirectTo?: string;
    message?: string;
}

/** Opens the global auth dialog when visiting /sign-in or /register. */
export function SignInOpenModal({tab, redirectTo, message}: SignInOpenModalProps) {
    const authModal = useAuthModalOptional();

    useEffect(() => {
        authModal?.openAuth({tab, redirectTo, message});
    }, [authModal, tab, redirectTo, message]);

    return (
        <div className="min-h-[50vh] flex items-center justify-center px-4 py-16">
            <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
    );
}
