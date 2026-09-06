import {
    Button,
    DashboardFormComponent,
    Input,
    usePage,
} from '@vendure/dashboard';
import {Sparkles} from 'lucide-react';
import {useEffect, useRef} from 'react';
import {useWatch} from 'react-hook-form';

import {generateProductSku, shouldAutoGenerateSku} from './generate-sku';

export const AutoSkuInput: DashboardFormComponent = props => {
    const {entity, form} = usePage();
    const hasAutoFilled = useRef(false);

    const translationName = useWatch({control: form?.control, name: 'translations.0.name'});
    const plainName = useWatch({control: form?.control, name: 'name'});
    const variantName = translationName ?? plainName ?? entity?.name ?? '';

    const productName = entity?.product?.name ?? '';
    const productSlug = entity?.product?.translations?.[0]?.slug;
    const optionCodes = entity?.options?.map((option: {code: string}) => option.code) ?? [];

    const buildSku = () =>
        generateProductSku({
            productName,
            productSlug,
            variantName,
            optionCodes,
            variantId: entity?.id,
        });

    useEffect(() => {
        // Only auto-fill empty / placeholder SKUs — never overwrite an existing real SKU
        if (hasAutoFilled.current) {
            return;
        }
        if (!shouldAutoGenerateSku(props.value)) {
            hasAutoFilled.current = true;
            return;
        }
        if (!variantName.trim() && !productName.trim()) {
            return;
        }
        hasAutoFilled.current = true;
        props.onChange(buildSku());
    }, [variantName, productName, props.value]);

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <Input
                    value={props.value ?? ''}
                    onChange={event => props.onChange(event.target.value)}
                    onBlur={props.onBlur}
                    name={props.name}
                    ref={props.ref}
                    placeholder="Auto-generated (manual override allowed)"
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => props.onChange(buildSku())}
                    title="Regenerate from product data"
                >
                    <Sparkles className="mr-1.5 size-4" />
                    Generate
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                SKU is generated automatically from product and variant data. Leave blank or click
                Generate only if you need a manual override. The server also assigns a
                unique SKU when variants are created.
            </p>
        </div>
    );
};
