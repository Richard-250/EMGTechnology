import {Injectable, OnModuleInit} from '@nestjs/common';
import {
    EventBus,
    Logger,
    Product,
    ProductVariant,
    ProductVariantEvent,
    ProductVariantService,
    RequestContext,
    TransactionalConnection,
} from '@vendure/core';

import {generateProductSku, shouldAutoGenerateSku} from './generate-sku';

@Injectable()
export class EmgSkuService implements OnModuleInit {
    private readonly logger = new Logger();

    constructor(
        private readonly eventBus: EventBus,
        private readonly connection: TransactionalConnection,
        private readonly productVariantService: ProductVariantService,
    ) {}

    onModuleInit() {
        this.eventBus.ofType(ProductVariantEvent).subscribe(event => {
            if (event.type === 'created') {
                void this.assignSkusOnCreate(event.ctx, event.entity);
            }
        });
    }

    private async assignSkusOnCreate(ctx: RequestContext, variants: ProductVariant[]) {
        for (const variant of variants) {
            // Never overwrite a real existing SKU
            if (!shouldAutoGenerateSku(variant.sku)) {
                continue;
            }

            try {
                const sku = await this.buildUniqueSkuForVariant(ctx, variant.id);
                if (!sku) {
                    continue;
                }

                await this.productVariantService.update(ctx, [{id: variant.id, sku}]);
                this.logger.debug(`Auto-generated SKU "${sku}" for variant ${variant.id}`, 'EmgSkuService');
            } catch (err) {
                this.logger.error(
                    `Failed to auto-generate SKU for variant ${variant.id}: ${err instanceof Error ? err.message : String(err)}`,
                    'EmgSkuService',
                );
            }
        }
    }

    async buildUniqueSkuForVariant(ctx: RequestContext, variantId: string | number): Promise<string | null> {
        const variant = await this.connection.getRepository(ctx, ProductVariant).findOne({
            where: {id: variantId as never},
            relations: ['product', 'product.translations', 'options', 'translations'],
        });

        if (!variant) {
            return null;
        }

        const product = variant.product as Product | undefined;
        const productTranslation = product?.translations?.[0];
        const variantTranslation = variant.translations?.[0];

        const baseSku = generateProductSku({
            productName: productTranslation?.name ?? product?.name,
            productSlug: productTranslation?.slug,
            variantName: variantTranslation?.name ?? variant.name,
            optionCodes: variant.options?.map(option => option.code),
            variantId: variant.id,
        });

        return this.ensureUniqueSku(ctx, baseSku, String(variant.id));
    }

    /** Kept for dashboard compatibility */
    async buildSkuForVariant(ctx: RequestContext, variantId: string | number): Promise<string | null> {
        return this.buildUniqueSkuForVariant(ctx, variantId);
    }

    private async ensureUniqueSku(
        ctx: RequestContext,
        baseSku: string,
        excludeVariantId: string,
    ): Promise<string> {
        let candidate = baseSku;
        let attempt = 2;

        while (await this.skuTakenByOtherVariant(ctx, candidate, excludeVariantId)) {
            candidate = `${baseSku}-${attempt}`;
            attempt += 1;
            if (attempt > 200) {
                candidate = `${baseSku}-${Date.now().toString(36).toUpperCase()}`;
                break;
            }
        }

        return candidate;
    }

    private async skuTakenByOtherVariant(
        ctx: RequestContext,
        sku: string,
        excludeVariantId: string,
    ): Promise<boolean> {
        const existing = await this.connection
            .getRepository(ctx, ProductVariant)
            .createQueryBuilder('variant')
            .select(['variant.id', 'variant.sku'])
            .where('variant.sku = :sku', {sku})
            .andWhere('variant.id != :excludeVariantId', {excludeVariantId})
            .andWhere('variant.deletedAt IS NULL')
            .getOne();
        return Boolean(existing);
    }
}
