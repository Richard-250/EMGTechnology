import {Button, api, graphql} from '@vendure/dashboard';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {Loader2, Upload} from 'lucide-react';
import {useRef, useState} from 'react';
import {toast} from 'sonner';

/** Target max encoded size before upload (keeps most phone photos under common nginx 1–2MB limits). */
const TARGET_MAX_BYTES = 1.5 * 1024 * 1024;
const MAX_EDGE = 1920;

const createAssetsDocument = graphql(`
    mutation EmgCreateAssets($input: [CreateAssetInput!]!) {
        createAssets(input: $input) {
            ... on Asset {
                id
                name
                preview
                source
                mimeType
            }
            ... on ErrorResult {
                errorCode
                message
            }
        }
    }
`);

const updateProductAssetsDocument = graphql(`
    mutation EmgAttachProductAssets($input: UpdateProductInput!) {
        updateProduct(input: $input) {
            id
            featuredAsset {
                id
            }
            assets {
                id
            }
        }
    }
`);

type CreateAssetsResult = {
    createAssets: Array<
        | {id: string; name: string; preview: string; source: string; mimeType: string}
        | {errorCode: string; message: string}
    >;
};

function isAssetResult(
    row: CreateAssetsResult['createAssets'][number],
): row is {id: string; name: string; preview: string; source: string; mimeType: string} {
    return typeof (row as {id?: string}).id === 'string' && !('errorCode' in row);
}

function formatUploadError(error: unknown): string {
    const msg = error instanceof Error ? error.message : String(error);
    if (/413|payload too large|entity too large|request entity/i.test(msg)) {
        return 'Upload blocked: file too large (HTTP 413). The image was compressed — if this continues, set nginx client_max_body_size 50m and reload nginx.';
    }
    return msg || 'Could not upload image.';
}

/**
 * Shrink large photos so multipart uploads fit typical reverse-proxy body limits.
 * Non-image files are returned unchanged.
 */
async function prepareFileForUpload(file: File): Promise<File> {
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
        return file;
    }
    if (file.size <= TARGET_MAX_BYTES) {
        return file;
    }

    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            bitmap.close();
            return file;
        }
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        let quality = 0.85;
        let blob: Blob | null = null;
        for (let i = 0; i < 6; i++) {
            blob = await new Promise<Blob | null>(resolve =>
                canvas.toBlob(resolve, 'image/jpeg', quality),
            );
            if (!blob || blob.size <= TARGET_MAX_BYTES) {
                break;
            }
            quality -= 0.1;
        }
        if (!blob) {
            return file;
        }

        const baseName = file.name.replace(/\.[^.]+$/, '') || 'upload';
        return new File([blob], `${baseName}.jpg`, {type: 'image/jpeg', lastModified: Date.now()});
    } catch {
        return file;
    }
}

async function uploadFiles(files: File[]) {
    const prepared = await Promise.all(files.map(prepareFileForUpload));
    const data = (await api.mutate(createAssetsDocument, {
        input: prepared.map(file => ({file})),
    })) as CreateAssetsResult;

    const created: Array<{id: string; name: string}> = [];
    const errors: string[] = [];

    for (const row of data.createAssets ?? []) {
        if (isAssetResult(row)) {
            created.push({id: row.id, name: row.name});
        } else if ('message' in row && row.message) {
            errors.push(row.message);
        } else {
            errors.push('Unknown upload error');
        }
    }

    return {created, errors};
}

/**
 * Single reliable Upload button for Assets / product pages.
 * Compresses large images client-side and surfaces clear errors (including HTTP 413).
 */
export function EmgUploadAssetsButton({
    productId,
    existingAssetIds = [],
    setFeatured = true,
    label = 'Upload',
}: {
    productId?: string;
    existingAssetIds?: string[];
    setFeatured?: boolean;
    label?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();
    const [busy, setBusy] = useState(false);

    const mutation = useMutation({
        mutationFn: async (files: File[]) => {
            if (!files.length) {
                throw new Error('No files selected.');
            }
            const {created, errors} = await uploadFiles(files);
            if (!created.length) {
                throw new Error(errors.join('; ') || 'Upload failed.');
            }

            if (productId) {
                const assetIds = Array.from(new Set([...existingAssetIds, ...created.map(a => a.id)]));
                await api.mutate(updateProductAssetsDocument, {
                    input: {
                        id: productId,
                        assetIds,
                        ...(setFeatured ? {featuredAssetId: created[0].id} : {}),
                    },
                });
            }

            return {created, errors};
        },
        onSuccess: ({created, errors}) => {
            toast.success(
                created.length === 1
                    ? `Uploaded “${created[0].name}”`
                    : `Uploaded ${created.length} images`,
            );
            if (errors.length) {
                toast.warning(`Some files failed: ${errors.join('; ')}`);
            }
            queryClient.invalidateQueries({queryKey: ['PaginatedListDataTable']});
            queryClient.invalidateQueries({queryKey: ['DetailPage']});
            queryClient.invalidateQueries({queryKey: ['asset-gallery']});
        },
        onError: (error: Error) => {
            toast.error(formatUploadError(error));
        },
        onSettled: () => setBusy(false),
    });

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.jpg,.jpeg,.png,.gif,.webp,.avif,.svg,.heic,.heif,.mp4,.webm"
                className="hidden"
                disabled={busy || mutation.isPending}
                onChange={event => {
                    const files = Array.from(event.target.files ?? []);
                    event.target.value = '';
                    if (!files.length) {
                        return;
                    }
                    setBusy(true);
                    mutation.mutate(files);
                }}
            />
            <Button
                type="button"
                variant="default"
                className="whitespace-nowrap"
                disabled={busy || mutation.isPending}
                onClick={() => inputRef.current?.click()}
            >
                {busy || mutation.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                    <Upload className="mr-2 size-4" />
                )}
                {label}
            </Button>
        </>
    );
}
