'use client';

import {createContext, useContext, useState} from 'react';
import {RWANDA_VAT_RATE} from '@/lib/vat';

interface CartVatContextValue {
    includeVat: boolean;
    toggleVat: () => void;
    vatRate: number;
}

const CartVatContext = createContext<CartVatContextValue | null>(null);

export function CartVatProvider({children}: {children: React.ReactNode}) {
    const [includeVat, setIncludeVat] = useState(true);

    return (
        <CartVatContext.Provider
            value={{
                includeVat,
                toggleVat: () => setIncludeVat(v => !v),
                vatRate: RWANDA_VAT_RATE,
            }}
        >
            {children}
        </CartVatContext.Provider>
    );
}

export function useCartVat() {
    const ctx = useContext(CartVatContext);
    if (!ctx) {
        throw new Error('useCartVat must be used within CartVatProvider');
    }
    return ctx;
}
