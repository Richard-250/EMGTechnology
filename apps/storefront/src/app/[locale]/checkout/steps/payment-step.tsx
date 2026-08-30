'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { CreditCard, Loader2, Smartphone, CheckCircle2 } from 'lucide-react';
import { useCheckout } from '../checkout-provider';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  buildPaymentMetadata,
  digitsOnly,
  formatCardNumber,
  isCardFormValid,
  isValidRwandaMobileNumber,
  normalizeRwandaMobileNumber,
} from '../payment-details';

interface PaymentStepProps {
  onComplete: () => void;
}

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

function MobileMoneyForm({ providerCode }: { providerCode: 'mtn-rwanda' | 'airtel-rwanda' }) {
  const t = useTranslations('Checkout');
  const { mobileMoneyDetails, setMobileMoneyDetails } = useCheckout();
  const [error, setError] = useState<string | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);

  const providerName = providerCode === 'mtn-rwanda' ? 'MTN' : 'Airtel';

  const handleRequestPayment = async () => {
    if (!isValidRwandaMobileNumber(mobileMoneyDetails.phoneNumber)) {
      setError(t('invalidMobileNumber'));
      return;
    }

    setError(null);
    setIsWaiting(true);
    setMobileMoneyDetails({ ...mobileMoneyDetails, status: 'pending' });

    // Simulate USSD / mobile money approval on the customer's phone
    await new Promise((resolve) => setTimeout(resolve, 4500));

    setMobileMoneyDetails({
      phoneNumber: mobileMoneyDetails.phoneNumber,
      status: 'completed',
    });
    setIsWaiting(false);
  };

  return (
    <Card className="p-4 border-dashed space-y-4">
      <div>
        <p className="text-sm font-medium">{t('mobileMoneyTitle', { provider: providerName })}</p>
        <p className="text-xs text-muted-foreground mt-1">{t('mobileMoneyHint', { provider: providerName })}</p>
      </div>

      <Field>
        <FieldLabel htmlFor="mobilePhone">{t('mobileMoneyPhone')}</FieldLabel>
        <Input
          id="mobilePhone"
          type="tel"
          inputMode="tel"
          placeholder="0781234567"
          value={mobileMoneyDetails.phoneNumber}
          disabled={mobileMoneyDetails.status === 'pending' || mobileMoneyDetails.status === 'completed'}
          onChange={(e) => {
            setError(null);
            setMobileMoneyDetails({ phoneNumber: e.target.value, status: 'idle' });
          }}
        />
        {error && <FieldError>{error}</FieldError>}
      </Field>

      {mobileMoneyDetails.status === 'idle' && (
        <Button type="button" className="w-full" onClick={handleRequestPayment} disabled={isWaiting}>
          {isWaiting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('sendPaymentRequest', { provider: providerName })}
        </Button>
      )}

      {mobileMoneyDetails.status === 'pending' && (
        <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
          <div>
            <p className="font-medium">{t('mobileMoneyPendingTitle')}</p>
            <p className="mt-1 text-amber-800/90">
              {t('mobileMoneyPendingMessage', {
                provider: providerName,
                phone: normalizeRwandaMobileNumber(mobileMoneyDetails.phoneNumber),
              })}
            </p>
          </div>
        </div>
      )}

      {mobileMoneyDetails.status === 'completed' && (
        <div className="flex items-start gap-3 rounded-md border border-electric/30 bg-electric/5 p-3 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
          <div>
            <p className="font-medium text-electric">{t('mobileMoneyCompletedTitle')}</p>
            <p className="mt-1 text-muted-foreground">
              {t('mobileMoneyCompletedMessage', {
                provider: providerName,
                phone: normalizeRwandaMobileNumber(mobileMoneyDetails.phoneNumber),
              })}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function PaymentStep({ onComplete }: PaymentStepProps) {
  const t = useTranslations('Checkout');
  const {
    paymentMethods,
    selectedPaymentMethodCode,
    setSelectedPaymentMethodCode,
    cardDetails,
    mobileMoneyDetails,
    setPaymentDetailsMetadata,
  } = useCheckout();
  const [formError, setFormError] = useState<string | null>(null);

  const uniqueMethods = paymentMethods.filter(
    (method, index, list) => list.findIndex((m) => m.code === method.code) === index,
  );

  const canContinue = () => {
    if (!selectedPaymentMethodCode) return false;
    if (selectedPaymentMethodCode === 'card') return isCardFormValid(cardDetails);
    if (selectedPaymentMethodCode === 'mtn-rwanda' || selectedPaymentMethodCode === 'airtel-rwanda') {
      return mobileMoneyDetails.status === 'completed';
    }
    return true;
  };

  const handleContinue = () => {
    if (!selectedPaymentMethodCode) return;

    if (selectedPaymentMethodCode === 'card' && !isCardFormValid(cardDetails)) {
      setFormError(t('cardFormIncomplete'));
      return;
    }

    if (
      (selectedPaymentMethodCode === 'mtn-rwanda' || selectedPaymentMethodCode === 'airtel-rwanda') &&
      mobileMoneyDetails.status !== 'completed'
    ) {
      setFormError(t('mobileMoneyNotCompleted'));
      return;
    }

    setFormError(null);
    setPaymentDetailsMetadata(
      buildPaymentMetadata(
        selectedPaymentMethodCode,
        selectedPaymentMethodCode === 'card' ? cardDetails : undefined,
        mobileMoneyDetails.phoneNumber || undefined,
      ),
    );
    onComplete();
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

      {selectedPaymentMethodCode === 'card' && <CardPaymentForm />}

      {isMobile && (
        <MobileMoneyForm providerCode={selectedPaymentMethodCode as 'mtn-rwanda' | 'airtel-rwanda'} />
      )}

      {formError && <p className="text-sm text-destructive">{formError}</p>}

      <Button onClick={handleContinue} disabled={!canContinue()} className="w-full">
        {t('continueToReview')}
      </Button>
    </div>
  );
}
