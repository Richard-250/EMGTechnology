import { RequestContext, VendureEvent } from '@vendure/core';

export class SignupOtpEvent extends VendureEvent {
    constructor(
        public ctx: RequestContext,
        public email: string,
        public firstName: string,
        public otp: string,
    ) {
        super();
    }
}
