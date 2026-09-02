import {api, graphql} from '@vendure/dashboard';

export const createAssetFromImageUrlDocument = graphql(`
    mutation CreateAssetFromImageUrl($url: String!, $productId: ID, $featured: Boolean) {
        createAssetFromImageUrl(url: $url, productId: $productId, featured: $featured) {
            assignedToProduct
            asset {
                id
                name
                preview
                source
                customFields {
                    cloudinaryPublicId
                    cloudinarySecureUrl
                    sourceImageUrl
                }
            }
        }
    }
`);

export async function createAssetFromImageUrl(input: {
    url: string;
    productId?: string;
    featured?: boolean;
}) {
    return api.mutate(createAssetFromImageUrlDocument, input);
}
