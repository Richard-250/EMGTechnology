import {defineDashboardExtension} from '@vendure/dashboard';

import {EmgAssetUploadPanel, EmgUploadAssetsButton} from './asset-upload-panel';
import {AutoSkuInput} from './auto-sku-input';
import {VariantNameQuickEditCell, VariantQuickEditor} from './variant-quick-editor';

defineDashboardExtension({
    detailForms: [
        {
            pageId: 'product-variant-detail',
            inputs: [
                {
                    blockId: 'main-form',
                    field: 'sku',
                    component: AutoSkuInput,
                },
            ],
        },
    ],
    actionBarItems: [
        {
            pageId: 'asset-list',
            requiresPermission: ['CreateAsset'],
            component: () => <EmgUploadAssetsButton />,
        },
    ],
    pageBlocks: [
        {
            id: 'emg-asset-upload-assets',
            title: 'Upload images',
            location: {
                pageId: 'asset-list',
                column: 'main',
                position: {blockId: 'asset-gallery', order: 'before'},
            },
            component: () => <EmgAssetUploadPanel />,
            requiresPermission: ['CreateAsset'],
        },
        {
            id: 'emg-asset-upload-product',
            title: 'Upload images',
            location: {
                pageId: 'product-detail',
                column: 'side',
                position: {blockId: 'assets', order: 'after'},
            },
            component: ({context}) => (
                <EmgAssetUploadPanel
                    productId={context.entity?.id}
                    productName={context.entity?.name}
                    existingAssetIds={(context.entity?.assets ?? []).map((asset: {id: string}) => asset.id)}
                />
            ),
            requiresPermission: ['CreateAsset', 'UpdateCatalog'],
        },
        {
            id: 'emg-variant-quick-editor',
            title: 'Quick variant editor',
            location: {
                pageId: 'product-detail',
                column: 'main',
                position: {blockId: 'product-variants-table', order: 'after'},
            },
            shouldRender: context => Boolean(context.entity?.variantList?.totalItems),
            component: ({context}) => (
                <div id="emg-variant-quick-editor">
                    <VariantQuickEditor context={context} />
                </div>
            ),
            requiresPermission: ['UpdateCatalog', 'UpdateProduct'],
        },
    ],
    dataTables: [
        {
            pageId: 'product-detail',
            blockId: 'product-variants-table',
            displayComponents: [
                {
                    column: 'name',
                    component: VariantNameQuickEditCell,
                },
            ],
        },
    ],
});
