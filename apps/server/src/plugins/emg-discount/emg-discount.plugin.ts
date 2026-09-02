import {Injectable, OnModuleInit} from '@nestjs/common';
import {
    EventBus,
    Logger,
    PluginCommonModule,
    Product,
    ProductEvent,
    ProductService,
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
            if (event.type === 'updated' || event.type === 'created') {
                void this.syncOriginalPrice(event.ctx, event.entity.id);
            }
        });
    }

    private async syncOriginalPrice(ctx: RequestContext, productId: string | number) {
        const product = await this.productService.findOne(ctx, productId, ['variants']);
        if (!product) {
            return;
        }

        const cf = (product.customFields ?? {}) as {
            isDiscounted?: boolean;
            originalPrice?: number | null;
        };

        if (!cf.isDiscounted || (cf.originalPrice && cf.originalPrice > 0)) {
            return;
        }

        const variants = product.variants ?? [];
        const prices = variants
            .map(v => (v as {priceWithTax?: number; price?: number}).priceWithTax ?? (v as {price?: number}).price)
            .filter((p): p is number => typeof p === 'number' && p > 0);

        if (!prices.length) {
            return;
        }

        const maxPriceMajor = Math.round(Math.max(...prices) / 100);
        product.customFields = {
            ...cf,
            originalPrice: maxPriceMajor,
        };

        await this.connection.getRepository(ctx, Product).save(product);
        this.logger.debug(`Auto-set originalPrice=${maxPriceMajor} for product ${productId}`, 'EmgDiscountPlugin');
    }
}

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [EmgDiscountService],
})
export class EmgDiscountPlugin {}
