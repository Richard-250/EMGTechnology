'use client';

import {Button} from '@/components/ui/button';
import {Pencil} from 'lucide-react';
import {useCheckout} from '../checkout-provider';
import {Price} from '@/components/commerce/price';
import {useTranslations} from 'next-intl';

interface ReviewStepProps {
    onEditStep: (step: 'contact' | 'shipping' | 'delivery') => void;
    onPayNow: () => void;
}

export default function ReviewStep({onEditStep, onPayNow}: ReviewStepProps) {
    const t = useTranslations('Checkout');
    const {order, deliveryDateLabel} = useCheckout();

    const shipping = order.shippingAddress;
    const location = [shipping?.province, shipping?.city, shipping?.streetLine2, shipping?.streetLine1]
        .filter(Boolean)
        .join(', ');

    const orderDeliveryDate =
        deliveryDateLabel ||
        (typeof order.customFields === 'object' &&
        order.customFields !== null &&
        'deliveryDate' in order.customFields
            ? String((order.customFields as {deliveryDate?: string}).deliveryDate ?? '')
            : '');

    const rows: Array<{
        key: string;
        label: string;
        value: string;
        onEdit: () => void;
    }> = [
        {
            key: 'contact',
            label: t('contact'),
            value: order.customer
                ? `${order.customer.firstName} ${order.customer.lastName} · ${order.customer.emailAddress}`
                : 'N/A',
            onEdit: () => onEditStep('contact'),
        },
        {
            key: 'shipping',
            label: t('deliveryLocation'),
            value: location || t('noShippingAddress'),
            onEdit: () => onEditStep('shipping'),
        },
        {
            key: 'delivery',
            label: t('deliveryMethod'),
            value: order.shippingLines?.[0]
                ? `${order.shippingLines[0].shippingMethod.name}${
                      order.shippingLines[0].priceWithTax === 0 ? ` · ${t('free')}` : ''
                  }`
                : t('noDeliveryMethod'),
            onEdit: () => onEditStep('delivery'),
        },
        {
            key: 'date',
            label: t('deliveryDateLabel'),
            value: orderDeliveryDate || 'N/A',
            onEdit: () => onEditStep('delivery'),
        },
    ];

    const canPay =
        Boolean(order.shippingAddress) && Boolean(order.shippingLines?.length) && Boolean(orderDeliveryDate);

    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">{t('reviewBeforePaymentHint')}</p>

            <div className="overflow-hidden rounded-xl border border-border divide-y divide-border">
                {rows.map(row => (
                    <div key={row.key} className="flex items-start justify-between gap-3 px-4 py-3.5 bg-card">
                        <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {row.label}
                            </p>
                            <p className="text-sm mt-1">{row.value}</p>
                            {row.key === 'delivery' && order.shippingLines?.[0]?.priceWithTax ? (
                                <p className="text-sm text-electric font-medium mt-0.5">
                                    <Price
                                        value={order.shippingLines[0].priceWithTax}
                                        currencyCode={order.currencyCode}
                                    />
                                </p>
                            ) : null}
                        </div>
                        <button
                            type="button"
                            onClick={row.onEdit}
                            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-electric hover:underline"
                        >
                            <Pencil className="size-3.5" />
                            {t('edit')}
                        </button>
                    </div>
                ))}
            </div>

            <Button
                onClick={onPayNow}
                disabled={!canPay}
                size="lg"
                className="w-full bg-electric hover:bg-electric/90 text-electric-foreground font-semibold"
            >
                {t('payNow')}
            </Button>

            {!canPay && <p className="text-sm text-destructive text-center">{t('completeAllSteps')}</p>}
        </div>
    );
}
