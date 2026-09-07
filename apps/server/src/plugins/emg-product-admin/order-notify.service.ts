import {
    AdministratorService,
    GlobalSettingsService,
    Logger,
    RequestContext,
} from '@vendure/core';
import {Injectable} from '@nestjs/common';

const loggerCtx = 'OrderNotify';

export type OrderNotifyMode = 'default' | 'all' | 'specific' | 'none';

@Injectable()
export class OrderNotifyService {
    constructor(
        private globalSettingsService: GlobalSettingsService,
        private administratorService: AdministratorService,
    ) {}

    async getMode(ctx: RequestContext): Promise<OrderNotifyMode> {
        try {
            const settings = await this.globalSettingsService.getSettings(ctx);
            const mode = String(
                (settings.customFields as {orderNotifyMode?: string} | null)?.orderNotifyMode ||
                    'default',
            );
            if (mode === 'all' || mode === 'specific' || mode === 'none' || mode === 'default') {
                return mode;
            }
            return 'default';
        } catch (e) {
            Logger.warn(
                `Could not read orderNotifyMode (using default): ${e instanceof Error ? e.message : e}`,
                loggerCtx,
            );
            return 'default';
        }
    }

    async getSpecificIds(ctx: RequestContext): Promise<string[]> {
        try {
            const settings = await this.globalSettingsService.getSettings(ctx);
            const raw = String(
                (settings.customFields as {orderNotifyAdministratorIds?: string} | null)
                    ?.orderNotifyAdministratorIds || '',
            );
            return raw
                .split(/[,\s]+/)
                .map(s => s.trim())
                .filter(Boolean);
        } catch (e) {
            Logger.warn(
                `Could not read orderNotifyAdministratorIds: ${e instanceof Error ? e.message : e}`,
                loggerCtx,
            );
            return [];
        }
    }

    async resolveStaffEmails(ctx: RequestContext): Promise<string[]> {
        const mode = await this.getMode(ctx);
        if (mode === 'none') {
            return [];
        }

        if (mode === 'default') {
            const fallback =
                process.env.ADMIN_NOTIFICATION_EMAIL ||
                process.env.ADMIN_EMAIL ||
                'info@emgtechnologyltd.com';
            return [fallback];
        }

        const {items: admins} = await this.administratorService.findAll(
            ctx,
            {take: 200},
            ['user'],
        );
        const emails: string[] = [];

        if (mode === 'all') {
            for (const admin of admins) {
                if (admin.user?.identifier) {
                    emails.push(admin.user.identifier);
                }
            }
        } else if (mode === 'specific') {
            const ids = new Set(await this.getSpecificIds(ctx));
            for (const admin of admins) {
                if (ids.has(String(admin.id)) && admin.user?.identifier) {
                    emails.push(admin.user.identifier);
                }
            }
        }

        const unique = Array.from(new Set(emails.map(e => e.trim().toLowerCase()).filter(Boolean)));
        if (!unique.length) {
            Logger.warn(
                'No staff emails resolved for order notify; falling back to ADMIN_NOTIFICATION_EMAIL',
                loggerCtx,
            );
            const fallback =
                process.env.ADMIN_NOTIFICATION_EMAIL ||
                process.env.ADMIN_EMAIL ||
                'info@emgtechnologyltd.com';
            return [fallback];
        }
        return unique;
    }

    async updateSettings(
        ctx: RequestContext,
        input: {orderNotifyMode: OrderNotifyMode; orderNotifyAdministratorIds?: string},
    ) {
        const settings = await this.globalSettingsService.getSettings(ctx);
        await this.globalSettingsService.updateSettings(ctx, {
            customFields: {
                ...(settings.customFields as object),
                orderNotifyMode: input.orderNotifyMode,
                orderNotifyAdministratorIds: input.orderNotifyAdministratorIds ?? '',
            },
        });
        return this.getSettingsView(ctx);
    }

    async getSettingsView(ctx: RequestContext) {
        const mode = await this.getMode(ctx);
        const ids = await this.getSpecificIds(ctx);
        const {items: admins} = await this.administratorService.findAll(
            ctx,
            {take: 200},
            ['user'],
        );
        return {
            orderNotifyMode: mode,
            orderNotifyAdministratorIds: ids.join(','),
            administrators: admins.map(a => ({
                id: String(a.id),
                firstName: a.firstName,
                lastName: a.lastName,
                emailAddress: a.user?.identifier ?? '',
            })),
        };
    }
}
