import {
    AuthenticationStrategy,
    ExternalAuthenticationService,
    Injector,
    Logger,
    RequestContext,
    User,
} from '@vendure/core';
import {DocumentNode} from 'graphql';
import gql from 'graphql-tag';

export type GoogleAuthData = {
    token: string;
};

type GoogleTokenPayload = {
    sub: string;
    email: string;
    email_verified?: string | boolean;
    given_name?: string;
    family_name?: string;
    aud: string;
};

export interface GoogleAuthOptions {
    googleClientId: string;
}

export class GoogleAuthStrategy implements AuthenticationStrategy<GoogleAuthData> {
    readonly name = 'google';
    private externalAuthenticationService!: ExternalAuthenticationService;
    private readonly logger = new Logger();

    constructor(private readonly options: GoogleAuthOptions) {}

    init(injector: Injector) {
        this.externalAuthenticationService = injector.get(ExternalAuthenticationService);
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
            const payload = await this.verifyIdToken(data.token);
            if (!payload?.email) {
                return false;
            }

            const existingUser = await this.externalAuthenticationService.findCustomerUser(
                ctx,
                this.name,
                payload.sub,
            );
            if (existingUser) {
                return existingUser;
            }

            const emailVerified =
                payload.email_verified === true || payload.email_verified === 'true';

            return this.externalAuthenticationService.createCustomerAndUser(ctx, {
                strategy: this.name,
                externalIdentifier: payload.sub,
                verified: emailVerified,
                emailAddress: payload.email,
                firstName: payload.given_name || 'Google',
                lastName: payload.family_name || 'User',
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Google authentication failed: ${message}`, 'GoogleAuthStrategy');
            return false;
        }
    }

    private async verifyIdToken(idToken: string): Promise<GoogleTokenPayload | null> {
        const response = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
        );
        if (!response.ok) {
            return null;
        }

        const payload = (await response.json()) as GoogleTokenPayload;
        if (payload.aud !== this.options.googleClientId) {
            return null;
        }

        return payload;
    }
}
