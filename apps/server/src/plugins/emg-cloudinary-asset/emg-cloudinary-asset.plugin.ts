import {PluginCommonModule, VendurePlugin} from '@vendure/core';

import {adminApiExtensions} from './api-extensions';
import {CloudinaryAssetListener} from './cloudinary-asset.listener';
import {CloudinaryClientService} from './cloudinary-client.service';
import {EmgCloudinaryAssetResolver} from './emg-cloudinary-asset.resolver';
import {EmgCloudinaryAssetService} from './emg-cloudinary-asset.service';

/**
 * Cloudinary media for Vendure.
 *
 * Binary storage is handled by {@link configureCloudinaryAssetStorage} on AssetServerPlugin
 * so the native admin upload UI is unchanged. This plugin adds optional paste-URL import
 * and keeps Asset custom-field metadata in sync.
 */
@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [CloudinaryClientService, EmgCloudinaryAssetService, CloudinaryAssetListener],
    adminApiExtensions: {
        schema: adminApiExtensions,
        resolvers: [EmgCloudinaryAssetResolver],
    },
    dashboard: './dashboard/index.tsx',
})
export class EmgCloudinaryAssetPlugin {}
