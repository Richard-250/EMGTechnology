import {
    EntityHydrator,
    OrderStateTransitionEvent,
} from '@vendure/core';
import {
    EmailEventListener,
    shippingLinesWithMethod,
    transformOrderLineAssetUrls,
} from '@vendure/email-plugin';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { buildOrderInvoicePdf } from './invoice-pdf';

/**
 * Customer order confirmation when admin settles payment (PaymentSettled).
 * Attaches a branded PDF invoice with line items and totals.
 *
 * PDF is written to a temp file and attached by path so the job queue
 * does not serialize a large Buffer.
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
        const invoicePath = path.join(
            os.tmpdir(),
            `emg-invoice-${event.order.code}-${Date.now()}.pdf`,
        );
        fs.writeFileSync(invoicePath, invoicePdf);

        return { shippingLines, invoicePath };
    })
    .setRecipient(event => event.order.customer!.emailAddress)
    .setFrom('{{ fromAddress }}')
    .setSubject('Payment confirmed — Invoice for order #{{ order.code }}')
    .setTemplateVars(event => ({
        order: event.order,
        shippingLines: event.data.shippingLines,
        storefrontUrl: process.env.STOREFRONT_URL || 'https://emgtechnologyltd.com',
    }))
    .setAttachments(async event => [
        {
            filename: `EMG-Invoice-${event.order.code}.pdf`,
            path: event.data.invoicePath,
            contentType: 'application/pdf',
        },
    ]);
