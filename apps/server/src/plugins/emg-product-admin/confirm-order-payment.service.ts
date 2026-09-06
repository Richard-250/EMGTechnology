import {
    AdministratorService,
    EntityHydrator,
    ID,
    Logger,
    OrderService,
    PermissionDefinition,
    RequestContext,
    UserInputError,
} from '@vendure/core';
import {Injectable} from '@nestjs/common';

const loggerCtx = 'ConfirmPayment';

export const confirmOrderPaymentPermission = new PermissionDefinition({
    name: 'ConfirmOrderPayment',
    description: 'Allows verifying customer payment proof and confirming (settling) the order payment',
});

@Injectable()
export class ConfirmOrderPaymentService {
    constructor(
        private orderService: OrderService,
        private administratorService: AdministratorService,
        private entityHydrator: EntityHydrator,
    ) {}

    async confirmPayment(ctx: RequestContext, orderId: ID, paymentId?: ID) {
        const order = await this.orderService.findOne(ctx, orderId, ['payments', 'customer']);
        if (!order) {
            throw new UserInputError(`Order ${orderId} not found`);
        }

        await this.entityHydrator.hydrate(ctx, order, {relations: ['payments']});

        const payment =
            (paymentId
                ? order.payments?.find(p => String(p.id) === String(paymentId))
                : order.payments?.find(p => p.state === 'Authorized')) ||
            order.payments?.[order.payments.length - 1];

        if (!payment) {
            throw new UserInputError('No payment found on this order to confirm');
        }

        if (payment.state !== 'Settled') {
            const settleResult = await this.orderService.settlePayment(ctx, payment.id);
            if ((settleResult as {errorCode?: string}).errorCode) {
                throw new UserInputError(
                    `Could not settle payment: ${(settleResult as {message?: string}).message || 'unknown error'}`,
                );
            }
        }

        let confirmedByName = 'Staff';
        let confirmedById = ctx.activeUserId ? String(ctx.activeUserId) : '';

        if (ctx.activeUserId) {
            try {
                const admin = await this.administratorService.findOneByUserId(ctx, ctx.activeUserId, [
                    'user',
                ]);
                if (admin) {
                    confirmedById = String(admin.id);
                    confirmedByName =
                        `${admin.firstName} ${admin.lastName}`.trim() ||
                        admin.user?.identifier ||
                        confirmedByName;
                }
            } catch (err: any) {
                Logger.warn(`Could not resolve confirming administrator: ${err?.message}`, loggerCtx);
            }
        }

        await this.orderService.updateCustomFields(ctx, orderId, {
            paymentConfirmedById: confirmedById,
            paymentConfirmedByName: confirmedByName,
            paymentConfirmedAt: new Date(),
        });

        const updated = await this.orderService.findOne(ctx, orderId, ['payments', 'customer', 'lines']);
        Logger.info(
            `Payment ${payment.id} on order ${updated?.code} confirmed by ${confirmedByName}`,
            loggerCtx,
        );
        return updated;
    }
}
