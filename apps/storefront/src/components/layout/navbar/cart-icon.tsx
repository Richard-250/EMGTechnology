'use client';

import {ShoppingCart} from "lucide-react";
import {Button} from "@/components/ui/button";
import { Link } from '@/i18n/navigation';
import {useTranslations} from 'next-intl';


interface CartIconProps {
    cartItemCount: number;
}

export function CartIcon({cartItemCount}: CartIconProps) {
    const t = useTranslations('Navigation');
    return (
        <Button
            render={<Link href="/cart" />}
            nativeButton={false}
            variant="ghost"
            size="icon"
            className="relative text-foreground"
        >
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-electric text-electric-foreground text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {cartItemCount}
            </span>
            <span className="sr-only">{t('shoppingCart')}</span>
        </Button>
    );
}
