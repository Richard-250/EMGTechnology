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
            if (!shouldAutoGenerateSku(variant.sku)) {
                continue;
            }

            try {
                const sku = await this.buildSkuForVariant(ctx, variant.id);
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

    async buildSkuForVariant(ctx: RequestContext, variantId: string | number): Promise<string | null> {
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

        return generateProductSku({
            productName: productTranslation?.name ?? product?.name,
            productSlug: productTranslation?.slug,
            variantName: variantTranslation?.name ?? variant.name,
            optionCodes: variant.options?.map(option => option.code),
            variantId: variant.id,
        });
    }
}
