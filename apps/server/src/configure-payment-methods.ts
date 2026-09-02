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
                'Dial the USSD code shown above\nEnter the exact order amount in RWF\nUse your payment reference as the reason / message\nFill in your account name and transaction ID below, then place your order',
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
                'Dial the USSD code shown above\nEnter the exact order amount in RWF\nUse your payment reference as the reason / message\nFill in your account name and transaction ID below, then place your order',
        },
    },
] as const;

export async function configurePaymentMethods(app: Awaited<ReturnType<typeof bootstrap>>) {
    const requestContextService = app.get(RequestContextService);
    const paymentMethodService = app.get(PaymentMethodService);

    const ctx = await requestContextService.create({ apiType: 'admin' });

    const { items: existing } = await paymentMethodService.findAll(ctx, { take: 100 });
    const targetIds: string[] = [];

    for (const target of EMG_PAYMENT_METHODS) {
        let method = existing.find(m => m.code === target.code);

        if (!method) {
            method = await paymentMethodService.create(ctx, {
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
        } else {
            await paymentMethodService.update(ctx, {
                id: method.id,
                enabled: true,
                handler: target.handler,
                customFields: {
                    ...(method.customFields ?? {}),
                    ...target.customFields,
                },
                translations: [
                    {
                        languageCode: LanguageCode.en,
                        name: target.name,
                        description: target.description,
                    },
                ],
            });
            Logger.info(`Updated payment method: ${target.name} (${target.code})`, loggerCtx);
        }

        targetIds.push(String(method.id));
    }

    for (const method of existing) {
        if (!targetIds.includes(String(method.id)) && method.enabled) {
            await paymentMethodService.update(ctx, { id: method.id, enabled: false });
            Logger.info(`Disabled legacy payment method: ${method.code}`, loggerCtx);
        }
    }

    Logger.info(`Payment methods ready: ${EMG_PAYMENT_METHODS.map(m => m.name).join(', ')}`, loggerCtx);
}
