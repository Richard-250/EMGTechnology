import {Button, api, graphql} from '@vendure/dashboard';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {Loader2, Upload} from 'lucide-react';
import {useRef, useState} from 'react';
import {toast} from 'sonner';

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
        | {id: string; name: string; preview: string; source: string; mimeType: string; message?: undefined}
        | {errorCode: string; message: string; id?: undefined}
    >;
};

function isAssetResult(
    row: CreateAssetsResult['createAssets'][number],
): row is {id: string; name: string; preview: string; source: string; mimeType: string} {
    return typeof (row as {id?: string}).id === 'string' && !('errorCode' in row);
}

async function uploadFiles(files: File[]) {
    const data = (await api.mutate(createAssetsDocument, {
        input: files.map(file => ({file})),
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
 * Reliable asset uploader with visible success/error toasts.
 * Built-in AssetGallery upload can fail silently when createAssets returns MimeTypeError.
 */
export function EmgUploadAssetsButton({
    productId,
    existingAssetIds = [],
    setFeatured = true,
}: {
    productId?: string;
    existingAssetIds?: string[];
    setFeatured?: boolean;
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
            toast.error(error.message || 'Could not upload image.');
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
                disabled={busy || mutation.isPending}
                onClick={() => inputRef.current?.click()}
            >
                {busy || mutation.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                    <Upload className="mr-2 size-4" />
                )}
                Upload images
            </Button>
        </>
    );
}

export function EmgAssetUploadPanel({
    productId,
    productName,
    existingAssetIds = [],
}: {
    productId?: string;
    productName?: string;
    existingAssetIds?: string[];
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div>
                <h3 className="font-semibold text-sm">Upload images</h3>
                <p className="text-xs text-muted-foreground mt-1">
                    {productId
                        ? `Add photos for ${productName ?? 'this product'} from your computer. You’ll see a clear success or error message.`
                        : 'Choose image files from your computer. You’ll see a clear success or error message if something fails.'}
                </p>
            </div>
            <EmgUploadAssetsButton productId={productId} existingAssetIds={existingAssetIds} />
        </div>
    );
}
