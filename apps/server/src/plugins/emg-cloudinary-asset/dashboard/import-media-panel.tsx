import {
    Button,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Switch,
} from '@vendure/dashboard';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {Link2, Loader2} from 'lucide-react';
import {useState} from 'react';
import {toast} from 'sonner';

import {createAssetFromImageUrl, type CloudinaryMediaFolder} from './graphql';

const FOLDER_OPTIONS: Array<{value: CloudinaryMediaFolder; label: string}> = [
    {value: 'PRODUCTS', label: 'Products'},
    {value: 'CATEGORIES', label: 'Categories'},
    {value: 'BANNERS', label: 'Banners'},
    {value: 'USER_AVATARS', label: 'User avatars'},
    {value: 'BLOG', label: 'Blog'},
];

/**
 * Optional helper: paste a public image URL.
 * Normal file uploads use the standard Vendure Assets UI (Cloudinary storage behind the scenes).
 */
export function ImportMediaPanel({
    productId,
    productName,
}: {
    productId?: string;
    productName?: string;
}) {
    const queryClient = useQueryClient();
    const [url, setUrl] = useState('');
    const [featured, setFeatured] = useState(true);
    const [folder, setFolder] = useState<CloudinaryMediaFolder>('PRODUCTS');
    const [lastPreview, setLastPreview] = useState<string | null>(null);
    const [lastSource, setLastSource] = useState<string | null>(null);
    const [lastType, setLastType] = useState<string | null>(null);

    const invalidate = () => {
        queryClient.invalidateQueries({queryKey: ['DetailPage']});
        queryClient.invalidateQueries({queryKey: ['PaginatedListDataTable']});
    };

    const urlMutation = useMutation({
        mutationFn: () =>
            createAssetFromImageUrl({
                url: url.trim(),
                productId,
                featured: productId ? featured : false,
                folder: productId ? 'PRODUCTS' : folder,
            }),
        onSuccess: result => {
            const asset = result.createAssetFromImageUrl.asset;
            setLastPreview(asset.preview);
            setLastSource(asset.source);
            setLastType(asset.type);
            setUrl('');
            toast.success(
                productId
                    ? `Image URL imported for ${productName ?? 'product'}.`
                    : 'Image URL imported to Assets.',
            );
            invalidate();
        },
        onError: (error: Error) => toast.error(error.message || 'Could not import from URL.'),
    });

    const busy = urlMutation.isPending;

    return (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div>
                <h3 className="font-semibold text-sm">Paste image URL (optional)</h3>
                <p className="text-xs text-muted-foreground mt-1">
                    To upload a file from your computer, use the normal Assets upload above. This box is only for
                    pasting a public image link from the internet.
                </p>
            </div>

            {!productId ? (
                <div className="space-y-2">
                    <Label>Media folder</Label>
                    <Select value={folder} onValueChange={value => setFolder(value as CloudinaryMediaFolder)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {FOLDER_OPTIONS.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ) : null}

            <div className="space-y-2">
                <Label htmlFor="emg-image-url">Image URL</Label>
                <Input
                    id="emg-image-url"
                    type="url"
                    placeholder="https://example.com/product-photo.jpg"
                    value={url}
                    disabled={busy}
                    onChange={event => setUrl(event.target.value)}
                />
            </div>

            {productId ? (
                <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <div>
                        <p className="text-sm font-medium">Set as featured image</p>
                        <p className="text-xs text-muted-foreground">Use as the main product photo when supported.</p>
                    </div>
                    <Switch checked={featured} onCheckedChange={setFeatured} />
                </div>
            ) : null}

            <Button
                type="button"
                className="w-full"
                disabled={!url.trim() || busy}
                onClick={() => urlMutation.mutate()}
            >
                {urlMutation.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                    <Link2 className="mr-2 size-4" />
                )}
                Import URL
            </Button>

            {lastPreview ? (
                <div className="rounded-lg border border-border p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                        Last import{lastType ? ` (${lastType.toLowerCase()})` : ''}
                    </p>
                    {lastType === 'VIDEO' ? (
                        <video
                            src={lastSource || lastPreview}
                            poster={lastPreview}
                            controls
                            className="max-h-40 w-full rounded-md border border-border"
                        />
                    ) : (
                        <img
                            src={lastPreview}
                            alt="Imported media preview"
                            className="max-h-40 rounded-md border border-border object-contain"
                        />
                    )}
                </div>
            ) : null}
        </div>
    );
}
