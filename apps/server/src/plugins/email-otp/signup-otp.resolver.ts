import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, Permission, RequestContext, Transaction } from '@vendure/core';
import { SignupOtpService } from './signup-otp.service';

@Resolver()
export class SignupOtpResolver {
    constructor(private readonly signupOtpService: SignupOtpService) {}

    @Transaction()
    @Mutation()
    @Allow(Permission.Public)
    requestSignupOtp(
        @Ctx() ctx: RequestContext,
        @Args() args: { email: string; firstName: string; lastName: string },
    ) {
        return this.signupOtpService.requestOtp(ctx, args);
    }

    @Transaction()
    @Mutation()
    @Allow(Permission.Public)
    verifySignupOtp(
        @Ctx() ctx: RequestContext,
        @Args() args: { email: string; code: string },
    ) {
        return this.signupOtpService.verifyOtp(ctx, args.email, args.code);
    }

    @Transaction()
    @Mutation()
    @Allow(Permission.Public)
    async completeSignup(
        @Ctx() ctx: RequestContext,
        @Args() args: { email: string; password: string; phoneNumber?: string },
    ) {
        const result = await this.signupOtpService.completeSignup(ctx, args);
        return {
            success: result.success,
            message: result.message ?? '',
        };
    }
}
