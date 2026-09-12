'use server';

import {mutate, query} from '@/lib/vendure/api';
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
import {
    GetActiveOrderForCheckoutQuery,
    GetEligibleShippingMethodsQuery,
} from '@/lib/vendure/queries';
import {getActiveCustomer} from '@/lib/vendure/actions';
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
        const detail = errorResult.transitionError || errorResult.message;
        throw new Error(
            `Failed to transition order state: ${errorResult.errorCode} - ${detail}`
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
    // 1. Fetch current active order to check its real state
    let activeOrder;
    try {
        const orderResult = await query(
            GetActiveOrderForCheckoutQuery,
            {},
            { useAuthToken: true }
        );
        activeOrder = orderResult.data.activeOrder;
    } catch (error) {
        console.error('Failed to get active order for checkout:', error);
    }

    if (!activeOrder) {
        return {
            success: false,
            message: 'No active cart found. Please refresh the page and try again.',
        };
    }

    // 2. If already placed/settled, return existing order code
    if (activeOrder.state === 'PaymentSettled' || activeOrder.state === 'PaymentAuthorized') {
        updateTag('cart');
        updateTag('active-order');
        return { success: true, orderCode: activeOrder.code };
    }

    // 3. Ensure the order is in "ArrangingPayment" state before adding payment
    if (activeOrder.state !== 'ArrangingPayment') {
        // Ensure customer is attached to the order if missing
        if (!activeOrder.customer?.emailAddress) {
            try {
                const customer = await getActiveCustomer();
                if (customer?.emailAddress) {
                    await mutate(
                        SetCustomerForOrderMutation,
                        {
                            input: {
                                emailAddress: customer.emailAddress,
                                firstName: customer.firstName || 'Customer',
                                lastName: customer.lastName || '',
                                phoneNumber: customer.phoneNumber || undefined,
                            },
                        },
                        { useAuthToken: true }
                    );
                }
            } catch (custErr) {
                console.error('Failed to attach customer before payment transition:', custErr);
            }
        }

        // Ensure shipping method is set if missing
        if (!activeOrder.shippingLines || activeOrder.shippingLines.length === 0) {
            try {
                const shippingResult = await query(
                    GetEligibleShippingMethodsQuery,
                    {},
                    { useAuthToken: true }
                );
                const eligible = shippingResult.data.eligibleShippingMethods ?? [];
                if (eligible.length > 0) {
                    const matched = paymentDetails?.deliveryMethodName
                        ? eligible.find(
                              m =>
                                  m.name.toLowerCase() ===
                                  paymentDetails.deliveryMethodName?.toLowerCase()
                          )
                        : undefined;
                    const methodId = (matched || eligible[0]).id;
                    await mutate(
                        SetOrderShippingMethodMutation,
                        { shippingMethodId: [methodId] },
                        { useAuthToken: true }
                    );
                } else {
                    return {
                        success: false,
                        message:
                            'No eligible shipping method found. Please confirm your delivery address before placing your order.',
                    };
                }
            } catch (shipErr) {
                console.error('Failed to set shipping method before payment transition:', shipErr);
            }
        }

        // Transition from AddingItems to ArrangingPayment
        let transitionResult;
        try {
            transitionResult = await mutate(
                TransitionOrderToStateMutation,
                { state: 'ArrangingPayment' },
                { useAuthToken: true }
            );
        } catch (transErr) {
            const message = transErr instanceof Error ? transErr.message : String(transErr);
            return {
                success: false,
                message: `Could not proceed to payment: ${message}`,
            };
        }

        const transitionData = transitionResult.data.transitionOrderToState;
        if (transitionData?.__typename === 'OrderStateTransitionError') {
            const errorMsg =
                transitionData.transitionError ||
                transitionData.message ||
                `Cannot transition order from "${transitionData.fromState}" to "${transitionData.toState}"`;
            return {
                success: false,
                message: `Could not proceed to payment: ${errorMsg}`,
            };
        }

        if (transitionData?.__typename !== 'Order' || transitionData.state !== 'ArrangingPayment') {
            return {
                success: false,
                message:
                    'Failed to prepare order for payment. Please refresh the page and try again.',
            };
        }
    }

    // 4. Order is now guaranteed to be in ArrangingPayment state — add payment
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
