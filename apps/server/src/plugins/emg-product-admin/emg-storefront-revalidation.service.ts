import {Injectable, OnModuleInit} from '@nestjs/common';
import {
    EventBus,
    Logger,
    ProductEvent,
    ProductService,
    ProductVariant,
    ProductVariantEvent,
    RequestContext,
    TransactionalConnection,
} from '@vendure/core';

@Injectable()
export class EmgStorefrontRevalidationService implements OnModuleInit {
    private readonly logger = new Logger();

    constructor(
        private readonly eventBus: EventBus,
        private readonly productService: ProductService,
        private readonly connection: TransactionalConnection,
    ) {}

    onModuleInit() {
        this.eventBus.ofType(ProductEvent).subscribe(event => {
            if (event.type === 'created' || event.type === 'updated') {
                void this.revalidateForProduct(event.ctx, event.entity.id);
            }
        });

        this.eventBus.ofType(ProductVariantEvent).subscribe(event => {
            if (event.type === 'created' || event.type === 'updated') {
                for (const variant of event.entity) {
                    void this.revalidateForVariant(event.ctx, variant);
                }
            }
        });
    }

    private async revalidateForProduct(ctx: RequestContext, productId: string | number) {
        try {
            const product = await this.productService.findOne(ctx, productId, ['translations']);
            if (!product) {
                return;
            }

            const slug = product.translations?.[0]?.slug;
            const tags = ['products', 'featured', 'deals', 'home-catalog', 'category-products'];
            if (slug) {
                tags.push(`product-${slug}`);
            }

            await this.postRevalidation(tags);
        } catch (err) {
            this.logger.error(
                `Storefront revalidation failed for product ${productId}: ${err instanceof Error ? err.message : String(err)}`,
                'EmgStorefrontRevalidationService',
            );
        }
    }

    private async revalidateForVariant(ctx: RequestContext, variant: ProductVariant) {
        try {
            let productId: string | number | undefined = variant.productId;
            if (productId == null) {
                const loaded = await this.connection.getRepository(ctx, ProductVariant).findOne({
                    where: {id: variant.id},
                    relations: ['product'],
                });
                productId = loaded?.product?.id;
            }

            if (productId != null) {
                await this.revalidateForProduct(ctx, productId);
            } else {
                await this.postRevalidation(['products', 'featured', 'deals', 'home-catalog', 'category-products']);
            }
        } catch (err) {
            this.logger.error(
                `Storefront revalidation failed for variant ${variant.id}: ${err instanceof Error ? err.message : String(err)}`,
                'EmgStorefrontRevalidationService',
            );
        }
    }

    private async postRevalidation(tags: string[]) {
        const storefrontUrl = process.env.STOREFRONT_URL?.replace(/\/$/, '');
        const secret = process.env.REVALIDATION_SECRET;

        if (!storefrontUrl || !secret) {
            this.logger.debug(
                'Skipping storefront revalidation (STOREFRONT_URL or REVALIDATION_SECRET not set)',
                'EmgStorefrontRevalidationService',
            );
            return;
        }

        const uniqueTags = [...new Set(tags)];
        const response = await fetch(`${storefrontUrl}/api/revalidate`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${secret}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({tags: uniqueTags}),
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`Revalidation request failed (${response.status}): ${body}`);
        }

        this.logger.debug(`Revalidated storefront tags: ${uniqueTags.join(', ')}`, 'EmgStorefrontRevalidationService');
    }
}
