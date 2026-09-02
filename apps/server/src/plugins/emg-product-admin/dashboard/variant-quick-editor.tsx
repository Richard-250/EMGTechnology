import {CellContext} from '@tanstack/react-table';
import {
    Button,
    Input,
    Label,
    MoneyInput,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Switch,
    useChannel,
} from '@vendure/dashboard';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Pencil} from 'lucide-react';
import {useEffect, useState} from 'react';
import {toast} from 'sonner';

import {generateProductSku} from './generate-sku';
import {
    fetchProductVariants,
    fetchTaxCategories,
    fetchVariantDetail,
    updateVariant,
} from './graphql';

export const EMG_SELECT_VARIANT_EVENT = 'emg-select-variant';

type VariantListItem = {
    id: string;
    name: string;
    sku: string;
    enabled: boolean;
    price: number;
    priceWithTax: number;
    currencyCode: string;
};

export function VariantQuickEditor({context}: {context: {entity?: {id?: string; name?: string}}}) {
    const productId = context.entity?.id;
    const queryClient = useQueryClient();
    const {activeChannel} = useChannel();
    const [selectedVariantId, setSelectedVariantId] = useState<string>('');
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [enabled, setEnabled] = useState(true);
    const [price, setPrice] = useState(0);
    const [taxCategoryId, setTaxCategoryId] = useState('');
    const [stockLevels, setStockLevels] = useState<Array<{stockLocationId: string; stockOnHand: number; label: string}>>([]);

    const currencyCode = activeChannel?.defaultCurrencyCode ?? 'USD';

    const variantsQuery = useQuery({
        queryKey: ['emg-product-variants', productId],
        queryFn: () => fetchProductVariants(productId!),
        enabled: Boolean(productId),
    });

    const variantDetailQuery = useQuery({
        queryKey: ['emg-variant-detail', selectedVariantId],
        queryFn: () => fetchVariantDetail(selectedVariantId),
        enabled: Boolean(selectedVariantId),
    });

    const taxCategoriesQuery = useQuery({
        queryKey: ['emg-tax-categories'],
        queryFn: fetchTaxCategories,
    });

    const saveMutation = useMutation({
        mutationFn: updateVariant,
        onSuccess: async () => {
            toast.success('Variant updated');
            await queryClient.invalidateQueries({queryKey: ['emg-product-variants', productId]});
            await queryClient.invalidateQueries({queryKey: ['emg-variant-detail', selectedVariantId]});
            await queryClient.invalidateQueries({queryKey: ['PaginatedListDataTable']});
        },
        onError: (error: Error) => {
            toast.error('Failed to update variant', {description: error.message});
        },
    });

    const variants = (variantsQuery.data?.product?.variantList?.items ?? []) as VariantListItem[];

    useEffect(() => {
        const handler = (event: Event) => {
            const customEvent = event as CustomEvent<string>;
            if (customEvent.detail) {
                setSelectedVariantId(customEvent.detail);
            }
        };
        window.addEventListener(EMG_SELECT_VARIANT_EVENT, handler);
        return () => window.removeEventListener(EMG_SELECT_VARIANT_EVENT, handler);
    }, []);

    useEffect(() => {
        const variant = variantDetailQuery.data?.productVariant;
        if (!variant) {
            return;
        }

        setName(variant.name ?? '');
        setSku(variant.sku ?? '');
        setEnabled(variant.enabled ?? true);
        setTaxCategoryId(variant.taxCategory?.id ?? '');

        const channelPrice =
            variant.prices?.find((entry: {currencyCode: string}) => entry.currencyCode === currencyCode)?.price ??
            variant.price ??
            0;
        setPrice(channelPrice);

        setStockLevels(
            (variant.stockLevels ?? []).map((level: {stockOnHand: number; stockLocation: {id: string; name: string}}) => ({
                stockLocationId: level.stockLocation.id,
                stockOnHand: level.stockOnHand,
                label: level.stockLocation.name,
            })),
        );
    }, [variantDetailQuery.data, currencyCode]);

    if (!productId) {
        return null;
    }

    const handleGenerateSku = () => {
        const variant = variantDetailQuery.data?.productVariant;
        if (!variant) {
            return;
        }

        setSku(
            generateProductSku({
                productName: variant.product?.translations?.[0]?.name ?? variant.product?.name,
                productSlug: variant.product?.translations?.[0]?.slug,
                variantName: name,
                optionCodes: variant.options?.map((option: {code: string}) => option.code),
                variantId: variant.id,
            }),
        );
    };

    const handleSave = async () => {
        if (!selectedVariantId) {
            return;
        }

        const variant = variantDetailQuery.data?.productVariant;
        const prices = (variant?.prices ?? []).map((entry: {currencyCode: string; price: number}) => ({
            currencyCode: entry.currencyCode,
            price: entry.currencyCode === currencyCode ? price : entry.price,
        }));

        if (!prices.some((entry: {currencyCode: string}) => entry.currencyCode === currencyCode)) {
            prices.push({currencyCode, price});
        }

        await saveMutation.mutateAsync({
            id: selectedVariantId,
            enabled,
            sku,
            taxCategoryId,
            prices,
            translations: (variant?.translations ?? []).map((translation: {languageCode: string; name: string}) => ({
                languageCode: translation.languageCode,
                name: translation.languageCode === variant?.translations?.[0]?.languageCode ? name : translation.name,
            })),
            stockLevels: stockLevels.map(level => ({
                stockLocationId: level.stockLocationId,
                stockOnHand: level.stockOnHand,
            })),
        });
    };

    const taxCategories = taxCategoriesQuery.data?.taxCategories?.items ?? [];

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Edit price, tax, stock, SKU, and name here without leaving the product page. Click a variant name in the table above to load it.
            </p>

            <div className="grid gap-2">
                <Label htmlFor="emg-variant-select">Variant</Label>
                <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
                    <SelectTrigger id="emg-variant-select">
                        <SelectValue placeholder="Select a variant to edit" />
                    </SelectTrigger>
                    <SelectContent>
                        {variants.map(variant => (
                            <SelectItem key={variant.id} value={variant.id}>
                                {variant.name} ({variant.sku || 'no SKU'})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {selectedVariantId && (
                <div className="grid gap-4 rounded-lg border border-border p-4">
                    <div className="grid gap-2">
                        <Label htmlFor="emg-variant-name">Variant name</Label>
                        <Input id="emg-variant-name" value={name} onChange={event => setName(event.target.value)} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="emg-variant-sku">SKU</Label>
                        <div className="flex gap-2">
                            <Input id="emg-variant-sku" value={sku} onChange={event => setSku(event.target.value)} />
                            <Button type="button" variant="outline" onClick={handleGenerateSku}>
                                Generate
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="emg-variant-enabled">Enabled</Label>
                        <Switch id="emg-variant-enabled" checked={enabled} onCheckedChange={setEnabled} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="emg-variant-price">Price ({currencyCode})</Label>
                        <MoneyInput
                            id="emg-variant-price"
                            value={price}
                            currency={currencyCode}
                            onChange={setPrice}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="emg-variant-tax">Tax category</Label>
                        <Select value={taxCategoryId} onValueChange={setTaxCategoryId}>
                            <SelectTrigger id="emg-variant-tax">
                                <SelectValue placeholder="Select tax category" />
                            </SelectTrigger>
                            <SelectContent>
                                {taxCategories.map((category: {id: string; name: string}) => (
                                    <SelectItem key={category.id} value={category.id}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {stockLevels.length > 0 && (
                        <div className="grid gap-3">
                            <Label>Stock</Label>
                            {stockLevels.map((level, index) => (
                                <div key={level.stockLocationId} className="grid gap-1">
                                    <Label htmlFor={`emg-stock-${level.stockLocationId}`}>{level.label}</Label>
                                    <Input
                                        id={`emg-stock-${level.stockLocationId}`}
                                        type="number"
                                        value={level.stockOnHand}
                                        onChange={event => {
                                            const next = [...stockLevels];
                                            next[index] = {
                                                ...level,
                                                stockOnHand: event.target.valueAsNumber || 0,
                                            };
                                            setStockLevels(next);
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <Button type="button" onClick={handleSave} disabled={saveMutation.isPending}>
                        <Pencil className="mr-2 size-4" />
                        {saveMutation.isPending ? 'Saving…' : 'Save variant changes'}
                    </Button>
                </div>
            )}
        </div>
    );
}

export function VariantNameQuickEditCell({row}: CellContext<VariantListItem, unknown>) {
    return (
        <button
            type="button"
            className="text-left font-medium text-primary hover:underline"
            onClick={() => {
                window.dispatchEvent(new CustomEvent(EMG_SELECT_VARIANT_EVENT, {detail: row.original.id}));
                document.getElementById('emg-variant-quick-editor')?.scrollIntoView({behavior: 'smooth', block: 'start'});
            }}
        >
            {row.original.name}
        </button>
    );
}
