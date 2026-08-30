import { EmailEventListener } from '@vendure/email-plugin';
import { SignupOtpEvent } from './signup-otp.event';

export const signupOtpHandler = new EmailEventListener('signup-otp')
    .on(SignupOtpEvent)
    .setRecipient(event => event.email)
    .setFrom('{{ fromAddress }}')
    .setSubject('Your EMG Technology verification code')
    .setTemplateVars(event => ({
        otp: event.otp,
        firstName: event.firstName,
    }));
