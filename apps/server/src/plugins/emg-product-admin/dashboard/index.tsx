import {defineDashboardExtension} from '@vendure/dashboard';

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
    pageBlocks: [
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
