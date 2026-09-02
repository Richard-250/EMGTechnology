/** Max upload size: 10 MB images, 100 MB videos */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

export const ALLOWED_IMAGE_MIMES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
]);

export const ALLOWED_VIDEO_MIMES = new Set([
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
]);

export const CLOUDINARY_FOLDER_PREFIX = 'emg';

export const MEDIA_FOLDERS = {
    products: 'products',
    categories: 'categories',
    banners: 'banners',
    userAvatars: 'users/avatars',
    blog: 'blog',
} as const;

export type CloudinaryMediaFolderKey = keyof typeof MEDIA_FOLDERS;
