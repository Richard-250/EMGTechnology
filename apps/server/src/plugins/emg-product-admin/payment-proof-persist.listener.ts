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

/**
 * Persist the customer's uploaded payment screenshot URL onto the Order custom field
 * when the order reaches PaymentAuthorized, so the admin order page can always show it
 * without relying only on payment.metadata JSON.
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
        // Backfill existing orders that already have proof in payment.metadata
        // but are missing order.customFields.paymentProofUrl.
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
                for (const payment of [...(order.payments || [])].reverse()) {
                    proofUrl = extractProofUrl(payment.metadata);
                    if (proofUrl) break;
                }
                if (!proofUrl) continue;
                await this.orderService.updateCustomFields(ctx, order.id, {
                    paymentProofUrl: proofUrl,
                });
                saved += 1;
            }
            if (saved > 0) {
                Logger.info(`Backfilled paymentProofUrl on ${saved} existing order(s)`, loggerCtx);
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

            const existing = (order.customFields as {paymentProofUrl?: string} | null)
                ?.paymentProofUrl;
            if (existing?.trim()) {
                return;
            }

            const payments = order.payments || [];
            let proofUrl = '';
            for (const payment of [...payments].reverse()) {
                proofUrl = extractProofUrl(payment.metadata);
                if (proofUrl) break;
            }

            if (!proofUrl) {
                Logger.warn(
                    `Order #${order.code}: PaymentAuthorized but no paymentProofUrl found in payment metadata`,
                    loggerCtx,
                );
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
                paymentProofUrl: proofUrl,
                ...(deliveryDate ? {deliveryDate} : {}),
            });

            Logger.info(
                `Order #${order.code}: saved paymentProofUrl on order customFields`,
                loggerCtx,
            );
        } catch (err: any) {
            Logger.warn(
                `Could not persist payment proof URL: ${err?.message || err}`,
                loggerCtx,
            );
        }
    }
}
