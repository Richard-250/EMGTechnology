import {Button, api, graphql} from '@vendure/dashboard';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {Loader2, Upload} from 'lucide-react';
import {useRef, useState} from 'react';
import {toast} from 'sonner';

/**
 * Fast client prep: only touch oversized images, resize aggressively for speed.
 * Vendure/nginx still allow up to 50MB; we aim for ~1.5MB JPEGs for quick uploads.
 */
const TARGET_MAX_BYTES = 1.5 * 1024 * 1024;
const MAX_EDGE = 1600;
const SKIP_COMPRESS_BELOW = 900 * 1024;

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

type UploadPhase = 'idle' | 'preparing' | 'uploading' | 'finishing';

function isAssetResult(
    row: CreateAssetsResult['createAssets'][number],
): row is {id: string; name: string; preview: string; source: string; mimeType: string} {
    return typeof (row as {id?: string}).id === 'string' && !('errorCode' in row);
}

function formatUploadError(error: unknown): string {
    const msg = error instanceof Error ? error.message : String(error);
    if (/413|payload too large|entity too large|request entity/i.test(msg)) {
        return 'File too large for the server. Try a smaller image, or ask the host to raise nginx client_max_body_size.';
    }
    return msg || 'Could not upload image.';
}

function phaseLabel(phase: UploadPhase, count: number): string {
    if (phase === 'preparing') {
        return count > 1 ? `Preparing ${count} images…` : 'Preparing image…';
    }
    if (phase === 'uploading') {
        return count > 1 ? `Uploading ${count} images…` : 'Uploading image…';
    }
    if (phase === 'finishing') {
        return 'Finishing up…';
    }
    return 'Upload';
}

/** Fast resize + JPEG compress for large photos only. */
async function prepareFileForUpload(file: File): Promise<File> {
    if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
        return file;
    }
    if (file.size <= SKIP_COMPRESS_BELOW) {
        return file;
    }

    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));

        // Prefer OffscreenCanvas when available (faster, no layout thrash)
        const canvas =
            typeof OffscreenCanvas !== 'undefined'
                ? new OffscreenCanvas(width, height)
                : Object.assign(document.createElement('canvas'), {width, height});

        const ctx = canvas.getContext('2d') as
            | CanvasRenderingContext2D
            | OffscreenCanvasRenderingContext2D
            | null;
        if (!ctx) {
            bitmap.close();
            return file;
        }
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        let quality = 0.72;
        let blob: Blob | null = null;
        for (let i = 0; i < 4; i++) {
            if ('convertToBlob' in canvas) {
                blob = await (canvas as OffscreenCanvas).convertToBlob({
                    type: 'image/jpeg',
                    quality,
                });
            } else {
                blob = await new Promise<Blob | null>(resolve =>
                    (canvas as HTMLCanvasElement).toBlob(resolve, 'image/jpeg', quality),
                );
            }
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

async function uploadFiles(files: File[], onPhase: (phase: UploadPhase) => void) {
    onPhase('preparing');
    const prepared = await Promise.all(files.map(prepareFileForUpload));

    onPhase('uploading');
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
 * Fast Upload control for the Assets list (action bar).
 * Shows a clear loading state so admins know to wait a few seconds.
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
    const [phase, setPhase] = useState<UploadPhase>('idle');
    const [fileCount, setFileCount] = useState(0);
    const toastIdRef = useRef<string | number | null>(null);

    const busy = phase !== 'idle';

    const mutation = useMutation({
        mutationFn: async (files: File[]) => {
            setFileCount(files.length);
            toastIdRef.current = toast.loading(phaseLabel('preparing', files.length), {
                description: 'Please wait a few seconds. Do not close this page.',
            });

            const {created, errors} = await uploadFiles(files, nextPhase => {
                setPhase(nextPhase);
                if (toastIdRef.current != null) {
                    toast.loading(phaseLabel(nextPhase, files.length), {
                        id: toastIdRef.current,
                        description: 'Please wait a few seconds. Do not close this page.',
                    });
                }
            });

            if (!created.length) {
                throw new Error(errors.join('; ') || 'Upload failed.');
            }

            if (productId) {
                setPhase('finishing');
                if (toastIdRef.current != null) {
                    toast.loading(phaseLabel('finishing', files.length), {
                        id: toastIdRef.current,
                        description: 'Attaching images to the product…',
                    });
                }
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
            if (toastIdRef.current != null) {
                toast.success(
                    created.length === 1
                        ? `Uploaded “${created[0].name}”`
                        : `Uploaded ${created.length} images`,
                    {id: toastIdRef.current},
                );
            } else {
                toast.success(
                    created.length === 1
                        ? `Uploaded “${created[0].name}”`
                        : `Uploaded ${created.length} images`,
                );
            }
            if (errors.length) {
                toast.warning(`Some files failed: ${errors.join('; ')}`);
            }
            queryClient.invalidateQueries({queryKey: ['PaginatedListDataTable']});
            queryClient.invalidateQueries({queryKey: ['DetailPage']});
            queryClient.invalidateQueries({queryKey: ['asset-gallery']});
        },
        onError: (error: Error) => {
            if (toastIdRef.current != null) {
                toast.error(formatUploadError(error), {id: toastIdRef.current});
            } else {
                toast.error(formatUploadError(error));
            }
        },
        onSettled: () => {
            setPhase('idle');
            setFileCount(0);
            toastIdRef.current = null;
        },
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
                    setPhase('preparing');
                    mutation.mutate(files);
                }}
            />
            <div className="flex flex-col items-stretch gap-2 min-w-[9rem]">
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
                    {busy ? phaseLabel(phase, fileCount) : label}
                </Button>
                {busy && (
                    <p className="text-[11px] text-muted-foreground leading-snug max-w-[14rem]">
                        Upload in progress. This usually takes a few seconds.
                    </p>
                )}
            </div>
        </>
    );
}
