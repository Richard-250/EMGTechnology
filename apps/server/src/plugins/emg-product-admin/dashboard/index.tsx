import {defineDashboardExtension} from '@vendure/dashboard';
import {Calculator} from 'lucide-react';

import {EmgUploadAssetsButton} from './asset-upload-panel';
import {AutoSkuInput} from './auto-sku-input';
import {ExchangeRateCalculatorPage} from './exchange-rate-page';
import {HiddenCustomField} from './hidden-custom-field';
import {ProductDiscountPanel} from './product-discount-panel';
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
            // Hide duplicate native Super Deal custom fields — use Discount / Super Deal panel only
            pageId: 'product-detail',
            inputs: [
                {blockId: 'custom-fields', field: 'isDiscounted', component: HiddenCustomField},
                {blockId: 'custom-fields', field: 'discountType', component: HiddenCustomField},
                {blockId: 'custom-fields', field: 'discountPercentage', component: HiddenCustomField},
                {blockId: 'custom-fields', field: 'discountAmount', component: HiddenCustomField},
                {blockId: 'custom-fields', field: 'originalPrice', component: HiddenCustomField},
            ],
        },
        {
            pageId: 'product-variant-detail',
            inputs: [
                {
                    blockId: 'main-form',
                    field: 'sku',
                    component: AutoSkuInput,
                },
                {
                    blockId: 'custom-fields',
                    field: 'variantDiscountPercentage',
                    component: HiddenCustomField,
                },
                {
                    blockId: 'custom-fields',
                    field: 'variantDiscountAmount',
                    component: HiddenCustomField,
                },
                {
                    blockId: 'custom-fields',
                    field: 'variantOriginalPrice',
                    component: HiddenCustomField,
                },
            ],
        },
    ],
    actionBarItems: [
        {
            pageId: 'asset-list',
            id: 'emg-upload-assets',
            requiresPermission: ['CreateAsset'],
            position: {itemId: 'upload-assets-button', order: 'replace'},
            component: () => <EmgUploadAssetsButton label="Upload" />,
        },
    ],
    pageBlocks: [
        {
            id: 'emg-product-discount',
            title: 'Discount / Super Deal',
            location: {
                pageId: 'product-detail',
                column: 'side',
                position: {blockId: 'assets', order: 'after'},
            },
            shouldRender: context => Boolean(context.entity?.id),
            component: ({context}) => <ProductDiscountPanel context={context} />,
            requiresPermission: ['UpdateCatalog', 'UpdateProduct'],
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
        {
            id: 'emg-payment-method-merchant-help',
            title: 'Customer checkout display',
            location: {
                pageId: 'payment-method-detail',
                column: 'side',
                position: {blockId: 'main-form', order: 'after'},
            },
            component: () => (
                <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                        Edit the custom fields (registered name, MoMo / payment phone, USSD code,
                        instructions) and the Enabled toggle. Customers see these values at
                        checkout when they choose MTN or Airtel. Only admins can change them.
                    </p>
                    <p>
                        MTN and Airtel stay in “awaiting confirmation” until you settle the
                        payment on the order in the Orders dashboard.
                    </p>
                </div>
            ),
            requiresPermission: ['UpdateSettings', 'UpdatePaymentMethod'],
        },
        {
            id: 'emg-shipping-method-checkout-help',
            title: 'Checkout availability',
            location: {
                pageId: 'shipping-method-detail',
                column: 'side',
                position: {blockId: 'main-form', order: 'after'},
            },
            component: () => (
                <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                        New shipping methods appear automatically at customer checkout when they
                        are eligible (checker, channel, and not deleted). No storefront code
                        changes are required.
                    </p>
                    <p>
                        Set name, description, and price here. Soft-delete a method to remove it
                        from checkout.
                    </p>
                </div>
            ),
            requiresPermission: ['UpdateSettings', 'UpdateShippingMethod'],
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
