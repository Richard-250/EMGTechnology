import {
    Button,
    DashboardFormComponent,
    Input,
    usePage,
} from '@vendure/dashboard';
import {Sparkles} from 'lucide-react';
import {useEffect, useRef} from 'react';
import {useWatch} from 'react-hook-form';

import {generateProductSku, slugifyForSku} from './generate-sku';

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
        if (hasAutoFilled.current || props.value?.trim()) {
            return;
        }
        if (!variantName.trim()) {
            return;
        }
        hasAutoFilled.current = true;
        props.onChange(buildSku());
    }, [variantName, props.value]);

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <Input
                    value={props.value ?? ''}
                    onChange={event => props.onChange(event.target.value)}
                    onBlur={props.onBlur}
                    name={props.name}
                    ref={props.ref}
                    placeholder="Auto-generated from product data"
                />
                <Button type="button" variant="outline" onClick={() => props.onChange(buildSku())}>
                    <Sparkles className="mr-1.5 size-4" />
                    Generate
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                Preview: {slugifyForSku(variantName || productName || 'PRODUCT').slice(0, 24) || '—'}
            </p>
        </div>
    );
};
