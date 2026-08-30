import { Injectable } from '@nestjs/common';
import {
    CustomerService,
    EventBus,
    Logger,
    RequestContext,
    TransactionalConnection,
    User,
} from '@vendure/core';
import { SignupOtp } from './signup-otp.entity';
import { SignupOtpEvent } from './signup-otp.event';

const OTP_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class SignupOtpService {
    constructor(
        private readonly connection: TransactionalConnection,
        private readonly eventBus: EventBus,
        private readonly customerService: CustomerService,
    ) {}

    async requestOtp(
        ctx: RequestContext,
        input: { email: string; firstName: string; lastName: string },
    ): Promise<boolean> {
        const email = input.email.trim().toLowerCase();
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const repo = this.connection.getRepository(ctx, SignupOtp);

        let row = await repo.findOne({ where: { email } });
        if (!row) {
            row = new SignupOtp({
                email,
                firstName: input.firstName.trim(),
                lastName: input.lastName.trim(),
                code,
                expiresAt: new Date(Date.now() + OTP_TTL_MS),
                verified: false,
            });
        } else {
            row.firstName = input.firstName.trim();
            row.lastName = input.lastName.trim();
            row.code = code;
            row.expiresAt = new Date(Date.now() + OTP_TTL_MS);
            row.verified = false;
        }

        await repo.save(row);
        await this.eventBus.publish(new SignupOtpEvent(ctx, email, row.firstName, code));
        Logger.info(`Signup OTP sent to ${email}`, 'SignupOtpService');
        return true;
    }

    async verifyOtp(ctx: RequestContext, email: string, code: string): Promise<boolean> {
        const row = await this.connection.getRepository(ctx, SignupOtp).findOne({
            where: { email: email.trim().toLowerCase() },
        });
        if (!row || row.code !== code.trim() || row.expiresAt.getTime() < Date.now()) {
            return false;
        }
        row.verified = true;
        await this.connection.getRepository(ctx, SignupOtp).save(row);
        return true;
    }

    async completeSignup(
        ctx: RequestContext,
        input: { email: string; password: string; phoneNumber?: string },
    ): Promise<{ success: boolean; message?: string }> {
        const email = input.email.trim().toLowerCase();
        const row = await this.connection.getRepository(ctx, SignupOtp).findOne({
            where: { email },
        });
        if (!row?.verified) {
            return { success: false, message: 'Please verify your email first.' };
        }

        const result = await this.customerService.registerCustomerAccount(ctx, {
            emailAddress: email,
            firstName: row.firstName,
            lastName: row.lastName,
            password: input.password,
            phoneNumber: input.phoneNumber,
        });

        if ((result as { errorCode?: string }).errorCode) {
            const message = (result as { message?: string }).message || 'Could not create account.';
            return { success: false, message };
        }

        await this.markUserVerified(ctx, email);
        await this.connection.getRepository(ctx, SignupOtp).delete({ email });
        return { success: true };
    }

    private async markUserVerified(ctx: RequestContext, email: string) {
        const repo = this.connection.getRepository(ctx, User);
        const user = await repo.findOne({ where: { identifier: email } });
        if (user && !user.verified) {
            user.verified = true;
            await repo.save(user);
        }
    }
}
