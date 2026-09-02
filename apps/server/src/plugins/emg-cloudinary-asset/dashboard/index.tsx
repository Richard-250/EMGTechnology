import {defineDashboardExtension} from '@vendure/dashboard';

import {ImportMediaPanel} from './import-media-panel';

defineDashboardExtension({
    pageBlocks: [
        {
            id: 'emg-import-image-from-url-product',
            title: 'Cloudinary media',
            location: {
                pageId: 'product-detail',
                column: 'main',
                position: {blockId: 'entity-assets', order: 'before'},
            },
            component: ({context}) => (
                <ImportMediaPanel productId={context.entity?.id} productName={context.entity?.name} />
            ),
            requiresPermission: ['CreateAsset', 'UpdateCatalog'],
        },
        {
            id: 'emg-import-image-from-url-assets',
            title: 'Cloudinary media',
            location: {
                pageId: 'asset-list',
                column: 'main',
                position: {blockId: 'asset-list', order: 'before'},
            },
            component: () => <ImportMediaPanel />,
            requiresPermission: ['CreateAsset'],
        },
    ],
});
