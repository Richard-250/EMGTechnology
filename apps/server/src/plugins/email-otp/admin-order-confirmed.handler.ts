import {
    EntityHydrator,
    Logger,
    OrderStateTransitionEvent,
} from '@vendure/core';
import {EmailEventListener} from '@vendure/email-plugin';
import {OrderNotifyService} from '../emg-product-admin/order-notify.service';

const loggerCtx = 'AdminOrderConfirmed';

function extractPaymentProof(order: {
    payments?: Array<{method?: string; amount?: number; state?: string; metadata?: any}> | null;
}) {
    const payment =
        order.payments?.find(p => p.state === 'Settled' || p.state === 'Authorized') ||
        order.payments?.[order.payments.length - 1];
    const meta = (payment?.metadata ?? {}) as Record<string, unknown>;
    return {
        method: payment?.method || '',
        state: payment?.state || '',
        amount: payment?.amount ?? 0,
        paymentReference: String(meta.paymentReference || ''),
        paymentProofUrl: String(meta.paymentProofUrl || ''),
        mobileMoneyProvider: String(meta.mobileMoneyProvider || ''),
        confirmedByName: String(
            (order as {customFields?: {paymentConfirmedByName?: string}}).customFields
                ?.paymentConfirmedByName || '',
        ),
    };
}

/**
 * When staff confirms MoMo/Airtel payment (PaymentSettled), notify administrators
 * that the order is confirmed. Customer receives a separate confirmation email.
 */
export const adminOrderConfirmedHandler = new EmailEventListener('admin-order-confirmed')
    .on(OrderStateTransitionEvent)
    .filter(
        event =>
            (event.toState as string) === 'PaymentSettled' &&
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
        const confirmedByName = String(
            (event.order.customFields as {paymentConfirmedByName?: string} | undefined)
                ?.paymentConfirmedByName || '',
        );
        paymentProof.confirmedByName = confirmedByName;

        if (!staffEmails.length) {
            throw new Error(
                `Order #${event.order.code}: staff order emails disabled (notify mode=none)`,
            );
        }

        Logger.info(
            `Order #${event.order.code}: notifying ${staffEmails.length} staff of confirmed payment`,
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
    .setSubject('Order #{{ order.code }} confirmed — payment verified')
    .setTemplateVars(event => ({
        order: event.order,
        shippingLines: event.order.shippingLines,
        paymentProof: event.data.paymentProof,
        dashboardUrl: (() => {
            const base =
                process.env.ADMIN_UI_HOST ||
                process.env.VENDURE_HOST ||
                process.env.STOREFRONT_URL ||
                'https://emgtechnologyltd.com';
            return `${base.replace(/\/$/, '')}/dashboard/orders`;
        })(),
    }));
