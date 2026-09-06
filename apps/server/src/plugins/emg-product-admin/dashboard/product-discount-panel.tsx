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
    api,
    graphql,
} from '@vendure/dashboard';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Percent, Tag} from 'lucide-react';
import {useEffect, useState} from 'react';
import {toast} from 'sonner';

const productDiscountDocument = graphql(`
    query EmgProductDiscount($id: ID!) {
        product(id: $id) {
            id
            name
            customFields {
                isDiscounted
                discountType
                discountPercentage
                discountAmount
                originalPrice
            }
            variantList {
                items {
                    id
                    name
                    price
                    priceWithTax
                    currencyCode
                }
            }
        }
    }
`);

const updateProductDiscountDocument = graphql(`
    mutation EmgUpdateProductDiscount($input: UpdateProductInput!) {
        updateProduct(input: $input) {
            id
            customFields {
                isDiscounted
                discountType
                discountPercentage
                discountAmount
                originalPrice
            }
        }
    }
`);

/**
 * Product-level Super Deal / discount controls.
 * Adding a Super Deal only sets this product's isDiscounted flag — it never clears other deals.
 */
export function ProductDiscountPanel({context}: {context: {entity?: {id?: string}}}) {
    const productId = context.entity?.id;
    const queryClient = useQueryClient();

    const [isDiscounted, setIsDiscounted] = useState(false);
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountPercentage, setDiscountPercentage] = useState('');
    const [discountAmount, setDiscountAmount] = useState('');
    const [originalPrice, setOriginalPrice] = useState('');

    const productQuery = useQuery({
        queryKey: ['emg-product-discount', productId],
        queryFn: async () => api.query(productDiscountDocument, {id: productId!}),
        enabled: Boolean(productId),
    });

    useEffect(() => {
        const product = productQuery.data?.product;
        if (!product) return;
        const cf = product.customFields ?? {};
        setIsDiscounted(cf.isDiscounted === true);
        setDiscountType(cf.discountType === 'fixed' ? 'fixed' : 'percentage');
        setDiscountPercentage(
            cf.discountPercentage != null && cf.discountPercentage > 0
                ? String(cf.discountPercentage)
                : '',
        );
        setDiscountAmount(
            cf.discountAmount != null && cf.discountAmount > 0 ? String(cf.discountAmount) : '',
        );

        const variants = product.variantList?.items ?? [];
        const maxMinor = Math.max(
            0,
            ...variants.map((v: {priceWithTax?: number; price?: number}) => v.priceWithTax ?? v.price ?? 0),
        );
        const autoOriginal = maxMinor > 0 ? Math.round(maxMinor / 100) : 0;
        setOriginalPrice(
            cf.originalPrice != null && cf.originalPrice > 0
                ? String(cf.originalPrice)
                : autoOriginal > 0
                  ? String(autoOriginal)
                  : '',
        );
    }, [productQuery.data]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const pct = discountPercentage.trim() === '' ? null : Number(discountPercentage);
            const amt = discountAmount.trim() === '' ? null : Number(discountAmount);
            let orig = originalPrice.trim() === '' ? null : Number(originalPrice);

            if ((isDiscounted || (pct != null && pct > 0) || (amt != null && amt > 0)) && (!orig || orig <= 0)) {
                const variants = productQuery.data?.product?.variantList?.items ?? [];
                const maxMinor = Math.max(
                    0,
                    ...variants.map(
                        (v: {priceWithTax?: number; price?: number}) => v.priceWithTax ?? v.price ?? 0,
                    ),
                );
                orig = maxMinor > 0 ? Math.round(maxMinor / 100) : null;
            }

            return api.mutate(updateProductDiscountDocument, {
                input: {
                    id: productId,
                    customFields: {
                        isDiscounted,
                        discountType,
                        discountPercentage:
                            discountType === 'percentage' && pct != null && !Number.isNaN(pct)
                                ? pct
                                : null,
                        discountAmount:
                            discountType === 'fixed' && amt != null && !Number.isNaN(amt) ? amt : null,
                        originalPrice: orig != null && !Number.isNaN(orig) ? orig : null,
                    },
                },
            });
        },
        onSuccess: async () => {
            toast.success(
                isDiscounted
                    ? 'Super Deal saved. Other Super Deals were left unchanged.'
                    : 'Discount settings saved',
            );
            await queryClient.invalidateQueries({queryKey: ['emg-product-discount', productId]});
            await queryClient.invalidateQueries({queryKey: ['DetailPage']});
        },
        onError: (error: Error) => {
            toast.error('Failed to save discount', {description: error.message});
        },
    });

    if (!productId) {
        return null;
    }

    const variants = productQuery.data?.product?.variantList?.items ?? [];
    const maxMinor = Math.max(
        0,
        ...variants.map((v: {priceWithTax?: number; price?: number}) => v.priceWithTax ?? v.price ?? 0),
    );
    const fetchedPriceLabel =
        maxMinor > 0
            ? `${Math.round(maxMinor / 100).toLocaleString()} (from variants)`
            : 'Not set yet';

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                This is the only place to set Super Deals for this product. Choose percentage or
                fixed discount. Original price fills in from the variant price automatically.
                Enabling Super Deal adds this product to the deals list without removing others.
            </p>

            <div className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-muted/40 px-3 py-2">
                <div className="min-w-0">
                    <Label htmlFor="emg-super-deal">Super Deal</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Feature on homepage /deals until you turn this off.
                    </p>
                </div>
                <Switch id="emg-super-deal" checked={isDiscounted} onCheckedChange={setIsDiscounted} />
            </div>

            <div className="grid gap-2">
                <Label>Discount type</Label>
                <Select
                    value={discountType}
                    onValueChange={value => setDiscountType(value as 'percentage' | 'fixed')}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed amount</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {discountType === 'percentage' ? (
                <div className="grid gap-2">
                    <Label htmlFor="emg-discount-pct">Percentage off</Label>
                    <Input
                        id="emg-discount-pct"
                        type="number"
                        min={1}
                        max={99}
                        placeholder="e.g. 20"
                        value={discountPercentage}
                        onChange={e => setDiscountPercentage(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Applied independently per variant from that variant&apos;s current price
                        (e.g. 10,000 and 15,000 each get 20% off).
                    </p>
                </div>
            ) : (
                <div className="grid gap-2">
                    <Label htmlFor="emg-discount-amt">Fixed amount off (major units)</Label>
                    <Input
                        id="emg-discount-amt"
                        type="number"
                        min={1}
                        placeholder="e.g. 5000"
                        value={discountAmount}
                        onChange={e => setDiscountAmount(e.target.value)}
                    />
                </div>
            )}

            <div className="grid gap-2">
                <Label htmlFor="emg-original-price">Original / list price</Label>
                <Input
                    id="emg-original-price"
                    type="number"
                    min={0}
                    value={originalPrice}
                    onChange={e => setOriginalPrice(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                    Auto-fetched from variants: {fetchedPriceLabel}. Override only if needed.
                </p>
            </div>

            <Button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
            >
                {discountType === 'percentage' ? (
                    <Percent className="mr-2 size-4" />
                ) : (
                    <Tag className="mr-2 size-4" />
                )}
                {saveMutation.isPending ? 'Saving…' : 'Save discount / Super Deal'}
            </Button>
        </div>
    );
}
