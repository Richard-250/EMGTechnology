import gql from 'graphql-tag';

export const adminApiExtensions = gql`
    type CreateAssetFromImageUrlResult {
        asset: Asset!
        assignedToProduct: Boolean!
    }

    extend type Mutation {
        createAssetFromImageUrl(
            url: String!
            productId: ID
            featured: Boolean
        ): CreateAssetFromImageUrlResult!
    }
`;
