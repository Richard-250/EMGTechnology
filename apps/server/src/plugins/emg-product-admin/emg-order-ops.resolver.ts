import {Args, Mutation, Query, Resolver} from '@nestjs/graphql';
import {Allow, Ctx, Permission, RequestContext, Transaction} from '@vendure/core';

import {confirmOrderPaymentPermission, ConfirmOrderPaymentService} from './confirm-order-payment.service';
import {OrderNotifyService} from './order-notify.service';

@Resolver()
export class EmgOrderOpsResolver {
    constructor(
        private orderNotifyService: OrderNotifyService,
        private confirmOrderPaymentService: ConfirmOrderPaymentService,
    ) {}

    @Query()
    @Allow(Permission.ReadSettings, Permission.UpdateSettings, Permission.SuperAdmin)
    async emgOrderNotifySettings(@Ctx() ctx: RequestContext) {
        return this.orderNotifyService.getSettingsView(ctx);
    }

    @Mutation()
    @Transaction()
    @Allow(Permission.UpdateSettings, Permission.SuperAdmin)
    async emgUpdateOrderNotifySettings(
        @Ctx() ctx: RequestContext,
        @Args()
        args: {orderNotifyMode: string; orderNotifyAdministratorIds?: string},
    ) {
        return this.orderNotifyService.updateSettings(ctx, {
            orderNotifyMode: args.orderNotifyMode as any,
            orderNotifyAdministratorIds: args.orderNotifyAdministratorIds,
        });
    }

    @Mutation()
    @Transaction()
    @Allow(confirmOrderPaymentPermission.Permission, Permission.UpdateOrder, Permission.SuperAdmin)
    async emgConfirmOrderPayment(
        @Ctx() ctx: RequestContext,
        @Args() args: {orderId: string; paymentId?: string},
    ) {
        const order = await this.confirmOrderPaymentService.confirmPayment(
            ctx,
            args.orderId,
            args.paymentId,
        );
        const cf = (order?.customFields ?? {}) as {
            paymentConfirmedByName?: string;
            paymentConfirmedAt?: Date;
        };
        return {
            id: order?.id,
            code: order?.code,
            state: order?.state,
            paymentConfirmedByName: cf.paymentConfirmedByName ?? null,
            paymentConfirmedAt: cf.paymentConfirmedAt ?? null,
        };
    }
}
