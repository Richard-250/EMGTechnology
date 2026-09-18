import {Injectable, OnApplicationBootstrap, OnModuleInit} from '@nestjs/common';
import {
    EntityHydrator,
    EventBus,
    Logger,
    Order,
    OrderService,
    OrderStateTransitionEvent,
    RequestContextService,
    TransactionalConnection,
} from '@vendure/core';

const loggerCtx = 'PaymentProofPersist';

function extractProofUrl(metadata: unknown): string {
    if (!metadata || typeof metadata !== 'object') return '';
    const meta = metadata as Record<string, unknown>;
    const direct =
        meta.paymentProofUrl ||
        meta.proofUrl ||
        meta.paymentProof ||
        meta.proofImageUrl ||
        meta.url;
    if (typeof direct === 'string' && direct.trim()) {
        return direct.trim();
    }
    for (const value of Object.values(meta)) {
        if (typeof value === 'string') {
            const v = value.trim();
            if (
                v.startsWith('http') &&
                (/payment-proof|\/assets\/|\/preview\/|\/uploads\/|\.(jpe?g|png|webp|gif)(\?|$)/i.test(
                    v,
                ) ||
                    v.includes('proof'))
            ) {
                return v;
            }
        }
        if (value && typeof value === 'object') {
            const nested = extractProofUrl(value);
            if (nested) return nested;
        }
    }
    return '';
}

function extractProofAssetId(metadata: unknown): string {
    if (!metadata || typeof metadata !== 'object') return '';
    const meta = metadata as Record<string, unknown>;
    const id = meta.paymentProofAssetId || meta.proofAssetId || meta.assetId;
    return typeof id === 'string' && id.trim() ? id.trim() : '';
}

/**
 * Persist the customer's uploaded payment screenshot URL + Asset ID onto the Order
 * when it reaches PaymentAuthorized, so the admin order page always shows the proof.
 */
@Injectable()
export class PaymentProofPersistListener implements OnModuleInit, OnApplicationBootstrap {
    constructor(
        private eventBus: EventBus,
        private orderService: OrderService,
        private entityHydrator: EntityHydrator,
        private requestContextService: RequestContextService,
        private connection: TransactionalConnection,
    ) {}

    onModuleInit() {
        this.eventBus.ofType(OrderStateTransitionEvent).subscribe(event => {
            void this.handle(event);
        });
    }

    async onApplicationBootstrap() {
        try {
            const ctx = await this.requestContextService.create({apiType: 'admin'});
            const repo = this.connection.getRepository(ctx, Order);
            const orders = await repo
                .createQueryBuilder('o')
                .leftJoinAndSelect('o.payments', 'p')
                .where('o.state IN (:...states)', {
                    states: ['PaymentAuthorized', 'PaymentSettled', 'Shipped', 'Delivered'],
                })
                .andWhere(
                    `(o.customFieldsPaymentproofurl IS NULL OR o.customFieldsPaymentproofurl = '')`,
                )
                .orderBy('o.id', 'DESC')
                .take(200)
                .getMany();

            let saved = 0;
            for (const order of orders) {
                let proofUrl = '';
                let assetId = '';
                for (const payment of [...(order.payments || [])].reverse()) {
                    if (!proofUrl) proofUrl = extractProofUrl(payment.metadata);
                    if (!assetId) assetId = extractProofAssetId(payment.metadata);
                    if (proofUrl && assetId) break;
                }
                if (!proofUrl && !assetId) continue;
                await this.orderService.updateCustomFields(ctx, order.id, {
                    ...(proofUrl ? {paymentProofUrl: proofUrl} : {}),
                    ...(assetId ? {paymentProofAssetId: assetId} : {}),
                });
                saved += 1;
            }
            if (saved > 0) {
                Logger.info(`Backfilled payment proof fields on ${saved} existing order(s)`, loggerCtx);
            }
        } catch (err: any) {
            Logger.warn(`Payment proof backfill skipped: ${err?.message || err}`, loggerCtx);
        }
    }

    private async handle(event: OrderStateTransitionEvent) {
        if ((event.toState as string) !== 'PaymentAuthorized') {
            return;
        }

        try {
            const order = event.order;
            await this.entityHydrator.hydrate(event.ctx, order, {relations: ['payments']});

            const existing = (order.customFields as {
                paymentProofUrl?: string;
                paymentProofAssetId?: string;
            } | null) ?? {};

            const payments = order.payments || [];
            let proofUrl = existing.paymentProofUrl?.trim() || '';
            let assetId = existing.paymentProofAssetId?.trim() || '';

            for (const payment of [...payments].reverse()) {
                if (!proofUrl) proofUrl = extractProofUrl(payment.metadata);
                if (!assetId) assetId = extractProofAssetId(payment.metadata);
                if (proofUrl && assetId) break;
            }

            if (!proofUrl && !assetId) {
                Logger.warn(
                    `Order #${order.code}: PaymentAuthorized but no payment proof found in payment metadata`,
                    loggerCtx,
                );
                return;
            }

            if (
                existing.paymentProofUrl?.trim() === proofUrl &&
                existing.paymentProofAssetId?.trim() === assetId
            ) {
                return;
            }

            const deliveryDate =
                (order.customFields as {deliveryDate?: string} | null)?.deliveryDate ||
                (() => {
                    for (const payment of payments) {
                        const meta = (payment.metadata || {}) as Record<string, unknown>;
                        if (typeof meta.deliveryDate === 'string' && meta.deliveryDate.trim()) {
                            return meta.deliveryDate.trim();
                        }
                    }
                    return undefined;
                })();

            await this.orderService.updateCustomFields(event.ctx, order.id, {
                ...(proofUrl ? {paymentProofUrl: proofUrl} : {}),
                ...(assetId ? {paymentProofAssetId: assetId} : {}),
                ...(deliveryDate ? {deliveryDate} : {}),
            });

            Logger.info(
                `Order #${order.code}: saved payment proof on order (url=${Boolean(proofUrl)}, assetId=${assetId || 'n/a'})`,
                loggerCtx,
            );
        } catch (err: any) {
            Logger.warn(
                `Could not persist payment proof: ${err?.message || err}`,
                loggerCtx,
            );
        }
    }
}
