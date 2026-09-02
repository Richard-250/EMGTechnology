import gql from 'graphql-tag';

export const adminApiExtensions = gql`
    enum CloudinaryMediaFolder {
        PRODUCTS
        CATEGORIES
        BANNERS
        USER_AVATARS
        BLOG
    }

    type CreateAssetFromImageUrlResult {
        asset: Asset!
        assignedToProduct: Boolean!
    }

    type UploadMediaToCloudinaryResult {
        asset: Asset!
        assignedToProduct: Boolean!
    }

    extend type Mutation {
        createAssetFromImageUrl(
            url: String!
            productId: ID
            featured: Boolean
            folder: CloudinaryMediaFolder
        ): CreateAssetFromImageUrlResult!

        uploadMediaToCloudinary(
            file: Upload!
            folder: CloudinaryMediaFolder!
            productId: ID
            featured: Boolean
        ): UploadMediaToCloudinaryResult!
    }
`;
