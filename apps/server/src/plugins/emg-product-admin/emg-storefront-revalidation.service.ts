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
    private pendingTags = new Set<string>();
    private flushTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private readonly eventBus: EventBus,
        private readonly productService: ProductService,
        private readonly connection: TransactionalConnection,
    ) {}

    onModuleInit() {
        this.eventBus.ofType(ProductEvent).subscribe(event => {
            if (event.type === 'created' || event.type === 'updated' || event.type === 'deleted') {
                void this.revalidateForProduct(event.ctx, event.entity.id, event.type === 'deleted');
            }
        });

        this.eventBus.ofType(ProductVariantEvent).subscribe(event => {
            if (event.type === 'created' || event.type === 'updated' || event.type === 'deleted') {
                for (const variant of event.entity) {
                    void this.revalidateForVariant(event.ctx, variant);
                }
            }
        });
    }

    private async revalidateForProduct(
        ctx: RequestContext,
        productId: string | number,
        isDeleted = false,
    ) {
        try {
            // Broad listing tags cover home, deals, search, and category caches.
            const tags = new Set<string>([
                'products',
                'featured',
                'deals',
                'home-catalog',
                'category-products',
                'search',
                'collections',
            ]);

            if (!isDeleted) {
                const product = await this.productService.findOne(ctx, productId, ['translations']);
                const slug = product?.translations?.[0]?.slug;
                if (slug) {
                    tags.add(`product-${slug}`);
                }
            }

            this.queueRevalidation([...tags]);
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
                this.queueRevalidation([
                    'products',
                    'featured',
                    'deals',
                    'home-catalog',
                    'category-products',
                    'search',
                    'collections',
                ]);
            }
        } catch (err) {
            this.logger.error(
                `Storefront revalidation failed for variant ${variant.id}: ${err instanceof Error ? err.message : String(err)}`,
                'EmgStorefrontRevalidationService',
            );
        }
    }

    /** Coalesce rapid admin edits into one storefront revalidation request. */
    private queueRevalidation(tags: string[]) {
        for (const tag of tags) {
            this.pendingTags.add(tag);
        }
        if (this.flushTimer) {
            clearTimeout(this.flushTimer);
        }
        this.flushTimer = setTimeout(() => {
            const batch = [...this.pendingTags];
            this.pendingTags.clear();
            this.flushTimer = null;
            void this.postRevalidation(batch);
        }, 400);
    }

    private async postRevalidation(tags: string[]) {
        const storefrontUrl = process.env.STOREFRONT_URL?.replace(/\/$/, '');
        const secret = process.env.REVALIDATION_SECRET;

        if (!storefrontUrl || !secret) {
            this.logger.warn(
                'Storefront price sync skipped: set STOREFRONT_URL and REVALIDATION_SECRET so admin price edits appear on the shop without a hard refresh.',
                'EmgStorefrontRevalidationService',
            );
            return;
        }

        const uniqueTags = [...new Set(tags)];
        try {
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

            this.logger.debug(
                `Storefront prices refreshed (tags: ${uniqueTags.join(', ')})`,
                'EmgStorefrontRevalidationService',
            );
        } catch (err) {
            this.logger.error(
                `Storefront revalidation request failed: ${err instanceof Error ? err.message : String(err)}`,
                'EmgStorefrontRevalidationService',
            );
        }
    }
}
