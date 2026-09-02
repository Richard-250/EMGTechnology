'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { CreditCard, Loader2, Smartphone } from 'lucide-react';
import { useCheckout } from '../checkout-provider';
import { placeOrder as placeOrderAction } from '../actions';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Price } from '@/components/commerce/price';
import {
  buildPaymentMetadata,
  buildPaymentReference,
  digitsOnly,
  formatCardNumber,
  isCardFormValid,
  isMobileMoneyCheckoutValid,
  parsePaymentSteps,
} from '../payment-details';

function PaymentMethodIcon({ code }: { code: string }) {
  if (code === 'mtn-rwanda') {
    return (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#FFCC00] text-[10px] font-bold text-black"
        aria-hidden
      >
        MTN
      </span>
    );
  }

  if (code === 'airtel-rwanda') {
    return (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#ED1C24] text-[9px] font-bold text-white"
        aria-hidden
      >
        Airtel
      </span>
    );
  }

  return <CreditCard className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />;
}

function CardPaymentForm() {
  const t = useTranslations('Checkout');
  const { cardDetails, setCardDetails } = useCheckout();

  return (
    <Card className="p-4 border-dashed">
      <FieldGroup>
        <p className="text-sm font-medium">{t('cardDetailsTitle')}</p>
        <p className="text-xs text-muted-foreground mb-2">{t('cardDetailsHint')}</p>

        <Field>
          <FieldLabel htmlFor="cardholderName">{t('cardholderName')}</FieldLabel>
          <Input
            id="cardholderName"
            autoComplete="cc-name"
            placeholder="John Doe"
            value={cardDetails.cardholderName}
            onChange={(e) => setCardDetails({ ...cardDetails, cardholderName: e.target.value })}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="cardNumber">{t('cardNumber')}</FieldLabel>
          <Input
            id="cardNumber"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="4111 1111 1111 1111"
            value={cardDetails.cardNumber}
            onChange={(e) =>
              setCardDetails({ ...cardDetails, cardNumber: formatCardNumber(e.target.value) })
            }
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field>
            <FieldLabel htmlFor="expiryMonth">{t('expiryMonth')}</FieldLabel>
            <Input
              id="expiryMonth"
              inputMode="numeric"
              autoComplete="cc-exp-month"
              placeholder="MM"
              maxLength={2}
              value={cardDetails.expiryMonth}
              onChange={(e) =>
                setCardDetails({ ...cardDetails, expiryMonth: digitsOnly(e.target.value).slice(0, 2) })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="expiryYear">{t('expiryYear')}</FieldLabel>
            <Input
              id="expiryYear"
              inputMode="numeric"
              autoComplete="cc-exp-year"
              placeholder="YY"
              maxLength={2}
              value={cardDetails.expiryYear}
              onChange={(e) =>
                setCardDetails({ ...cardDetails, expiryYear: digitsOnly(e.target.value).slice(0, 2) })
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="cvv">{t('cvv')}</FieldLabel>
            <Input
              id="cvv"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="123"
              maxLength={4}
              value={cardDetails.cvv}
              onChange={(e) =>
                setCardDetails({ ...cardDetails, cvv: digitsOnly(e.target.value).slice(0, 4) })
              }
            />
          </Field>
        </div>
      </FieldGroup>
    </Card>
  );
}

function MobileMoneyCheckoutPanel({
  providerCode,
  onPlaceOrder,
  loading,
}: {
  providerCode: 'mtn-rwanda' | 'airtel-rwanda';
  onPlaceOrder: () => void;
  loading: boolean;
}) {
  const t = useTranslations('Checkout');
  const { order, paymentMethods, mobileMoneyDetails, setMobileMoneyDetails } = useCheckout();
  const method = paymentMethods.find((m) => m.code === providerCode);
  const fields = method?.customFields;
  const steps = parsePaymentSteps(fields?.paymentSteps);
  const paymentReference = buildPaymentReference(providerCode, order.code);
  const providerName = providerCode === 'mtn-rwanda' ? t('mtnMobileMoney') : t('airtelMoney');

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-border bg-electric/5 px-5 py-4">
        <h3 className="text-lg font-bold text-electric">{providerName}</h3>
        <p className="text-lg font-bold text-electric whitespace-nowrap">
          <Price value={order.totalWithTax} currencyCode={order.currencyCode} />
        </p>
      </div>

      <div className="px-5 py-4 space-y-4 text-sm">
        <p className="text-foreground">
          {t('payForMerchant', {
            name: fields?.merchantDisplayName ?? method?.name ?? 'EMG Technology Ltd',
            code: fields?.merchantMomoCode ?? '',
          })}
        </p>
        <p className="text-foreground">
          {t('momoNumberLabel')}{' '}
          <strong className="text-electric">{fields?.merchantPhone ?? '—'}</strong>
        </p>

        {steps.length > 0 && (
          <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
            {steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        )}

        <div className="rounded-lg bg-muted px-4 py-3 text-sm font-medium text-foreground">
          {t('paymentReferenceLabel')}: {paymentReference}
        </div>
      </div>

      <div className="border-t border-border px-5 py-5 space-y-4 bg-muted/20">
        <p className="font-semibold text-sm">{t('paymentProofTitle')}</p>

        <Field>
          <FieldLabel htmlFor="payerAccountName">{t('payerAccountName')}</FieldLabel>
          <Input
            id="payerAccountName"
            placeholder={t('payerAccountNamePlaceholder')}
            value={mobileMoneyDetails.accountName}
            onChange={(e) =>
              setMobileMoneyDetails({ ...mobileMoneyDetails, accountName: e.target.value })
            }
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="payerPhone">{t('payerPhone')}</FieldLabel>
          <Input
            id="payerPhone"
            type="tel"
            inputMode="tel"
            placeholder="+250780000000"
            value={mobileMoneyDetails.phoneNumber}
            onChange={(e) =>
              setMobileMoneyDetails({ ...mobileMoneyDetails, phoneNumber: e.target.value })
            }
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="transactionId">{t('transactionId')}</FieldLabel>
          <Input
            id="transactionId"
            placeholder={t('transactionIdPlaceholder')}
            value={mobileMoneyDetails.transactionId}
            onChange={(e) =>
              setMobileMoneyDetails({ ...mobileMoneyDetails, transactionId: e.target.value })
            }
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="paymentNote">{t('paymentNote')}</FieldLabel>
          <Textarea
            id="paymentNote"
            placeholder={t('paymentNotePlaceholder')}
            rows={3}
            value={mobileMoneyDetails.note}
            onChange={(e) => setMobileMoneyDetails({ ...mobileMoneyDetails, note: e.target.value })}
          />
        </Field>

        <Button
          onClick={onPlaceOrder}
          disabled={loading || !isMobileMoneyCheckoutValid(mobileMoneyDetails)}
          className="w-full bg-electric hover:bg-electric/90 text-electric-foreground font-semibold py-6"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('placeOrder')}
        </Button>
      </div>
    </div>
  );
}

export default function PaymentStep() {
  const t = useTranslations('Checkout');
  const {
    order,
    paymentMethods,
    selectedPaymentMethodCode,
    setSelectedPaymentMethodCode,
    cardDetails,
    mobileMoneyDetails,
    deliveryDateLabel,
  } = useCheckout();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const uniqueMethods = paymentMethods.filter(
    (method, index, list) => list.findIndex((m) => m.code === method.code) === index,
  );

  const deliveryMethodName = order.shippingLines?.[0]?.shippingMethod.name;
  const deliveryDate =
    deliveryDateLabel ||
    (typeof order.customFields === 'object' &&
    order.customFields !== null &&
    'deliveryDate' in order.customFields
      ? String((order.customFields as { deliveryDate?: string }).deliveryDate ?? '')
      : '');

  const handlePlaceOrder = async () => {
    if (!selectedPaymentMethodCode) return;

    if (selectedPaymentMethodCode === 'card' && !isCardFormValid(cardDetails)) {
      setFormError(t('cardFormIncomplete'));
      return;
    }

    if (
      (selectedPaymentMethodCode === 'mtn-rwanda' || selectedPaymentMethodCode === 'airtel-rwanda') &&
      !isMobileMoneyCheckoutValid(mobileMoneyDetails)
    ) {
      setFormError(t('mobileMoneyFormIncomplete'));
      return;
    }

    setFormError(null);
    setLoading(true);

    try {
      const paymentReference = buildPaymentReference(selectedPaymentMethodCode, order.code);
      const metadata = buildPaymentMetadata(selectedPaymentMethodCode, {
        card: selectedPaymentMethodCode === 'card' ? cardDetails : undefined,
        mobile:
          selectedPaymentMethodCode === 'mtn-rwanda' || selectedPaymentMethodCode === 'airtel-rwanda'
            ? mobileMoneyDetails
            : undefined,
        paymentReference,
        deliveryDate,
        deliveryMethodName,
      });

      await placeOrderAction(selectedPaymentMethodCode, metadata);
    } catch (error) {
      if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
        throw error;
      }
      console.error('Error placing order:', error);
      setFormError(t('unexpectedError'));
      setLoading(false);
    }
  };

  if (uniqueMethods.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('noPaymentMethods')}</p>
      </div>
    );
  }

  const isMobile =
    selectedPaymentMethodCode === 'mtn-rwanda' || selectedPaymentMethodCode === 'airtel-rwanda';

  return (
    <div className="space-y-6">
      <h3 className="font-semibold">{t('selectPaymentMethod')}</h3>

      <RadioGroup value={selectedPaymentMethodCode || ''} onValueChange={setSelectedPaymentMethodCode}>
        {uniqueMethods.map((method) => (
          <Label key={method.code} htmlFor={method.code} className="cursor-pointer">
            <Card
              className={cn(
                'p-4 transition-colors',
                selectedPaymentMethodCode === method.code && 'border-electric ring-1 ring-electric/30',
              )}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value={method.code} id={method.code} />
                <PaymentMethodIcon code={method.code} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{method.name}</p>
                  {method.description && (
                    <p className="text-sm text-muted-foreground mt-1">{method.description}</p>
                  )}
                </div>
                {(method.code === 'mtn-rwanda' || method.code === 'airtel-rwanda') && (
                  <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
                )}
              </div>
            </Card>
          </Label>
        ))}
      </RadioGroup>

      {selectedPaymentMethodCode === 'card' && (
        <>
          <CardPaymentForm />
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button
            onClick={handlePlaceOrder}
            disabled={loading || !isCardFormValid(cardDetails)}
            className="w-full bg-electric hover:bg-electric/90 text-electric-foreground font-semibold"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('placeOrder')}
          </Button>
        </>
      )}

      {isMobile && (
        <>
          <MobileMoneyCheckoutPanel
            providerCode={selectedPaymentMethodCode as 'mtn-rwanda' | 'airtel-rwanda'}
            onPlaceOrder={handlePlaceOrder}
            loading={loading}
          />
          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </>
      )}
    </div>
  );
}
