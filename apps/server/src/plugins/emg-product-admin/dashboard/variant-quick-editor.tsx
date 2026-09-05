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
import {DEFAULT_RWF_PER_USD, rwfMinorToUsdMinor, usdMinorToRwfMinor} from './currency-convert';
import {
    fetchExchangeRate,
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

type VariantOption = {
    id: string;
    code: string;
    name?: string;
    group?: {id: string; code: string; name?: string} | null;
};

function majorFromMinor(minor: number): number {
    return Math.round(minor / 100);
}

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
    const [options, setOptions] = useState<VariantOption[]>([]);
    const [discountPercentage, setDiscountPercentage] = useState<string>('');
    const [discountAmount, setDiscountAmount] = useState<string>('');
    const [originalPrice, setOriginalPrice] = useState<string>('');
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

    const exchangeRateQuery = useQuery({
        queryKey: ['emg-exchange-rate'],
        queryFn: fetchExchangeRate,
        staleTime: 60_000,
    });

    const rwfPerUsd =
        exchangeRateQuery.data?.emgExchangeRate?.rwfPerUsd > 0
            ? exchangeRateQuery.data.emgExchangeRate.rwfPerUsd
            : DEFAULT_RWF_PER_USD;

    const saveMutation = useMutation({
        mutationFn: updateVariant,
        onSuccess: async () => {
            toast.success('Variant updated');
            await queryClient.invalidateQueries({queryKey: ['emg-product-variants', productId]});
            await queryClient.invalidateQueries({queryKey: ['emg-variant-detail', selectedVariantId]});
            await queryClient.invalidateQueries({queryKey: ['PaginatedListDataTable']});
            await queryClient.invalidateQueries({queryKey: ['DetailPage']});
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
        setOptions((variant.options ?? []) as VariantOption[]);

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
        setPriceUsd(usd > 0 ? usd : rwfMinorToUsdMinor(rwf, rwfPerUsd));

        setStockLevels(
            (variant.stockLevels ?? []).map(
                (level: {stockOnHand: number; stockLocation: {id: string; name: string}}) => ({
                    stockLocationId: level.stockLocation.id,
                    stockOnHand: level.stockOnHand,
                    label: level.stockLocation.name,
                }),
            ),
        );

        const cf = (variant.customFields ?? {}) as {
            variantDiscountPercentage?: number | null;
            variantDiscountAmount?: number | null;
            variantOriginalPrice?: number | null;
        };
        setDiscountPercentage(
            cf.variantDiscountPercentage != null && cf.variantDiscountPercentage > 0
                ? String(cf.variantDiscountPercentage)
                : '',
        );
        setDiscountAmount(
            cf.variantDiscountAmount != null && cf.variantDiscountAmount > 0
                ? String(cf.variantDiscountAmount)
                : '',
        );
        // Prefer stored original; otherwise default to current RWF price (major units)
        const autoOriginal = majorFromMinor(rwf);
        setOriginalPrice(
            cf.variantOriginalPrice != null && cf.variantOriginalPrice > 0
                ? String(cf.variantOriginalPrice)
                : autoOriginal > 0
                  ? String(autoOriginal)
                  : '',
        );

        queueMicrotask(() => {
            hydrating.current = false;
        });
    }, [variantDetailQuery.data, rwfPerUsd]);

    const handleRwfChange = (next: number) => {
        setPriceRwf(next);
        if (!hydrating.current && linkConversion) {
            setPriceUsd(rwfMinorToUsdMinor(next, rwfPerUsd));
        }
        // Keep original price in sync when admin hasn't set a custom override yet
        if (!hydrating.current && !discountPercentage && !discountAmount) {
            const major = majorFromMinor(next);
            if (major > 0) {
                setOriginalPrice(String(major));
            }
        }
    };

    const handleUsdChange = (next: number) => {
        setPriceUsd(next);
        if (!hydrating.current && linkConversion) {
            setPriceRwf(usdMinorToRwfMinor(next, rwfPerUsd));
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

        const pct = discountPercentage.trim() === '' ? null : Number(discountPercentage);
        const amt = discountAmount.trim() === '' ? null : Number(discountAmount);
        let orig = originalPrice.trim() === '' ? null : Number(originalPrice);
        if ((pct != null && pct > 0) || (amt != null && amt > 0)) {
            if (orig == null || orig <= 0) {
                orig = majorFromMinor(priceRwf);
            }
        }

        await saveMutation.mutateAsync({
            id: selectedVariantId,
            enabled,
            sku,
            taxCategoryId: taxCategoryId || undefined,
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
            customFields: {
                variantDiscountPercentage: pct != null && !Number.isNaN(pct) ? pct : null,
                variantDiscountAmount: amt != null && !Number.isNaN(amt) ? amt : null,
                variantOriginalPrice: orig != null && !Number.isNaN(orig) ? orig : null,
            },
        });
    };

    const taxCategories = taxCategoriesQuery.data?.taxCategories?.items ?? [];

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Select a variant below (or click its name in the table) to edit name, price, tax,
                stock, options, and discount without leaving this product page. Changes save to the
                database immediately.
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

                    {options.length > 0 && (
                        <div className="grid gap-2">
                            <Label>Options</Label>
                            <div className="flex flex-wrap gap-2">
                                {options.map(option => (
                                    <span
                                        key={option.id || option.code}
                                        className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium"
                                    >
                                        {option.group?.name || option.group?.code || 'Option'}:{' '}
                                        {option.name || option.code}
                                    </span>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Option values are set when the variant is created. To change option
                                definitions, use Product options above; then recreate or adjust
                                variants as needed.
                            </p>
                        </div>
                    )}

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
                                When on, editing one currency updates the other (1 USD ={' '}
                                {rwfPerUsd.toLocaleString()} RWF). Turn off to set each amount
                                independently. Change the rate in Settings → Exchange rate.
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

                    <div className="grid gap-3 rounded-md border border-dashed border-border p-3">
                        <div>
                            <Label>Variant discount (optional)</Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Overrides the product-level Super Deal for this variant only.
                                Original price is filled from the current RWF price automatically —
                                you do not need to type it unless you want a custom was-price.
                            </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="emg-variant-discount-pct">Percentage (%)</Label>
                                <Input
                                    id="emg-variant-discount-pct"
                                    type="number"
                                    min={0}
                                    max={99}
                                    placeholder="e.g. 20"
                                    value={discountPercentage}
                                    onChange={event => setDiscountPercentage(event.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="emg-variant-discount-amt">Fixed amount</Label>
                                <Input
                                    id="emg-variant-discount-amt"
                                    type="number"
                                    min={0}
                                    placeholder="e.g. 5000"
                                    value={discountAmount}
                                    onChange={event => setDiscountAmount(event.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="emg-variant-original-price">Original price</Label>
                                <Input
                                    id="emg-variant-original-price"
                                    type="number"
                                    min={0}
                                    value={originalPrice}
                                    onChange={event => setOriginalPrice(event.target.value)}
                                />
                            </div>
                        </div>
                    </div>

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
