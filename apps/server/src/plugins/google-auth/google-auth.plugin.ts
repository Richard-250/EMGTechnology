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
