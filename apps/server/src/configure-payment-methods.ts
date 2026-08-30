import {
    LanguageCode,
    Logger,
    PaymentMethodService,
    RequestContextService,
} from '@vendure/core';
import type { bootstrap } from '@vendure/core';

const loggerCtx = 'ConfigurePayments';

const DUMMY_HANDLER = {
    code: 'dummy-payment-handler',
    arguments: [{ name: 'automaticSettle', value: 'true' }],
};

export const EMG_PAYMENT_METHODS = [
    {
        code: 'card',
        name: 'Card',
        description: 'Pay with Visa, Mastercard or debit card',
    },
    {
        code: 'mtn-rwanda',
        name: 'MTN Rwanda',
        description: 'Pay with MTN Mobile Money (Rwanda)',
    },
    {
        code: 'airtel-rwanda',
        name: 'Airtel Rwanda',
        description: 'Pay with Airtel Money (Rwanda)',
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
                handler: DUMMY_HANDLER,
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

    // Disable legacy / duplicate payment methods (e.g. repeated seed runs)
    for (const method of existing) {
        if (!targetIds.includes(String(method.id)) && method.enabled) {
            await paymentMethodService.update(ctx, { id: method.id, enabled: false });
            Logger.info(`Disabled legacy payment method: ${method.code}`, loggerCtx);
        }
    }

    // New payment methods are assigned to the active channel on create.
    // Legacy duplicates are disabled above so only Card / MTN / Airtel remain eligible.
    Logger.info(`Payment methods ready: ${EMG_PAYMENT_METHODS.map(m => m.name).join(', ')}`, loggerCtx);
}
