import {
    AuthenticationStrategy,
    CustomerService,
    ExternalAuthenticationService,
    Injector,
    Logger,
    RequestContext,
    User,
} from '@vendure/core';
import {OAuth2Client} from 'google-auth-library';
import {DocumentNode} from 'graphql';
import gql from 'graphql-tag';

export type GoogleAuthData = {
    token: string;
};

type GoogleIdTokenPayload = {
    sub: string;
    email?: string;
    email_verified?: boolean;
    given_name?: string;
    family_name?: string;
    name?: string;
    picture?: string;
    aud?: string;
};

export interface GoogleAuthOptions {
    googleClientId: string;
}

/**
 * Google Identity Services (GIS) ID-token authentication for the Shop API.
 *
 * Flow: browser GIS button → Google ID token (JWT) → Vendure authenticate({ google: { token } }).
 * No OAuth authorization-code redirect / callback URL is used. GOOGLE_CLIENT_SECRET is not required.
 */
export class GoogleAuthStrategy implements AuthenticationStrategy<GoogleAuthData> {
    readonly name = 'google';
    private externalAuthenticationService!: ExternalAuthenticationService;
    private customerService!: CustomerService;
    private readonly oauthClient: OAuth2Client;
    private readonly logger = new Logger();

    constructor(private readonly options: GoogleAuthOptions) {
        this.oauthClient = new OAuth2Client(options.googleClientId);
    }

    init(injector: Injector) {
        this.externalAuthenticationService = injector.get(ExternalAuthenticationService);
        this.customerService = injector.get(CustomerService);
    }

    defineInputType(): DocumentNode {
        return gql`
            input GoogleAuthInput {
                token: String!
            }
        `;
    }

    async authenticate(ctx: RequestContext, data: GoogleAuthData): Promise<User | false> {
        try {
            if (!data?.token?.trim()) {
                this.logger.warn('Google sign-in rejected: empty token', 'GoogleAuthStrategy');
                return false;
            }

            const payload = await this.verifyIdToken(data.token);
            if (!payload?.sub) {
                this.logger.warn('Google sign-in rejected: token missing subject', 'GoogleAuthStrategy');
                return false;
            }
            if (!payload.email) {
                this.logger.warn('Google sign-in rejected: token missing email claim', 'GoogleAuthStrategy');
                return false;
            }

            const existingGoogleUser = await this.externalAuthenticationService.findCustomerUser(
                ctx,
                this.name,
                payload.sub,
            );
            if (existingGoogleUser) {
                await this.syncCustomerProfile(ctx, existingGoogleUser.id, payload);
                return existingGoogleUser;
            }

            // Only link to an existing email account when Google verified the email ownership.
            const emailVerified = payload.email_verified === true;

            const user = await this.externalAuthenticationService.createCustomerAndUser(ctx, {
                strategy: this.name,
                externalIdentifier: payload.sub,
                verified: emailVerified,
                emailAddress: payload.email,
                firstName: payload.given_name || this.extractFirstName(payload.name),
                lastName: payload.family_name || this.extractLastName(payload.name),
            });

            await this.syncCustomerProfile(ctx, user.id, payload);
            return user;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            // Surface unverified-email linking failures distinctly for the storefront.
            if (
                message.includes('UnverifiedExternalEmail') ||
                message.toLowerCase().includes('unverified') ||
                (error as {name?: string})?.name === 'UnverifiedExternalEmailError'
            ) {
                this.logger.warn(
                    'Google sign-in blocked: cannot link to an existing unverified email account',
                    'GoogleAuthStrategy',
                );
                throw new Error('GOOGLE_EMAIL_NOT_VERIFIED');
            }
            this.logger.error(`Google authentication failed: ${message}`, 'GoogleAuthStrategy');
            return false;
        }
    }

    private async verifyIdToken(idToken: string): Promise<GoogleIdTokenPayload | null> {
        const ticket = await this.oauthClient.verifyIdToken({
            idToken,
            audience: this.options.googleClientId,
        });
        return (ticket.getPayload() as GoogleIdTokenPayload | undefined) ?? null;
    }

    private async syncCustomerProfile(
        ctx: RequestContext,
        userId: string | number,
        payload: GoogleIdTokenPayload,
    ): Promise<void> {
        const customer = await this.customerService.findOneByUserId(ctx, userId);
        if (!customer) {
            return;
        }

        const firstName = payload.given_name || this.extractFirstName(payload.name) || customer.firstName;
        const lastName = payload.family_name || this.extractLastName(payload.name) || customer.lastName;

        const existingPicture = (customer.customFields as {googleProfileImageUrl?: string} | undefined)
            ?.googleProfileImageUrl;

        await this.customerService.update(ctx, {
            id: customer.id,
            firstName,
            lastName,
            customFields: {
                googleUserId: payload.sub,
                googleProfileImageUrl: payload.picture ?? existingPicture,
            },
        });
    }

    private extractFirstName(fullName?: string): string {
        if (!fullName?.trim()) {
            return 'Google';
        }
        return fullName.trim().split(/\s+/)[0] || 'Google';
    }

    private extractLastName(fullName?: string): string {
        if (!fullName?.trim()) {
            return 'User';
        }
        const parts = fullName.trim().split(/\s+/);
        return parts.length > 1 ? parts.slice(1).join(' ') : 'User';
    }
}
