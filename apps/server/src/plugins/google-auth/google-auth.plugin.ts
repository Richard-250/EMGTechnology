import {PluginCommonModule, VendurePlugin} from '@vendure/core';
import {GoogleAuthStrategy} from './google-auth.strategy';

export interface GoogleAuthPluginOptions {
    googleClientId: string;
}

@VendurePlugin({
    imports: [PluginCommonModule],
    configuration: config => {
        const options = GoogleAuthPlugin.options;
        if (options?.googleClientId) {
            config.authOptions.shopAuthenticationStrategy.push(
                new GoogleAuthStrategy({googleClientId: options.googleClientId}),
            );
        } else if (process.env.APP_ENV === 'prod' || process.env.NODE_ENV === 'production') {
            // eslint-disable-next-line no-console
            console.warn(
                '[GoogleAuthPlugin] GOOGLE_CLIENT_ID is empty — Continue with Google is disabled in production.',
            );
        }
        return config;
    },
})
export class GoogleAuthPlugin {
    static options: GoogleAuthPluginOptions | undefined;

    static init(options: GoogleAuthPluginOptions) {
        this.options = options;
        return GoogleAuthPlugin;
    }
}
