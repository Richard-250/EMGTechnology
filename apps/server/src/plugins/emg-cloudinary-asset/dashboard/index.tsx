import {defineDashboardExtension} from '@vendure/dashboard';

import {ImportMediaPanel} from './import-media-panel';

/**
 * Optional paste-URL import only.
 * File uploads use the normal Vendure Assets control (local storage).
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
