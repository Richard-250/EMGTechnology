import {
    LanguageCode,
    Logger,
    RequestContextService,
    ShippingMethodService,
} from '@vendure/core';
import type { bootstrap } from '@vendure/core';

const loggerCtx = 'ConfigureShipping';

const DEFAULT_CHECKER = {
    code: 'default-shipping-eligibility-checker',
    arguments: [{ name: 'orderMinimum', value: '0' }],
};

const FULFILLMENT_HANDLER = 'manual-fulfillment';

export const EMG_SHIPPING_METHODS = [
    {
        code: 'kigali-moto-taxi',
        name: 'Kigali - Moto-taxi',
        description: 'Negotiable fare with moto-taxi riders',
        price: 0,
    },
    {
        code: 'pickup-at-store',
        name: 'Pickup at Store',
        description: 'EMG Technology Store — Kigali City Tower (KCT), Ground Floor, KN 2 St, Nyarugenge, Kigali',
        price: 0,
    },
    {
        code: 'express-2-hour-kigali',
        name: 'Express 2-Hour - Kigali',
        description: 'Kigali',
        price: 350000, // RWF 3,500 in minor units (3500 * 100)
    },
] as const;

export async function configureShippingMethods(app: Awaited<ReturnType<typeof bootstrap>>) {
    const requestContextService = app.get(RequestContextService);
    const shippingMethodService = app.get(ShippingMethodService);

    const ctx = await requestContextService.create({ apiType: 'admin' });

    const { items: existing } = await shippingMethodService.findAll(ctx, { take: 100 });
    const targetIds: string[] = [];

    for (const target of EMG_SHIPPING_METHODS) {
        let method = existing.find(m => m.code === target.code || m.name === target.name);

        const calculator = {
            code: 'default-shipping-calculator',
            arguments: [
                { name: 'rate', value: String(target.price) },
                { name: 'includesTax', value: 'auto' },
                { name: 'taxRate', value: '0' },
            ],
        };

        if (!method) {
            method = await shippingMethodService.create(ctx, {
                code: target.code,
                fulfillmentHandler: FULFILLMENT_HANDLER,
                checker: DEFAULT_CHECKER,
                calculator,
                translations: [
                    {
                        languageCode: LanguageCode.en,
                        name: target.name,
                        description: target.description,
                    },
                ],
            });
            Logger.info(`Created shipping method: ${target.name} (${target.code}) — Price: ${target.price / 100} RWF`, loggerCtx);
        } else {
            await shippingMethodService.update(ctx, {
                id: method.id,
                code: target.code,
                fulfillmentHandler: FULFILLMENT_HANDLER,
                checker: DEFAULT_CHECKER,
                calculator,
                translations: [
                    {
                        languageCode: LanguageCode.en,
                        name: target.name,
                        description: target.description,
                    },
                ],
            });
            Logger.info(`Updated shipping method: ${target.name} (${target.code}) — Price: ${target.price / 100} RWF`, loggerCtx);
        }

        targetIds.push(String(method.id));
    }

    // Soft-delete legacy / duplicate shipping methods (e.g. repeated seed runs of 'Standard Shipping')
    for (const method of existing) {
        if (!targetIds.includes(String(method.id))) {
            try {
                await shippingMethodService.softDelete(ctx, method.id);
                Logger.info(`Soft-deleted legacy shipping method: ${method.name} (${method.code}, id=${method.id})`, loggerCtx);
            } catch (err: any) {
                Logger.warn(`Could not soft-delete legacy shipping method ${method.name}: ${err?.message}`, loggerCtx);
            }
        }
    }

    Logger.info(`Shipping methods ready: ${EMG_SHIPPING_METHODS.map(m => m.name).join(', ')}`, loggerCtx);
}
