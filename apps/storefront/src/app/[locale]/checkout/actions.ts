'use server';

import {mutate} from '@/lib/vendure/api';
import {
    SetOrderShippingAddressMutation,
    SetOrderBillingAddressMutation,
    SetOrderShippingMethodMutation,
    SetOrderCustomFieldsMutation,
    AddPaymentToOrderMutation,
    CreateCustomerAddressMutation,
    TransitionOrderToStateMutation,
    SetCustomerForOrderMutation,
    UpdateCustomerMutation,
} from '@/lib/vendure/mutations';
import {revalidatePath, updateTag} from 'next/cache';
import {redirect} from '@/i18n/navigation';
import {getLocale} from 'next-intl/server';
import type {PaymentDetailsMetadata} from './payment-details';

interface AddressInput {
    fullName: string;
    streetLine1: string;
    streetLine2?: string;
    city: string;
    province: string;
    postalCode?: string;
    countryCode: string;
    phoneNumber: string;
    company?: string;
}

export async function setShippingAddress(
    shippingAddress: AddressInput,
    useSameForBilling: boolean
) {
    const shippingResult = await mutate(
        SetOrderShippingAddressMutation,
        {input: shippingAddress},
        {useAuthToken: true}
    );

    if (shippingResult.data.setOrderShippingAddress.__typename !== 'Order') {
        throw new Error('Failed to set shipping address');
    }

    if (useSameForBilling) {
        await mutate(
            SetOrderBillingAddressMutation,
            {input: shippingAddress},
            {useAuthToken: true}
        );
    }

    const locale = await getLocale();
    revalidatePath(`/${locale}/checkout`);
}

export async function setShippingMethod(shippingMethodId: string) {
    const result = await mutate(
        SetOrderShippingMethodMutation,
        {shippingMethodId: [shippingMethodId]},
        {useAuthToken: true}
    );

    if (result.data.setOrderShippingMethod.__typename !== 'Order') {
        throw new Error('Failed to set shipping method');
    }

    const locale = await getLocale();
    revalidatePath(`/${locale}/checkout`);
}

export async function createCustomerAddress(address: AddressInput) {
    const result = await mutate(
        CreateCustomerAddressMutation,
        {input: address},
        {useAuthToken: true}
    );

    if (!result.data.createCustomerAddress) {
        throw new Error('Failed to create customer address');
    }

    const locale = await getLocale();
    revalidatePath(`/${locale}/checkout`);
    return result.data.createCustomerAddress;
}

export async function setOrderDeliveryDate(deliveryDate: string) {
    const result = await mutate(
        SetOrderCustomFieldsMutation,
        {input: {customFields: {deliveryDate}}},
        {useAuthToken: true},
    );

    if (result.data.setOrderCustomFields.__typename !== 'Order') {
        throw new Error('Failed to save delivery date');
    }

    const locale = await getLocale();
    revalidatePath(`/${locale}/checkout`);
}

export async function transitionToArrangingPayment() {
    const result = await mutate(
        TransitionOrderToStateMutation,
        {state: 'ArrangingPayment'},
        {useAuthToken: true}
    );

    if (result.data.transitionOrderToState?.__typename === 'OrderStateTransitionError') {
        const errorResult = result.data.transitionOrderToState;
        throw new Error(
            `Failed to transition order state: ${errorResult.errorCode} - ${errorResult.message}`
        );
    }

    const locale = await getLocale();
    revalidatePath(`/${locale}/checkout`);
}

export type PlaceOrderResult =
    | { success: true; orderCode: string }
    | { success: false; message: string };

export async function placeOrder(
    paymentMethodCode: string,
    paymentDetails?: PaymentDetailsMetadata,
): Promise<PlaceOrderResult> {
    // Reuse the same active order — never create a second order when navigating checkout steps.
    // Only transition when not already arranging payment (avoids duplicate transition errors).
    try {
        await transitionToArrangingPayment();
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        // Safe to continue if already in ArrangingPayment (e.g. retry after a failed payment add)
        if (!/already|ArrangingPayment|fromState/i.test(message)) {
            return { success: false, message: `Could not proceed to payment: ${message}` };
        }
    }

    const metadata: Record<string, unknown> = {
        shouldDecline: false,
        shouldError: false,
        shouldErrorOnSettle: false,
        // MoMo/Airtel use manual settle — Place Order must NOT mark payment as paid
        paymentStatusHint: 'awaiting_confirmation',
        ...paymentDetails,
    };

    let result;
    try {
        result = await mutate(
            AddPaymentToOrderMutation,
            {
                input: {
                    method: paymentMethodCode,
                    metadata,
                },
            },
            {useAuthToken: true}
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, message: `Payment request failed: ${message}` };
    }

    if (result.data.addPaymentToOrder.__typename !== 'Order') {
        const errorResult = result.data.addPaymentToOrder;
        const msg = `${errorResult.errorCode} - ${errorResult.message}`;
        return { success: false, message: `Failed to place order: ${msg}` };
    }

    const orderCode = result.data.addPaymentToOrder.code;

    updateTag('cart');
    updateTag('active-order');

    return { success: true, orderCode };
}

interface GuestCustomerInput {
    emailAddress: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
}

export type SetCustomerForOrderResult =
    | { success: true }
    | { success: false; errorCode: 'EMAIL_CONFLICT'; message: string }
    | { success: false; errorCode: 'GUEST_CHECKOUT_DISABLED'; message: string }
    | { success: false; errorCode: 'NO_ACTIVE_ORDER'; message: string }
    | { success: false; errorCode: 'UNKNOWN'; message: string };

export async function setCustomerForOrder(
    input: GuestCustomerInput
): Promise<SetCustomerForOrderResult> {
    const result = await mutate(
        SetCustomerForOrderMutation,
        { input },
        { useAuthToken: true }
    );

    const response = result.data.setCustomerForOrder;

    switch (response.__typename) {
        case 'Order': {
            const locale = await getLocale();
            revalidatePath(`/${locale}/checkout`);
            return { success: true };
        }
        case 'AlreadyLoggedInError':
            return { success: true };
        case 'EmailAddressConflictError':
            return { success: false, errorCode: 'EMAIL_CONFLICT', message: response.message };
        case 'GuestCheckoutError':
            return { success: false, errorCode: 'GUEST_CHECKOUT_DISABLED', message: response.message };
        case 'NoActiveOrderError':
            return { success: false, errorCode: 'NO_ACTIVE_ORDER', message: response.message };
        default:
            return { success: false, errorCode: 'UNKNOWN', message: 'Unknown error' };
    }
}

export async function updateCheckoutCustomer(input: {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
}): Promise<{ success: true } | { success: false; message: string }> {
    const result = await mutate(
        UpdateCustomerMutation,
        {
            input: {
                firstName: input.firstName,
                lastName: input.lastName,
                ...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {}),
            },
        },
        { useAuthToken: true },
    );

    if (!result.data.updateCustomer?.id) {
        return { success: false, message: 'Failed to update customer details' };
    }

    const locale = await getLocale();
    revalidatePath(`/${locale}/checkout`);
    return { success: true };
}
