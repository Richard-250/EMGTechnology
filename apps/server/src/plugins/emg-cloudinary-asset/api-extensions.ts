import gql from 'graphql-tag';

export const shopApiExtensions = gql`
    type UploadPaymentProofResult {
        url: String!
    }

    extend type Mutation {
        """
        Upload a MoMo/Airtel payment screenshot from checkout. Returns a public image URL
        stored on Cloudinary for staff review.
        """
        uploadPaymentProof(
            fileBase64: String!
            fileName: String!
            mimeType: String!
        ): UploadPaymentProofResult!
    }
`;

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
