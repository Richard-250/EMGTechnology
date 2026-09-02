const CREATE_FROM_URL = `
    mutation CreateAssetFromImageUrl($url: String!, $productId: ID, $featured: Boolean, $folder: CloudinaryMediaFolder) {
        createAssetFromImageUrl(url: $url, productId: $productId, featured: $featured, folder: $folder) {
            assignedToProduct
            asset {
                id
                name
                preview
                source
                type
                customFields {
                    cloudinaryPublicId
                    cloudinarySecureUrl
                    cloudinaryResourceType
                    cloudinaryFormat
                    cloudinaryDuration
                }
            }
        }
    }
`;

const UPLOAD_MEDIA = `
    mutation UploadMediaToCloudinary($file: Upload!, $folder: CloudinaryMediaFolder!, $productId: ID, $featured: Boolean) {
        uploadMediaToCloudinary(file: $file, folder: $folder, productId: $productId, featured: $featured) {
            assignedToProduct
            asset {
                id
                name
                preview
                source
                type
                customFields {
                    cloudinaryPublicId
                    cloudinarySecureUrl
                    cloudinaryResourceType
                    cloudinaryFormat
                    cloudinaryDuration
                }
            }
        }
    }
`;

export type CloudinaryMediaFolder =
    | 'PRODUCTS'
    | 'CATEGORIES'
    | 'BANNERS'
    | 'USER_AVATARS'
    | 'BLOG';

async function adminJsonRequest<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await fetch('/admin-api', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({query, variables}),
    });

    const payload = (await response.json()) as {
        data?: T;
        errors?: Array<{message: string}>;
    };

    if (payload.errors?.length) {
        throw new Error(payload.errors.map(error => error.message).join('; '));
    }

    if (!payload.data) {
        throw new Error('Request failed — no data returned from admin API.');
    }

    return payload.data;
}

async function adminMultipartRequest<T>(
    query: string,
    variables: Record<string, unknown>,
    file?: File,
): Promise<T> {
    const formData = new FormData();
    const operations = JSON.stringify({
        query,
        variables: file ? {...variables, file: null} : variables,
    });
    formData.append('operations', operations);

    if (file) {
        formData.append('map', JSON.stringify({'0': ['variables.file']}));
        formData.append('0', file);
    }

    const response = await fetch('/admin-api', {
        method: 'POST',
        body: formData,
        credentials: 'include',
    });

    const payload = (await response.json()) as {
        data?: T;
        errors?: Array<{message: string}>;
    };

    if (payload.errors?.length) {
        throw new Error(payload.errors.map(error => error.message).join('; '));
    }

    if (!payload.data) {
        throw new Error('Upload failed — no data returned from admin API.');
    }

    return payload.data;
}

export async function createAssetFromImageUrl(input: {
    url: string;
    productId?: string;
    featured?: boolean;
    folder?: CloudinaryMediaFolder;
}) {
    return adminJsonRequest<{
        createAssetFromImageUrl: {
            assignedToProduct: boolean;
            asset: {id: string; name: string; preview: string; source: string; type: string};
        };
    }>(CREATE_FROM_URL, input);
}

export async function uploadMediaToCloudinary(input: {
    file: File;
    folder: CloudinaryMediaFolder;
    productId?: string;
    featured?: boolean;
}) {
    const {file, ...variables} = input;
    return adminMultipartRequest<{
        uploadMediaToCloudinary: {
            assignedToProduct: boolean;
            asset: {id: string; name: string; preview: string; source: string; type: string};
        };
    }>(UPLOAD_MEDIA, variables, file);
}
