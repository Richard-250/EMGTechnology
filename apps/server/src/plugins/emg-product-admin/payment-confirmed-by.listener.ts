import {Injectable, OnModuleInit} from '@nestjs/common';
import {
    AdministratorService,
    EventBus,
    Logger,
    OrderService,
    OrderStateTransitionEvent,
} from '@vendure/core';

const loggerCtx = 'PaymentConfirmedBy';

/**
 * When payment is settled via stock dashboard settlePayment (or our confirm mutation),
 * ensure the confirming staff member is recorded on the order if not already set.
 */
@Injectable()
export class PaymentConfirmedByListener implements OnModuleInit {
    constructor(
        private eventBus: EventBus,
        private orderService: OrderService,
        private administratorService: AdministratorService,
    ) {}

    onModuleInit() {
        this.eventBus.ofType(OrderStateTransitionEvent).subscribe(event => {
            void this.handle(event);
        });
    }

    private async handle(event: OrderStateTransitionEvent) {
        if ((event.toState as string) !== 'PaymentSettled') {
            return;
        }
        try {
            const existing = (event.order.customFields as {paymentConfirmedByName?: string} | null)
                ?.paymentConfirmedByName;
            if (existing) {
                return;
            }
            if (!event.ctx.activeUserId) {
                return;
            }

            const admin = await this.administratorService.findOneByUserId(
                event.ctx,
                event.ctx.activeUserId,
                ['user'],
            );
            if (!admin) {
                return;
            }

            const name =
                `${admin.firstName} ${admin.lastName}`.trim() || admin.user?.identifier || 'Staff';

            await this.orderService.updateCustomFields(event.ctx, event.order.id, {
                paymentConfirmedById: String(admin.id),
                paymentConfirmedByName: name,
                paymentConfirmedAt: new Date(),
            });
            Logger.info(`Recorded payment confirmer ${name} on order ${event.order.code}`, loggerCtx);
        } catch (err: any) {
            Logger.warn(`Could not record payment confirmer: ${err?.message}`, loggerCtx);
        }
    }
}
