import {
    EntityHydrator,
    Logger,
    OrderStateTransitionEvent,
} from '@vendure/core';
import {
    EmailEventListener,
    shippingLinesWithMethod,
    transformOrderLineAssetUrls,
} from '@vendure/email-plugin';
import { buildOrderInvoicePdf } from './invoice-pdf';

const loggerCtx = 'OrderConfirmationEmail';

/**
 * Customer order confirmation when admin settles payment (PaymentSettled).
 * Attaches a branded PDF invoice with line items and totals.
 *
 * Uses Buffer content (not a temp file path) so worker processes always
 * receive the attachment even when jobs run on a different host/process.
 */
export const orderConfirmationHandler = new EmailEventListener('order-confirmation')
    .on(OrderStateTransitionEvent)
    .filter(
        event =>
            event.toState === 'PaymentSettled' &&
            event.fromState !== 'Modifying' &&
            !!event.order.customer,
    )
    .loadData(async ({ event, injector }) => {
        const entityHydrator = injector.get(EntityHydrator);
        await entityHydrator.hydrate(event.ctx, event.order, {
            relations: [
                'lines.featuredAsset',
                'lines.productVariant',
                'shippingLines.shippingMethod',
                'customer',
                'payments',
            ],
        });
        transformOrderLineAssetUrls(event.ctx, event.order, injector);
        const shippingLines = shippingLinesWithMethod(event.order);

        const invoicePdf = await buildOrderInvoicePdf(event.order);
        Logger.info(
            `Built invoice PDF for order #${event.order.code} (${invoicePdf.length} bytes)`,
            loggerCtx,
        );

        return {
            shippingLines,
            invoicePdf: invoicePdf.toString('base64'),
        };
    })
    .setRecipient(event => event.order.customer!.emailAddress)
    .setFrom('{{ fromAddress }}')
    .setSubject('Payment confirmed — your EMG order #{{ order.code }} is received')
    .setTemplateVars(event => ({
        order: event.order,
        shippingLines: event.data.shippingLines,
        storefrontUrl: process.env.STOREFRONT_URL || 'https://emgtechnologyltd.com',
    }))
    .setAttachments(async event => [
        {
            filename: `EMG-Invoice-${event.order.code}.pdf`,
            content: Buffer.from(event.data.invoicePdf, 'base64'),
            contentType: 'application/pdf',
        },
    ]);
