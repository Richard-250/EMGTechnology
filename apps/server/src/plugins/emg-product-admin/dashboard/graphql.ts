import {api, graphql} from '@vendure/dashboard';

export const emgProductVariantsDocument = graphql(`
    query EmgProductVariants($productId: ID!) {
        product(id: $productId) {
            id
            name
            translations {
                name
                slug
            }
            variantList {
                items {
                    id
                    name
                    sku
                    enabled
                    price
                    priceWithTax
                    currencyCode
                }
            }
        }
    }
`);

export const emgVariantDetailDocument = graphql(`
    query EmgVariantDetail($id: ID!) {
        productVariant(id: $id) {
            id
            name
            sku
            enabled
            price
            currencyCode
            taxCategory {
                id
                name
            }
            prices {
                currencyCode
                price
            }
            stockLevels {
                stockOnHand
                stockLocation {
                    id
                    name
                }
            }
            product {
                id
                name
                translations {
                    name
                    slug
                }
            }
            options {
                code
            }
            translations {
                languageCode
                name
            }
        }
    }
`);

export const emgTaxCategoriesDocument = graphql(`
    query EmgTaxCategories {
        taxCategories {
            items {
                id
                name
                isDefault
            }
        }
    }
`);

export const emgUpdateVariantDocument = graphql(`
    mutation EmgUpdateVariant($input: UpdateProductVariantInput!) {
        updateProductVariant(input: $input) {
            id
            name
            sku
            price
            priceWithTax
        }
    }
`);

export const emgExchangeRateDocument = graphql(`
    query EmgExchangeRateQuick {
        emgExchangeRate {
            rwfPerUsd
        }
    }
`);

export async function fetchProductVariants(productId: string) {
    return api.query(emgProductVariantsDocument, {productId});
}

export async function fetchVariantDetail(variantId: string) {
    return api.query(emgVariantDetailDocument, {id: variantId});
}

export async function fetchTaxCategories() {
    return api.query(emgTaxCategoriesDocument, {});
}

export async function fetchExchangeRate() {
    return api.query(emgExchangeRateDocument, {});
}

export async function updateVariant(input: Record<string, unknown>) {
    return api.mutate(emgUpdateVariantDocument, {input});
}
