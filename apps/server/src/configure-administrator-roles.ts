import {Logger, Permission, RoleService, RequestContextService} from '@vendure/core';
import type {bootstrap} from '@vendure/core';

import {confirmOrderPaymentPermission} from './plugins/emg-product-admin/confirm-order-payment.service';

const loggerCtx = 'ConfigureAdminRoles';

/** Permissions needed so staff can create administrators and assign roles. */
const ADMINISTRATOR_CRUD = [
    Permission.CreateAdministrator,
    Permission.ReadAdministrator,
    Permission.UpdateAdministrator,
    Permission.DeleteAdministrator,
] as const;

export async function configureAdministratorRoles(app: Awaited<ReturnType<typeof bootstrap>>) {
    const requestContextService = app.get(RequestContextService);
    const roleService = app.get(RoleService);
    const ctx = await requestContextService.create({apiType: 'admin'});

    const confirmPerm = confirmOrderPaymentPermission.Permission;

    const {items: roles} = await roleService.findAll(ctx, {take: 100});
    for (const role of roles) {
        if (role.code !== 'administrator') {
            continue;
        }
        const current = new Set(role.permissions as string[]);
        const missing = [
            ...ADMINISTRATOR_CRUD.filter(p => !current.has(p)),
            ...(!current.has(confirmPerm) ? [confirmPerm] : []),
        ];
        if (!missing.length) {
            continue;
        }
        await roleService.update(ctx, {
            id: role.id,
            permissions: [...role.permissions, ...missing] as Permission[],
        });
        Logger.info(
            `Updated role "${role.code}" (#${role.id}) with: ${missing.join(', ')}`,
            loggerCtx,
        );
    }

    // Ensure SuperAdmin can grant ConfirmOrderPayment to others
    const superAdmin = roles.find(r => r.code === '__super_admin_role__');
    if (superAdmin && !(superAdmin.permissions as string[]).includes(confirmPerm)) {
        await roleService.update(ctx, {
            id: superAdmin.id,
            permissions: [...superAdmin.permissions, confirmPerm] as Permission[],
        });
        Logger.info('Added ConfirmOrderPayment to SuperAdmin role', loggerCtx);
    }
}
