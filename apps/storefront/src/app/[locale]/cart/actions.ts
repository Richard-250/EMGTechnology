'use server';

import {mutate} from '@/lib/vendure/api';
import {
    RemoveFromCartMutation,
    AdjustCartItemMutation,
    ApplyPromotionCodeMutation,
    RemovePromotionCodeMutation
} from '@/lib/vendure/mutations';
import {getActiveCurrencyCode} from '@/lib/currency-server';
import {updateTag} from 'next/cache';

export async function clearCart(lineIds: string[]) {
    for (const lineId of lineIds) {
        await removeFromCart(lineId);
    }
}

export async function removeFromCart(lineId: string) {
    const currencyCode = await getActiveCurrencyCode();
    await mutate(RemoveFromCartMutation, {lineId}, {useAuthToken: true, currencyCode});
    updateTag('cart');
}

export async function adjustQuantity(lineId: string, quantity: number) {
    const currencyCode = await getActiveCurrencyCode();
    await mutate(AdjustCartItemMutation, {lineId, quantity}, {useAuthToken: true, currencyCode});
    updateTag('cart');
}

export async function updateCartLines(updates: Array<{lineId: string; quantity: number}>) {
    for (const {lineId, quantity} of updates) {
        await adjustQuantity(lineId, Math.max(1, quantity));
    }
}

export async function applyPromotionCode(formData: FormData) {
    const code = formData.get('code') as string;
    if (!code) return;

    const currencyCode = await getActiveCurrencyCode();
    await mutate(ApplyPromotionCodeMutation, {couponCode: code}, {useAuthToken: true, currencyCode});
    updateTag('cart');
}

export async function removePromotionCode(formData: FormData) {
    const code = formData.get('code') as string;
    if (!code) return;

    const currencyCode = await getActiveCurrencyCode();
    await mutate(RemovePromotionCodeMutation, {couponCode: code}, {useAuthToken: true, currencyCode});
    updateTag('cart');
}
