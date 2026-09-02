import {PluginCommonModule, VendurePlugin} from '@vendure/core';

import {adminApiExtensions} from './api-extensions';
import {EmgCloudinaryAssetResolver} from './emg-cloudinary-asset.resolver';
import {EmgCloudinaryAssetService} from './emg-cloudinary-asset.service';

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [EmgCloudinaryAssetService],
    adminApiExtensions: {
        schema: adminApiExtensions,
        resolvers: [EmgCloudinaryAssetResolver],
    },
    dashboard: './dashboard/index.tsx',
    configuration: config => {
        const strategy = config.assetOptions.assetStorageStrategy;
        const originalToAbsoluteUrl = strategy.toAbsoluteUrl?.bind(strategy);
        strategy.toAbsoluteUrl = (request, identifier) => {
            if (identifier?.startsWith('http://') || identifier?.startsWith('https://')) {
                return identifier;
            }
            return originalToAbsoluteUrl?.(request, identifier) ?? identifier;
        };
        return config;
    },
})
export class EmgCloudinaryAssetPlugin {}
