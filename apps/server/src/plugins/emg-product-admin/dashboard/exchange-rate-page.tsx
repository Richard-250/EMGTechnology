import {api, Button, Input, Label, graphql} from '@vendure/dashboard';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Calculator, RefreshCw} from 'lucide-react';
import {useEffect, useState} from 'react';
import {toast} from 'sonner';

import {rwfMinorToUsdMinor, usdMinorToRwfMinor} from './currency-convert';

const exchangeRateQuery = graphql(`
    query EmgExchangeRate {
        emgExchangeRate {
            rwfPerUsd
        }
    }
`);

const updateExchangeRateMutation = graphql(`
    mutation EmgUpdateExchangeRate($rwfPerUsd: Float!, $recalculate: Boolean, $direction: String) {
        emgUpdateExchangeRate(rwfPerUsd: $rwfPerUsd, recalculate: $recalculate, direction: $direction) {
            rwfPerUsd
            updatedVariants
        }
    }
`);

export function ExchangeRateCalculatorPage() {
    const queryClient = useQueryClient();
    const [rateInput, setRateInput] = useState('1300');
    const [sampleRwf, setSampleRwf] = useState('130000');

    const rateQuery = useQuery({
        queryKey: ['emg-exchange-rate'],
        queryFn: () => api.query(exchangeRateQuery, {}),
    });

    useEffect(() => {
        const rate = rateQuery.data?.emgExchangeRate?.rwfPerUsd;
        if (typeof rate === 'number' && rate > 0) {
            setRateInput(String(rate));
        }
    }, [rateQuery.data]);

    const saveMutation = useMutation({
        mutationFn: async (recalculate: boolean) => {
            const rwfPerUsd = Number(rateInput);
            if (!Number.isFinite(rwfPerUsd) || rwfPerUsd < 1) {
                throw new Error('Enter a valid exchange rate (RWF per 1 USD)');
            }
            return api.mutate(updateExchangeRateMutation, {
                rwfPerUsd,
                recalculate,
                // Always update USD from RWF — RWF catalog prices stay as set manually
                direction: 'RWF_TO_USD',
            });
        },
        onSuccess: async (data, recalculate) => {
            const result = data.emgUpdateExchangeRate;
            await queryClient.invalidateQueries({queryKey: ['emg-exchange-rate']});
            if (recalculate) {
                toast.success(
                    `Rate saved. Updated USD on ${result.updatedVariants} variant(s). RWF prices were not changed.`,
                );
            } else {
                toast.success(`Rate saved at ${result.rwfPerUsd} RWF per USD (prices not changed).`);
            }
        },
        onError: (error: Error) => {
            toast.error('Failed to update exchange rate', {description: error.message});
        },
    });

    const rate = Number(rateInput) > 0 ? Number(rateInput) : 1300;
    const sampleRwfMinor = Math.round((Number(sampleRwf) || 0) * 100);
    const sampleUsdMinor = rwfMinorToUsdMinor(sampleRwfMinor, rate);
    const sampleUsdMajor = (sampleUsdMinor / 100).toFixed(2);
    const reverseRwfMinor = usdMinorToRwfMinor(Math.round(Number(sampleUsdMajor) * 100), rate);

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <Calculator className="size-6" />
                    Exchange rate
                </h1>
                <p className="text-sm text-muted-foreground">
                    Set how many RWF equal 1 USD. You can update every product&apos;s{' '}
                    <strong>USD</strong> price from its RWF price in one step. RWF prices are always
                    edited manually per product.
                </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-5">
                <div className="grid gap-2">
                    <Label htmlFor="emg-fx-rate">RWF per 1 USD</Label>
                    <Input
                        id="emg-fx-rate"
                        type="number"
                        min={1}
                        step="1"
                        value={rateInput}
                        onChange={e => setRateInput(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                        Current saved rate:{' '}
                        {rateQuery.isPending
                            ? 'Loading'
                            : `${rateQuery.data?.emgExchangeRate?.rwfPerUsd ?? 1300} RWF`}
                    </p>
                </div>

                <div className="rounded-lg border border-border/70 bg-muted/40 p-4 space-y-3">
                    <p className="text-sm font-medium">Preview</p>
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                        <div className="grid gap-2">
                            <Label htmlFor="emg-fx-sample">Sample RWF amount</Label>
                            <Input
                                id="emg-fx-sample"
                                type="number"
                                min={0}
                                value={sampleRwf}
                                onChange={e => setSampleRwf(e.target.value)}
                            />
                        </div>
                        <p className="text-sm tabular-nums pb-2">
                            = <span className="font-semibold">${sampleUsdMajor}</span> USD
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Check: ${sampleUsdMajor} = {(reverseRwfMinor / 100).toLocaleString()} RWF
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                        type="button"
                        onClick={() => saveMutation.mutate(true)}
                        disabled={saveMutation.isPending}
                        className="sm:flex-1"
                    >
                        <RefreshCw className="mr-2 size-4" />
                        {saveMutation.isPending
                            ? 'Updating USD prices…'
                            : 'Save rate & update all USD prices'}
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => saveMutation.mutate(false)}
                        disabled={saveMutation.isPending}
                    >
                        Save rate only
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    “Update all USD prices” recalculates USD from each variant&apos;s RWF price. It
                    never overwrites RWF.
                </p>
            </div>
        </div>
    );
}
