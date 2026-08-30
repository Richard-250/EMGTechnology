'use client';

import Image from 'next/image';
import {CheckCircle2, ShoppingBag} from 'lucide-react';
import {Link} from '@/i18n/navigation';
import {Button} from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {Price} from '@/components/commerce/price';
import {useCartConfirmation} from '@/components/commerce/cart-confirmation-provider';
import {resolveProductImage} from '@/lib/product-images';
import {useTranslations} from 'next-intl';

export function CartConfirmationDrawer() {
    const t = useTranslations('Cart');
    const {open, item, cartCount, close} = useCartConfirmation();

    if (!item) return null;

    const imageSrc = resolveProductImage(item.image, item.slug);

    return (
        <Sheet open={open} onOpenChange={next => !next && close()}>
            <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
                <SheetHeader className="border-b border-border px-5 py-4 text-left">
                    <div className="flex items-center gap-2 text-electric">
                        <CheckCircle2 className="size-5" />
                        <SheetTitle className="text-base font-semibold">{t('addedToCart')}</SheetTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {t('itemsInCart', {count: cartCount})}
                    </p>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <div className="flex gap-3 rounded-lg border border-border p-3 bg-muted/20">
                        <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
                            <Image
                                src={imageSrc}
                                alt={item.name}
                                fill
                                className="object-cover"
                                sizes="80px"
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm leading-snug line-clamp-2">{item.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t('quantityLabel', {count: item.quantity})}
                            </p>
                            <p className="text-sm font-semibold text-electric mt-2">
                                <Price value={item.unitPrice * item.quantity} currencyCode={item.currencyCode} />
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border p-5 space-y-2.5">
                    <Button
                        render={<Link href="/cart" onClick={close} />}
                        nativeButton={false}
                        className="w-full bg-electric hover:bg-electric/90 text-electric-foreground font-semibold"
                        size="lg"
                    >
                        <ShoppingBag className="size-4 mr-2" />
                        {t('viewCart')}
                    </Button>
                    <Button variant="outline" className="w-full" size="lg" onClick={close}>
                        {t('continueShopping')}
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}
