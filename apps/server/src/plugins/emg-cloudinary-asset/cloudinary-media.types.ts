import type {CloudinaryMediaFolderKey} from './cloudinary.constants';

export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    url: string;
    format: string;
    width?: number;
    height?: number;
    bytes: number;
    resource_type: 'image' | 'video' | 'raw' | string;
    folder?: string;
    duration?: number;
    created_at?: string;
}

export interface CloudinaryMediaMetadata {
    cloudinaryPublicId: string;
    cloudinarySecureUrl: string;
    cloudinaryResourceType: string;
    cloudinaryFormat: string;
    cloudinaryFolder: string;
    cloudinaryDuration?: number | null;
    sourceImageUrl?: string | null;
}

export interface CreateCloudinaryMediaOptions {
    productId?: string | number;
    featured?: boolean;
    folder: CloudinaryMediaFolderKey;
    sourceUrl?: string;
}

export interface GraphqlUploadFile {
    createReadStream: () => NodeJS.ReadableStream;
    filename: string;
    mimetype: string;
    encoding: string;
}
