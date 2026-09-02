import {Logger, ProductService, RequestContextService} from '@vendure/core';
import type {bootstrap} from '@vendure/core';

const loggerCtx = 'ConfigureSuperDeals';

/** Default Super Deals shown on the homepage when admin has not configured discounts yet. */
export const DEFAULT_SUPER_DEALS = [
    {slug: 'emg-pro-elliptical', discountPercentage: 15},
    {slug: 'emg-upright-bike-s2', discountPercentage: 12},
    {slug: 'emg-rowing-machine-r1', discountPercentage: 10},
    {slug: 'emg-power-rack-pro', discountPercentage: 20},
    {slug: 'emg-adjustable-dumbbells-40kg', discountPercentage: 18},
    {slug: 'emg-functional-trainer', discountPercentage: 15},
    {slug: 'emg-resistance-band-pack', discountPercentage: 25},
] as const;

export async function configureSuperDeals(app: Awaited<ReturnType<typeof bootstrap>>) {
    const requestContextService = app.get(RequestContextService);
    const productService = app.get(ProductService);
    const ctx = await requestContextService.create({apiType: 'admin'});

    const {items: products} = await productService.findAll(ctx, {take: 200});
    let configured = 0;

    for (const deal of DEFAULT_SUPER_DEALS) {
        const product = products.find(p => p.slug === deal.slug);
        if (!product) {
            continue;
        }

        const cf = (product.customFields ?? {}) as {
            isDiscounted?: boolean;
            discountPercentage?: number | null;
        };

        if (cf.isDiscounted === true && cf.discountPercentage && cf.discountPercentage > 0) {
            continue;
        }

        await productService.update(ctx, {
            id: product.id,
            customFields: {
                isDiscounted: true,
                discountType: 'percentage',
                discountPercentage: deal.discountPercentage,
            },
        });

        configured++;
        Logger.info(
            `Super Deal enabled: ${product.name} (${deal.slug}) — ${deal.discountPercentage}% off`,
            loggerCtx,
        );
    }

    if (configured > 0) {
        Logger.info(`Super Deals ready: ${configured} product(s) featured on homepage`, loggerCtx);
    } else {
        Logger.info('Super Deals unchanged (products already configured or not found)', loggerCtx);
    }
}
