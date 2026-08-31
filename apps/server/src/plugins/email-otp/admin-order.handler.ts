import { EmailEventListener } from '@vendure/email-plugin';
import { OrderStateTransitionEvent } from '@vendure/core';

/**
 * Sends an email notification to the store administrator whenever a customer places an order.
 */
export const adminOrderNotificationHandler = new EmailEventListener('admin-order-notification')
    .on(OrderStateTransitionEvent)
    .filter(event =>
        event.toState === 'PaymentSettled' ||
        event.toState === 'PaymentAuthorized' ||
        (event.fromState === 'ArrangingPayment' && event.toState === 'PaymentSettled')
    )
    .setRecipient(event => process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'info@emgtechnologyltd.com')
    .setFrom('{{ fromAddress }}')
    .setSubject('🔔 New Customer Order #{{ order.code }} - EMG Technology Ltd')
    .setTemplateVars(event => ({
        order: event.order,
        shippingLines: event.order.shippingLines,
    }));
