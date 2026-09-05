import {defineDashboardExtension} from '@vendure/dashboard';
import {Calculator} from 'lucide-react';

import {EmgUploadAssetsButton} from './asset-upload-panel';
import {AutoSkuInput} from './auto-sku-input';
import {ExchangeRateCalculatorPage} from './exchange-rate-page';
import {VariantNameQuickEditCell, VariantQuickEditor} from './variant-quick-editor';

defineDashboardExtension({
    routes: [
        {
            path: '/exchange-rate',
            component: () => <ExchangeRateCalculatorPage />,
            navMenuItem: {
                id: 'emg-exchange-rate',
                title: 'Exchange rate',
                sectionId: 'settings',
                icon: Calculator,
                requiresPermission: ['UpdateSettings', 'UpdateCatalog', 'UpdateProduct'],
            },
        },
    ],
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
            // One Upload button on Assets — replaces the built-in gallery upload control.
            pageId: 'asset-list',
            id: 'emg-upload-assets',
            requiresPermission: ['CreateAsset'],
            position: {itemId: 'upload-assets-button', order: 'replace'},
            component: () => <EmgUploadAssetsButton label="Upload" />,
        },
    ],
    pageBlocks: [
        {
            // One Upload button on product Assets sidebar.
            id: 'emg-asset-upload-product',
            title: 'Upload',
            location: {
                pageId: 'product-detail',
                column: 'side',
                position: {blockId: 'assets', order: 'after'},
            },
            component: ({context}) => (
                <EmgUploadAssetsButton
                    label="Upload"
                    productId={context.entity?.id}
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
