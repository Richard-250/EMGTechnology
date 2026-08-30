'use client';

import {createContext, useCallback, useContext, useState} from 'react';

export interface CartConfirmationItem {
    name: string;
    slug: string;
    image?: string;
    quantity: number;
    unitPrice: number;
    currencyCode: string;
}

interface CartConfirmationContextValue {
    open: boolean;
    item: CartConfirmationItem | null;
    cartCount: number;
    showConfirmation: (item: CartConfirmationItem, cartCount: number) => void;
    close: () => void;
}

const CartConfirmationContext = createContext<CartConfirmationContextValue | null>(null);

export function CartConfirmationProvider({children}: {children: React.ReactNode}) {
    const [open, setOpen] = useState(false);
    const [item, setItem] = useState<CartConfirmationItem | null>(null);
    const [cartCount, setCartCount] = useState(0);

    const showConfirmation = useCallback((nextItem: CartConfirmationItem, count: number) => {
        setItem(nextItem);
        setCartCount(count);
        setOpen(true);
    }, []);

    const close = useCallback(() => setOpen(false), []);

    return (
        <CartConfirmationContext.Provider value={{open, item, cartCount, showConfirmation, close}}>
            {children}
        </CartConfirmationContext.Provider>
    );
}

export function useCartConfirmation() {
    const ctx = useContext(CartConfirmationContext);
    if (!ctx) {
        throw new Error('useCartConfirmation must be used within CartConfirmationProvider');
    }
    return ctx;
}
