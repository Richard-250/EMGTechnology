import {defineDashboardExtension} from '@vendure/dashboard';

import {ImportImageFromUrl} from './import-from-url';

defineDashboardExtension({
    pageBlocks: [
        {
            id: 'emg-import-image-from-url-product',
            title: 'Import from URL',
            location: {
                pageId: 'product-detail',
                column: 'main',
                position: {blockId: 'entity-assets', order: 'before'},
            },
            component: ({context}) => (
                <ImportImageFromUrl
                    productId={context.entity?.id}
                    productName={context.entity?.name}
                />
            ),
            requiresPermission: ['CreateAsset', 'UpdateCatalog'],
        },
        {
            id: 'emg-import-image-from-url-assets',
            title: 'Import from URL',
            location: {
                pageId: 'asset-list',
                column: 'main',
                position: {blockId: 'asset-list', order: 'before'},
            },
            component: () => <ImportImageFromUrl />,
            requiresPermission: ['CreateAsset'],
        },
    ],
});
