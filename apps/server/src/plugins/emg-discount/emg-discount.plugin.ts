import {Injectable, OnModuleInit} from '@nestjs/common';
import {
    EventBus,
    Logger,
    PluginCommonModule,
    Product,
    ProductEvent,
    ProductService,
    ProductVariant,
    RequestContext,
    TransactionalConnection,
    VendurePlugin,
} from '@vendure/core';

@Injectable()
export class EmgDiscountService implements OnModuleInit {
    private readonly logger = new Logger();

    constructor(
        private readonly eventBus: EventBus,
        private readonly productService: ProductService,
        private readonly connection: TransactionalConnection,
    ) {}

    onModuleInit() {
        this.eventBus.ofType(ProductEvent).subscribe(event => {
            // Only sync the product being saved — never clear or rewrite other Super Deals
            if (event.type === 'updated' || event.type === 'created') {
                void this.syncOriginalPrices(event.ctx, event.entity.id);
            }
        });
    }

    /**
     * Auto-fill product.originalPrice and each variant's variantOriginalPrice from
     * current catalog prices when a discount/Super Deal is configured and originals
     * are missing. Does not touch other products' isDiscounted flags.
     */
    private async syncOriginalPrices(ctx: RequestContext, productId: string | number) {
        const product = await this.productService.findOne(ctx, productId, ['variants']);
        if (!product) {
            return;
        }

        const cf = (product.customFields ?? {}) as {
            isDiscounted?: boolean;
            discountType?: string | null;
            discountPercentage?: number | null;
            discountAmount?: number | null;
            originalPrice?: number | null;
        };

        const hasDiscountConfig =
            (cf.discountPercentage != null && cf.discountPercentage > 0) ||
            (cf.discountAmount != null && cf.discountAmount > 0) ||
            cf.isDiscounted === true;

        if (!hasDiscountConfig) {
            return;
        }

        const variants = product.variants ?? [];
        const prices = variants
            .map(
                v =>
                    (v as {priceWithTax?: number; price?: number}).priceWithTax ??
                    (v as {price?: number}).price,
            )
            .filter((p): p is number => typeof p === 'number' && p > 0);

        let productChanged = false;
        if ((!cf.originalPrice || cf.originalPrice <= 0) && prices.length) {
            const maxPriceMajor = Math.round(Math.max(...prices) / 100);
            product.customFields = {
                ...cf,
                originalPrice: maxPriceMajor,
            };
            productChanged = true;
            this.logger.debug(
                `Auto-set originalPrice=${maxPriceMajor} for product ${productId}`,
                'EmgDiscountPlugin',
            );
        }

        if (productChanged) {
            await this.connection.getRepository(ctx, Product).save(product);
        }

        // Per-variant originals so % / fixed discounts calculate independently
        for (const variant of variants) {
            const price =
                (variant as {priceWithTax?: number; price?: number}).priceWithTax ??
                (variant as {price?: number}).price;
            if (typeof price !== 'number' || price <= 0) {
                continue;
            }
            const vcf = ((variant as ProductVariant).customFields ?? {}) as {
                variantOriginalPrice?: number | null;
                variantDiscountPercentage?: number | null;
                variantDiscountAmount?: number | null;
            };
            if (vcf.variantOriginalPrice != null && vcf.variantOriginalPrice > 0) {
                continue;
            }
            const major = Math.round(price / 100);
            (variant as ProductVariant).customFields = {
                ...vcf,
                variantOriginalPrice: major,
            };
            await this.connection.getRepository(ctx, ProductVariant).save(variant);
        }
    }
}

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [EmgDiscountService],
})
export class EmgDiscountPlugin {}
