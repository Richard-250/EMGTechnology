'use server';

import {setCurrencyCookie} from '@/lib/currency';
import {getActiveChannelCached} from '@/lib/vendure/cached';
import {revalidatePath, updateTag} from 'next/cache';

export async function switchCurrency(currencyCode: string) {
    const channel = await getActiveChannelCached();
    if (!(channel.availableCurrencyCodes as string[]).includes(currencyCode)) {
        throw new Error('Invalid currency code');
    }

    await setCurrencyCookie(currencyCode);

    updateTag('products');
    updateTag('collection');
    updateTag('cart');
    updateTag('active-order');
    updateTag('featured');
    updateTag('home-catalog');

    revalidatePath('/', 'layout');
}
