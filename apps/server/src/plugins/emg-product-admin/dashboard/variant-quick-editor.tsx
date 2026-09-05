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
} from '@vendure/dashboard';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Pencil} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';
import {toast} from 'sonner';

import {generateProductSku} from './generate-sku';
import {rwfMinorToUsdMinor, usdMinorToRwfMinor} from './currency-convert';
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

type PriceEntry = {currencyCode: string; price: number};

export function VariantQuickEditor({context}: {context: {entity?: {id?: string; name?: string}}}) {
    const productId = context.entity?.id;
    const queryClient = useQueryClient();
    const [selectedVariantId, setSelectedVariantId] = useState<string>('');
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [enabled, setEnabled] = useState(true);
    const [priceRwf, setPriceRwf] = useState(0);
    const [priceUsd, setPriceUsd] = useState(0);
    const [linkConversion, setLinkConversion] = useState(true);
    const [taxCategoryId, setTaxCategoryId] = useState('');
    const [stockLevels, setStockLevels] = useState<
        Array<{stockLocationId: string; stockOnHand: number; label: string}>
    >([]);
    const hydrating = useRef(false);

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

        hydrating.current = true;
        setName(variant.name ?? '');
        setSku(variant.sku ?? '');
        setEnabled(variant.enabled ?? true);
        setTaxCategoryId(variant.taxCategory?.id ?? '');

        const prices = (variant.prices ?? []) as PriceEntry[];
        const rwf =
            prices.find(entry => entry.currencyCode === 'RWF')?.price ??
            (variant.currencyCode === 'RWF' ? variant.price : 0) ??
            0;
        const usd =
            prices.find(entry => entry.currencyCode === 'USD')?.price ??
            (variant.currencyCode === 'USD' ? variant.price : 0) ??
            0;

        setPriceRwf(rwf);
        setPriceUsd(usd > 0 ? usd : rwfMinorToUsdMinor(rwf));

        setStockLevels(
            (variant.stockLevels ?? []).map(
                (level: {stockOnHand: number; stockLocation: {id: string; name: string}}) => ({
                    stockLocationId: level.stockLocation.id,
                    stockOnHand: level.stockOnHand,
                    label: level.stockLocation.name,
                }),
            ),
        );
        queueMicrotask(() => {
            hydrating.current = false;
        });
    }, [variantDetailQuery.data]);

    const handleRwfChange = (next: number) => {
        setPriceRwf(next);
        if (!hydrating.current && linkConversion) {
            setPriceUsd(rwfMinorToUsdMinor(next));
        }
    };

    const handleUsdChange = (next: number) => {
        setPriceUsd(next);
        if (!hydrating.current && linkConversion) {
            setPriceRwf(usdMinorToRwfMinor(next));
        }
    };

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
        const existing = (variant?.prices ?? []) as PriceEntry[];
        const byCurrency = new Map(existing.map(entry => [entry.currencyCode, entry.price]));
        byCurrency.set('RWF', priceRwf);
        byCurrency.set('USD', priceUsd);

        const prices = Array.from(byCurrency.entries()).map(([currencyCode, price]) => ({
            currencyCode,
            price,
        }));

        await saveMutation.mutateAsync({
            id: selectedVariantId,
            enabled,
            sku,
            taxCategoryId,
            prices,
            translations: (variant?.translations ?? []).map(
                (translation: {languageCode: string; name: string}) => ({
                    languageCode: translation.languageCode,
                    name:
                        translation.languageCode === variant?.translations?.[0]?.languageCode
                            ? name
                            : translation.name,
                }),
            ),
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
                Edit RWF and USD prices (with optional auto-conversion), tax, stock, SKU, and name
                without leaving the product page. Click a variant name in the table above to load it.
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
                        <Input
                            id="emg-variant-name"
                            value={name}
                            onChange={event => setName(event.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="emg-variant-sku">SKU</Label>
                        <div className="flex gap-2">
                            <Input
                                id="emg-variant-sku"
                                value={sku}
                                onChange={event => setSku(event.target.value)}
                            />
                            <Button type="button" variant="outline" onClick={handleGenerateSku}>
                                Generate
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="emg-variant-enabled">Enabled</Label>
                        <Switch
                            id="emg-variant-enabled"
                            checked={enabled}
                            onCheckedChange={setEnabled}
                        />
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-muted/40 px-3 py-2">
                        <div className="min-w-0">
                            <Label htmlFor="emg-link-conversion">Auto-convert RWF ↔ USD</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                When on, editing one currency updates the other (~1 USD = 1,300 RWF).
                                Turn off to set each amount independently.
                            </p>
                        </div>
                        <Switch
                            id="emg-link-conversion"
                            checked={linkConversion}
                            onCheckedChange={setLinkConversion}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label htmlFor="emg-variant-price-rwf">Price (RWF)</Label>
                            <MoneyInput
                                id="emg-variant-price-rwf"
                                value={priceRwf}
                                currency="RWF"
                                onChange={handleRwfChange}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="emg-variant-price-usd">Price (USD)</Label>
                            <MoneyInput
                                id="emg-variant-price-usd"
                                value={priceUsd}
                                currency="USD"
                                onChange={handleUsdChange}
                            />
                        </div>
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
                                    <Label htmlFor={`emg-stock-${level.stockLocationId}`}>
                                        {level.label}
                                    </Label>
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
                window.dispatchEvent(
                    new CustomEvent(EMG_SELECT_VARIANT_EVENT, {detail: row.original.id}),
                );
                document
                    .getElementById('emg-variant-quick-editor')
                    ?.scrollIntoView({behavior: 'smooth', block: 'start'});
            }}
        >
            {row.original.name}
        </button>
    );
}
