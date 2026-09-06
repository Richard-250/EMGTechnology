'use client';

import Image from 'next/image';
import type {ReactNode} from 'react';
import {Button} from '@/components/ui/button';
import {Pencil} from 'lucide-react';
import {useCheckout} from '../checkout-provider';
import {Price} from '@/components/commerce/price';
import {resolveProductImage} from '@/lib/product-images';
import {useTranslations} from 'next-intl';

interface ReviewStepProps {
    onEditStep: (step: 'contact' | 'shipping' | 'delivery') => void;
    onPayNow: () => void;
}

export default function ReviewStep({onEditStep, onPayNow}: ReviewStepProps) {
    const t = useTranslations('Checkout');
    const {order, deliveryDateLabel} = useCheckout();

    const shipping = order.shippingAddress;
    const location = [shipping?.fullName, shipping?.streetLine1, shipping?.streetLine2, shipping?.city, shipping?.province, shipping?.country, shipping?.phoneNumber]
        .filter(Boolean)
        .join(', ');

    const orderDeliveryDate =
        deliveryDateLabel ||
        (typeof order.customFields === 'object' &&
        order.customFields !== null &&
        'deliveryDate' in order.customFields
            ? String((order.customFields as {deliveryDate?: string}).deliveryDate ?? '')
            : '');

    const taxAmount = Math.max(0, order.totalWithTax - order.total);
    const discounts = order.discounts ?? [];
    const discountTotal = discounts.reduce((sum, d) => sum + Math.abs(d.amountWithTax), 0);

    const canPay =
        Boolean(order.shippingAddress) && Boolean(order.shippingLines?.length) && Boolean(orderDeliveryDate);

    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">{t('reviewBeforePaymentHint')}</p>

            {/* Products */}
            <div className="overflow-hidden rounded-xl border border-border">
                <div className="border-b border-border bg-muted/40 px-4 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('orderSummary')}
                    </p>
                </div>
                <ul className="divide-y divide-border">
                    {order.lines.map(line => (
                        <li key={line.id} className="flex gap-3 px-4 py-3">
                            <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                                <Image
                                    src={resolveProductImage(
                                        line.productVariant.product.featuredAsset?.preview,
                                        line.productVariant.product.slug,
                                    )}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    sizes="56px"
                                />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">{line.productVariant.product.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {line.productVariant.name}
                                    {line.productVariant.sku ? ` · ${line.productVariant.sku}` : ''}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {t('qty', {quantity: line.quantity})} ·{' '}
                                    <Price
                                        value={line.unitPriceWithTax}
                                        currencyCode={order.currencyCode}
                                    />{' '}
                                    each
                                </p>
                            </div>
                            <p className="text-sm font-semibold whitespace-nowrap">
                                <Price value={line.linePriceWithTax} currencyCode={order.currencyCode} />
                            </p>
                        </li>
                    ))}
                </ul>

                <div className="space-y-2 border-t border-border bg-muted/20 px-4 py-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('subtotal')}</span>
                        <Price value={order.subTotalWithTax} currencyCode={order.currencyCode} />
                    </div>
                    {discountTotal > 0 && (
                        <div className="flex justify-between text-electric">
                            <span>
                                {t('discounts')}
                                {discounts[0]?.description ? ` (${discounts[0].description})` : ''}
                            </span>
                            <span>
                                <Price value={-discountTotal} currencyCode={order.currencyCode} />
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('shipping')}</span>
                        {order.shippingWithTax > 0 ? (
                            <Price value={order.shippingWithTax} currencyCode={order.currencyCode} />
                        ) : (
                            <span>{t('free')}</span>
                        )}
                    </div>
                    {taxAmount > 0 && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('tax')}</span>
                            <Price value={taxAmount} currencyCode={order.currencyCode} />
                        </div>
                    )}
                    <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                        <span>{t('total')}</span>
                        <span className="text-electric">
                            <Price value={order.totalWithTax} currencyCode={order.currencyCode} />
                        </span>
                    </div>
                </div>
            </div>

            {/* Delivery information */}
            <div className="overflow-hidden rounded-xl border border-border divide-y divide-border">
                <ReviewRow
                    label={t('contact')}
                    value={
                        order.customer
                            ? `${order.customer.firstName} ${order.customer.lastName} · ${order.customer.emailAddress}`
                            : 'N/A'
                    }
                    onEdit={() => onEditStep('contact')}
                    editLabel={t('edit')}
                />
                <ReviewRow
                    label={t('deliveryLocation')}
                    value={location || t('noShippingAddress')}
                    onEdit={() => onEditStep('shipping')}
                    editLabel={t('edit')}
                />
                <ReviewRow
                    label={t('deliveryMethod')}
                    value={
                        order.shippingLines?.[0]
                            ? `${order.shippingLines[0].shippingMethod.name}${
                                  order.shippingLines[0].priceWithTax === 0 ? ` · ${t('free')}` : ''
                              }`
                            : t('noDeliveryMethod')
                    }
                    onEdit={() => onEditStep('delivery')}
                    editLabel={t('edit')}
                    extra={
                        order.shippingLines?.[0]?.priceWithTax ? (
                            <p className="text-sm text-electric font-medium mt-0.5">
                                <Price
                                    value={order.shippingLines[0].priceWithTax}
                                    currencyCode={order.currencyCode}
                                />
                            </p>
                        ) : null
                    }
                />
                <ReviewRow
                    label={t('deliveryDateLabel')}
                    value={orderDeliveryDate || 'N/A'}
                    onEdit={() => onEditStep('delivery')}
                    editLabel={t('edit')}
                />
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

function ReviewRow({
    label,
    value,
    onEdit,
    editLabel,
    extra,
}: {
    label: string;
    value: string;
    onEdit: () => void;
    editLabel: string;
    extra?: ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-3 px-4 py-3.5 bg-card">
            <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="text-sm mt-1">{value}</p>
                {extra}
            </div>
            <button
                type="button"
                onClick={onEdit}
                className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-electric hover:underline"
            >
                <Pencil className="size-3.5" />
                {editLabel}
            </button>
        </div>
    );
}
