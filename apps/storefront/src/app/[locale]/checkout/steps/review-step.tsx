'use client';

import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Loader2, Pencil} from 'lucide-react';
import {useCheckout} from '../checkout-provider';
import {placeOrder as placeOrderAction} from '../actions';
import {Price} from '@/components/commerce/price';
import {useTranslations} from 'next-intl';

interface ReviewStepProps {
    onEditStep: (step: 'contact' | 'shipping' | 'delivery' | 'payment') => void;
}

export default function ReviewStep({onEditStep}: ReviewStepProps) {
    const t = useTranslations('Checkout');
    const {order, paymentMethods, selectedPaymentMethodCode, paymentDetailsMetadata} = useCheckout();
    const [loading, setLoading] = useState(false);
    const [deliveryDate, setDeliveryDate] = useState('');

    useEffect(() => {
        try {
            setDeliveryDate(sessionStorage.getItem('emg-delivery-date') || '');
        } catch {
            setDeliveryDate('');
        }
    }, []);

    const selectedPaymentMethod = paymentMethods.find(method => method.code === selectedPaymentMethodCode);
    const shipping = order.shippingAddress;
    const location = [shipping?.province, shipping?.city, shipping?.streetLine2, shipping?.streetLine1]
        .filter(Boolean)
        .join(', ');

    const paymentLabel = selectedPaymentMethod
        ? [
              selectedPaymentMethod.name,
              paymentDetailsMetadata?.cardLast4
                  ? `${paymentDetailsMetadata.cardBrand ?? t('card')} •••• ${paymentDetailsMetadata.cardLast4}`
                  : null,
              paymentDetailsMetadata?.mobileMoneyPhone
                  ? `${paymentDetailsMetadata.mobileMoneyProvider}: ${paymentDetailsMetadata.mobileMoneyPhone}`
                  : null,
          ]
              .filter(Boolean)
              .join(' · ')
        : '';

    const handlePlaceOrder = async () => {
        if (!selectedPaymentMethodCode) return;

        setLoading(true);
        try {
            await placeOrderAction(selectedPaymentMethodCode, paymentDetailsMetadata ?? undefined);
        } catch (error) {
            if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
                throw error;
            }
            console.error('Error placing order:', error);
            setLoading(false);
        }
    };

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
                : '—',
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
                ? `${order.shippingLines[0].shippingMethod.name} · ${
                      order.shippingLines[0].priceWithTax === 0 ? t('free') : ''
                  }`.trim()
                : t('noDeliveryMethod'),
            onEdit: () => onEditStep('delivery'),
        },
        {
            key: 'date',
            label: t('deliveryDateLabel'),
            value: deliveryDate || '—',
            onEdit: () => onEditStep('delivery'),
        },
        {
            key: 'payment',
            label: t('paymentMethod'),
            value: paymentLabel || t('noPaymentMethod'),
            onEdit: () => onEditStep('payment'),
        },
    ];

    return (
        <div className="space-y-6">
            <h3 className="font-semibold text-lg">{t('reviewOrder')}</h3>

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
                onClick={handlePlaceOrder}
                disabled={
                    loading || !order.shippingAddress || !order.shippingLines?.length || !selectedPaymentMethodCode
                }
                size="lg"
                className="w-full bg-electric hover:bg-electric/90 text-electric-foreground font-semibold"
            >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('placeOrder')}
            </Button>

            {(!order.shippingAddress || !order.shippingLines?.length || !selectedPaymentMethodCode) && (
                <p className="text-sm text-destructive text-center">{t('completeAllSteps')}</p>
            )}
        </div>
    );
}
