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
import {Link2, Loader2, Upload} from 'lucide-react';
import {useRef, useState} from 'react';
import {toast} from 'sonner';

import {
    createAssetFromImageUrl,
    type CloudinaryMediaFolder,
    uploadMediaToCloudinary,
} from './graphql';

const FOLDER_OPTIONS: Array<{value: CloudinaryMediaFolder; label: string}> = [
    {value: 'PRODUCTS', label: 'Products'},
    {value: 'CATEGORIES', label: 'Categories'},
    {value: 'BANNERS', label: 'Banners'},
    {value: 'USER_AVATARS', label: 'User avatars'},
    {value: 'BLOG', label: 'Blog'},
];

export function ImportMediaPanel({
    productId,
    productName,
}: {
    productId?: string;
    productName?: string;
}) {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
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
                    ? `Media added to ${productName ?? 'product'} via Cloudinary.`
                    : 'Media imported to Cloudinary.',
            );
            invalidate();
        },
        onError: (error: Error) => toast.error(error.message || 'Could not import from URL.'),
    });

    const fileMutation = useMutation({
        mutationFn: (file: File) =>
            uploadMediaToCloudinary({
                file,
                productId,
                featured: productId ? featured : false,
                folder: productId ? 'PRODUCTS' : folder,
            }),
        onSuccess: result => {
            const asset = result.uploadMediaToCloudinary.asset;
            setLastPreview(asset.preview);
            setLastSource(asset.source);
            setLastType(asset.type);
            toast.success(
                productId
                    ? `Uploaded to ${productName ?? 'product'} on Cloudinary.`
                    : 'Uploaded to Cloudinary asset library.',
            );
            invalidate();
        },
        onError: (error: Error) => toast.error(error.message || 'Upload failed.'),
    });

    const busy = urlMutation.isPending || fileMutation.isPending;

    return (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-start gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-electric/10 text-electric shrink-0">
                    <Upload className="size-4" />
                </span>
                <div>
                    <h3 className="font-semibold text-sm">Add product media (Cloudinary)</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Files and pasted online image URLs are stored on Cloudinary. Your database keeps only the
                        secure URL + metadata. The image stays visible in Assets / on the product — the binary is
                        not saved on this server.
                    </p>
                </div>
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
                <Label htmlFor="emg-media-file">Upload file (image or video)</Label>
                <Input
                    id="emg-media-file"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime"
                    disabled={busy}
                    onChange={event => {
                        const file = event.target.files?.[0];
                        if (file) {
                            fileMutation.mutate(file);
                            event.target.value = '';
                        }
                    }}
                />
                <p className="text-xs text-muted-foreground">Max 10 MB images, 100 MB videos.</p>
            </div>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or paste URL</span>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="emg-image-url">Paste image URL from the internet</Label>
                <Input
                    id="emg-image-url"
                    type="url"
                    placeholder="https://example.com/product-photo.jpg"
                    value={url}
                    disabled={busy}
                    onChange={event => setUrl(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                    We download it into Cloudinary, create an Asset in your library, and save only the Cloudinary URL
                    + metadata in the database.
                </p>
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
                Import pasted URL to Cloudinary + Assets
            </Button>

            {lastPreview ? (
                <div className="rounded-lg border border-border p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                        Last upload{lastType ? ` (${lastType.toLowerCase()})` : ''}
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
                            alt="Uploaded media preview"
                            className="max-h-40 rounded-md border border-border object-contain"
                        />
                    )}
                </div>
            ) : null}
        </div>
    );
}
