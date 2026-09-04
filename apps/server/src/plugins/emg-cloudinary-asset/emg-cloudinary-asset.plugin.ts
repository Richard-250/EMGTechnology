import {PluginCommonModule, VendurePlugin} from '@vendure/core';

import {adminApiExtensions} from './api-extensions';
import {CloudinaryAssetListener} from './cloudinary-asset.listener';
import {CloudinaryClientService} from './cloudinary-client.service';
import {EmgCloudinaryAssetResolver} from './emg-cloudinary-asset.resolver';
import {EmgCloudinaryAssetService} from './emg-cloudinary-asset.service';

/**
 * Optional Cloudinary helpers (paste image URL).
 * Native admin asset uploads use Vendure's standard local AssetServerPlugin storage —
 * unchanged traditional upload UX.
 */
@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [CloudinaryClientService, EmgCloudinaryAssetService, CloudinaryAssetListener],
    adminApiExtensions: {
        schema: adminApiExtensions,
        resolvers: [EmgCloudinaryAssetResolver],
    },
    dashboard: './dashboard/index.tsx',
    configuration: config => {
        // Allow Asset.source/preview that are already absolute CDN URLs (paste-URL imports).
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
