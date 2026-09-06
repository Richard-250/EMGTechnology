import {
    EntityHydrator,
    Logger,
    OrderStateTransitionEvent,
} from '@vendure/core';
import {EmailEventListener} from '@vendure/email-plugin';
import {OrderNotifyService} from '../emg-product-admin/order-notify.service';

const loggerCtx = 'AdminOrderNotify';

function extractPaymentProof(order: {
    payments?: Array<{method?: string; amount?: number; state?: string; metadata?: any}> | null;
}) {
    const payment =
        order.payments?.find(p => p.state === 'Authorized' || p.state === 'Settled') ||
        order.payments?.[order.payments.length - 1];
    const meta = (payment?.metadata ?? {}) as Record<string, unknown>;
    return {
        method: payment?.method || '',
        state: payment?.state || '',
        amount: payment?.amount ?? 0,
        payerAccountName: String(meta.payerAccountName || ''),
        mobileMoneyPhone: String(meta.mobileMoneyPhone || ''),
        mobileMoneyProvider: String(meta.mobileMoneyProvider || ''),
        transactionId: String(meta.transactionId || ''),
        paymentReference: String(meta.paymentReference || ''),
        paymentNote: String(meta.paymentNote || ''),
        deliveryDate: String(meta.deliveryDate || ''),
        deliveryMethodName: String(meta.deliveryMethodName || ''),
    };
}

/**
 * When a customer places an order with payment proof (PaymentAuthorized),
 * notify configured staff with order + proof details.
 * Customer confirmation email is sent separately on PaymentSettled.
 */
export const adminOrderNotificationHandler = new EmailEventListener('admin-order-notification')
    .on(OrderStateTransitionEvent)
    .filter(
        event =>
            (event.toState as string) === 'PaymentAuthorized' &&
            (event.fromState as string) !== 'Modifying' &&
            (event.fromState as string) !== 'ArrangingAdditionalPayment',
    )
    .loadData(async ({event, injector}) => {
        const entityHydrator = injector.get(EntityHydrator);
        await entityHydrator.hydrate(event.ctx, event.order, {
            relations: [
                'lines.productVariant',
                'shippingLines.shippingMethod',
                'customer',
                'payments',
            ],
        });

        const notifyService = injector.get(OrderNotifyService);
        const staffEmails = await notifyService.resolveStaffEmails(event.ctx);
        const paymentProof = extractPaymentProof(event.order);

        if (!staffEmails.length) {
            // Abort send (EmailPlugin catches and skips). Mode "none".
            throw new Error(
                `Order #${event.order.code}: staff order emails disabled (notify mode=none)`,
            );
        }

        Logger.info(
            `Order #${event.order.code}: notifying ${staffEmails.length} staff of payment proof`,
            loggerCtx,
        );

        return {staffEmails, paymentProof};
    })
    .setRecipient(event => event.data.staffEmails[0])
    .setOptionalAddressFields(async event => {
        const rest = event.data.staffEmails.slice(1);
        return rest.length ? {bcc: rest.join(',')} : {};
    })
    .setFrom('{{ fromAddress }}')
    .setSubject('New order #{{ order.code }} — payment proof awaiting confirmation')
    .setTemplateVars(event => ({
        order: event.order,
        shippingLines: event.order.shippingLines,
        paymentProof: event.data.paymentProof,
        dashboardUrl: process.env.STOREFRONT_URL
            ? `${process.env.STOREFRONT_URL.replace(/\/$/, '')}/dashboard/orders`
            : 'https://emgtechnologyltd.com/dashboard/orders',
    }));
