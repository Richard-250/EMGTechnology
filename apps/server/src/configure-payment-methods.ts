import {
    LanguageCode,
    Logger,
    PaymentMethodService,
    RequestContextService,
} from '@vendure/core';
import type { bootstrap } from '@vendure/core';

const loggerCtx = 'ConfigurePayments';

const AUTO_SETTLE_HANDLER = {
    code: 'dummy-payment-handler',
    arguments: [{ name: 'automaticSettle', value: 'true' }],
};

const MANUAL_SETTLE_HANDLER = {
    code: 'dummy-payment-handler',
    arguments: [{ name: 'automaticSettle', value: 'false' }],
};

/** Known leftover method codes from older seeds — never disable admin-created methods. */
const LEGACY_PAYMENT_CODES = new Set(['standard-payment', 'dummy-payment-method']);

export const EMG_PAYMENT_METHODS = [
    {
        code: 'card',
        name: 'Card',
        description: 'Pay with Visa, Mastercard or debit card',
        handler: AUTO_SETTLE_HANDLER,
        customFields: {},
    },
    {
        code: 'mtn-rwanda',
        name: 'MTN Mobile Money',
        description: 'Pay with MTN Mobile Money (Rwanda)',
        handler: MANUAL_SETTLE_HANDLER,
        customFields: {
            merchantDisplayName: 'EMG Technology Ltd',
            merchantPhone: '+250796345773',
            merchantMomoCode: '*182*8*1*0796345773#',
            paymentSteps:
                'Dial the USSD code or pay to the merchant number shown\nEnter the exact order total\nUse your payment reference as the reason / message\nReturn here and place your order — payment stays awaiting confirmation until admin verifies',
        },
    },
    {
        code: 'airtel-rwanda',
        name: 'Airtel Money',
        description: 'Pay with Airtel Money (Rwanda)',
        handler: MANUAL_SETTLE_HANDLER,
        customFields: {
            merchantDisplayName: 'EMG Technology Ltd',
            merchantPhone: '+250796345773',
            merchantMomoCode: '*185*1*0796345773#',
            paymentSteps:
                'Dial the USSD code or pay to the merchant number shown\nEnter the exact order total\nUse your payment reference as the reason / message\nReturn here and place your order — payment stays awaiting confirmation until admin verifies',
        },
    },
] as const;

/**
 * Ensures default payment methods exist.
 * Admin configures merchant phone / MoMo code / name / instructions / enabled in the dashboard.
 * Boot must NOT overwrite those custom fields.
 */
export async function configurePaymentMethods(app: Awaited<ReturnType<typeof bootstrap>>) {
    const requestContextService = app.get(RequestContextService);
    const paymentMethodService = app.get(PaymentMethodService);

    const ctx = await requestContextService.create({ apiType: 'admin' });

    const { items: existing } = await paymentMethodService.findAll(ctx, { take: 100 });

    for (const target of EMG_PAYMENT_METHODS) {
        const method = existing.find(m => m.code === target.code);

        if (method) {
            // Preserve admin merchant config, name, description, and enabled flag
            Logger.info(
                `Payment method already present: ${method.code} — merchant settings left unchanged`,
                loggerCtx,
            );
            continue;
        }

        await paymentMethodService.create(ctx, {
            code: target.code,
            enabled: true,
            handler: target.handler,
            customFields: target.customFields,
            translations: [
                {
                    languageCode: LanguageCode.en,
                    name: target.name,
                    description: target.description,
                },
            ],
        });
        Logger.info(`Created payment method: ${target.name} (${target.code})`, loggerCtx);
    }

    for (const method of existing) {
        if (!LEGACY_PAYMENT_CODES.has(method.code) || !method.enabled) {
            continue;
        }
        await paymentMethodService.update(ctx, { id: method.id, enabled: false });
        Logger.info(`Disabled legacy payment method: ${method.code}`, loggerCtx);
    }

    Logger.info(
        'Payment methods ready (admin merchant phone/MoMo/name/instructions are preserved)',
        loggerCtx,
    );
}
