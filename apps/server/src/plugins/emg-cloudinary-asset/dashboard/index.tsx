import {defineDashboardExtension} from '@vendure/dashboard';

import {ImportMediaPanel} from './import-media-panel';

/**
 * Optional: paste a public image URL into Cloudinary + Assets.
 * Native file upload still uses the standard Vendure Assets UI (backed by Cloudinary storage).
 */
defineDashboardExtension({
    pageBlocks: [
        {
            id: 'emg-import-image-from-url-product',
            title: 'Paste image URL',
            location: {
                pageId: 'product-detail',
                column: 'main',
                position: {blockId: 'entity-assets', order: 'after'},
            },
            component: ({context}) => (
                <ImportMediaPanel productId={context.entity?.id} productName={context.entity?.name} />
            ),
            requiresPermission: ['CreateAsset', 'UpdateCatalog'],
        },
        {
            id: 'emg-import-image-from-url-assets',
            title: 'Paste image URL',
            location: {
                pageId: 'asset-list',
                column: 'main',
                position: {blockId: 'asset-list', order: 'after'},
            },
            component: () => <ImportMediaPanel />,
            requiresPermission: ['CreateAsset'],
        },
    ],
});
