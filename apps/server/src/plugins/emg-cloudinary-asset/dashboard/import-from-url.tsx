import {Button, Input, Label, Switch} from '@vendure/dashboard';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {ImagePlus, Link2, Loader2} from 'lucide-react';
import {useState} from 'react';
import {toast} from 'sonner';

import {createAssetFromImageUrl} from './graphql';

export function ImportImageFromUrl({
    productId,
    productName,
}: {
    productId?: string;
    productName?: string;
}) {
    const queryClient = useQueryClient();
    const [url, setUrl] = useState('');
    const [featured, setFeatured] = useState(true);
    const [lastPreview, setLastPreview] = useState<string | null>(null);

    const importMutation = useMutation({
        mutationFn: () =>
            createAssetFromImageUrl({
                url: url.trim(),
                productId,
                featured: productId ? featured : false,
            }),
        onSuccess: result => {
            const asset = result.createAssetFromImageUrl.asset;
            setLastPreview(asset.preview);
            setUrl('');
            toast.success(
                productId
                    ? `Image added to ${productName ?? 'product'} via Cloudinary.`
                    : 'Image imported to Cloudinary asset library.',
            );
            queryClient.invalidateQueries({queryKey: ['DetailPage']});
            queryClient.invalidateQueries({queryKey: ['PaginatedListDataTable']});
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Could not import image from URL.');
        },
    });

    return (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-start gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-electric/10 text-electric shrink-0">
                    <Link2 className="size-4" />
                </span>
                <div>
                    <h3 className="font-semibold text-sm">Import image from URL</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Paste any public image link. We upload it to Cloudinary and save the link and metadata in
                        your asset library{productId ? ' for this product' : ''}.
                    </p>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="emg-image-url">Image URL</Label>
                <Input
                    id="emg-image-url"
                    type="url"
                    placeholder="https://example.com/product-photo.jpg"
                    value={url}
                    onChange={event => setUrl(event.target.value)}
                />
            </div>

            {productId ? (
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <div>
                        <p className="text-sm font-medium">Set as featured image</p>
                        <p className="text-xs text-muted-foreground">Use this as the main product photo.</p>
                    </div>
                    <Switch checked={featured} onCheckedChange={setFeatured} />
                </div>
            ) : null}

            <Button
                type="button"
                className="w-full"
                disabled={!url.trim() || importMutation.isPending}
                onClick={() => importMutation.mutate()}
            >
                {importMutation.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                    <ImagePlus className="mr-2 size-4" />
                )}
                Import to Cloudinary
            </Button>

            {lastPreview ? (
                <div className="rounded-lg border border-border p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Last imported preview</p>
                    <img
                        src={lastPreview}
                        alt="Imported asset preview"
                        className="max-h-40 rounded-md border border-border object-contain"
                    />
                </div>
            ) : null}
        </div>
    );
}
