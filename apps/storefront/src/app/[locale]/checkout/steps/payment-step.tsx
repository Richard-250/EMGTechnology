'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { CheckCircle2, CreditCard, ImagePlus, Loader2, Smartphone, X } from 'lucide-react';
import { useCheckout } from '../checkout-provider';
import { placeOrder as placeOrderAction } from '../actions';
import { uploadPaymentProof } from '../upload-payment-proof';
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
  resolvePaymentMethodFields,
} from '../payment-details';

const MAX_PROOF_INPUT_BYTES = 15 * 1024 * 1024; // 15MB raw input before client compression

/**
 * Compresses an image in the browser using HTML5 Canvas.
 * Reduces 5MB-10MB phone screenshots to a sharp ~100-200 KB JPEG.
 */
async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1600,
  quality = 0.82,
): Promise<{
  dataUrl: string;
  mimeType: string;
  fileName: string;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = String(e.target?.result || '');
      if (!src) {
        resolve({ dataUrl: '', mimeType: 'image/jpeg', fileName: file.name });
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({ dataUrl: src, mimeType: file.type || 'image/jpeg', fileName: file.name });
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve({
            dataUrl: compressed,
            mimeType: 'image/jpeg',
            fileName: file.name.replace(/\.[^.]+$/, '') + '.jpg',
          });
        } catch {
          resolve({ dataUrl: src, mimeType: file.type || 'image/jpeg', fileName: file.name });
        }
      };
      img.onerror = () => {
        resolve({ dataUrl: src, mimeType: file.type || 'image/jpeg', fileName: file.name });
      };
      img.src = src;
    };
    reader.onerror = () => {
      resolve({ dataUrl: '', mimeType: 'image/jpeg', fileName: file.name });
    };
    reader.readAsDataURL(file);
  });
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
  const fields = resolvePaymentMethodFields(providerCode, method?.customFields);
  const steps = parsePaymentSteps(fields?.paymentSteps);
  const paymentReference = buildPaymentReference(providerCode, order.code);
  const providerName = providerCode === 'mtn-rwanda' ? t('mtnMobileMoney') : t('airtelMoney');
  const merchantName = fields?.merchantDisplayName ?? method?.name ?? 'EMG Technology Ltd';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const previewSrc = mobileMoneyDetails.proofUrl || mobileMoneyDetails.proofDataUrl;
  const isProofReady = isMobileMoneyCheckoutValid(mobileMoneyDetails);

  const handlePickProof = async (file: File | null) => {
    setProofError(null);
    if (!file) return;

    if (file.type && !file.type.startsWith('image/')) {
      setProofError(t('paymentProofInvalidType'));
      return;
    }
    if (file.size > MAX_PROOF_INPUT_BYTES) {
      setProofError(t('paymentProofTooLarge'));
      return;
    }

    try {
      setCompressing(true);
      const compressed = await compressImage(file);
      if (!compressed.dataUrl) {
        throw new Error('Could not read image file');
      }

      // 1. Immediately set preview so customer sees their photo
      setMobileMoneyDetails({
        proofFileName: compressed.fileName,
        proofMimeType: compressed.mimeType,
        proofDataUrl: compressed.dataUrl,
        proofUrl: '',
      });
      setCompressing(false);

      // 2. Upload in background immediately so placing order is instant
      setUploading(true);
      const result = await uploadPaymentProof({
        fileBase64: compressed.dataUrl,
        fileName: compressed.fileName,
        mimeType: compressed.mimeType,
      });

      setMobileMoneyDetails({
        proofFileName: compressed.fileName,
        proofMimeType: compressed.mimeType,
        proofDataUrl: compressed.dataUrl,
        proofUrl: result.url || compressed.dataUrl,
      });
    } catch (err) {
      console.warn('Proof handling warning:', err);
    } finally {
      setCompressing(false);
      setUploading(false);
    }
  };

  const clearProof = () => {
    setProofError(null);
    setMobileMoneyDetails({
      proofFileName: '',
      proofMimeType: '',
      proofDataUrl: '',
      proofUrl: '',
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-border bg-electric/5 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('merchantPaymentDetails')}
          </p>
          <h3 className="text-lg font-bold text-electric mt-1">{providerName}</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{t('amountToPay')}</p>
          <p className="text-lg font-bold text-electric whitespace-nowrap">
            <Price value={order.totalWithTax} currencyCode={order.currencyCode} />
          </p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-3 text-sm">
        <div className="grid gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">{t('registeredMerchantName')}</span>
            <span className="font-medium text-right">{merchantName}</span>
          </div>
          {fields?.merchantPhone ? (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('momoNumberLabel')}</span>
              <strong className="text-electric text-right">{fields.merchantPhone}</strong>
            </div>
          ) : null}
          {fields?.merchantMomoCode ? (
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">{t('momoCodeLabel')}</span>
              <strong className="text-right font-mono text-sm">{fields.merchantMomoCode}</strong>
            </div>
          ) : null}
        </div>

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

        <p className="text-xs text-muted-foreground">{t('awaitingPaymentConfirmation')}</p>
      </div>

      <div className="border-t border-border px-5 py-5 space-y-4 bg-muted/20">
        <div>
          <p className="font-semibold text-sm">{t('paymentProofTitle')}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('paymentProofHint')}</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handlePickProof(e.target.files?.[0] ?? null)}
        />

        {previewSrc ? (
          <div className="relative rounded-lg border border-border overflow-hidden bg-background">
            <img
              src={previewSrc}
              alt={t('paymentProofPreviewAlt')}
              className="max-h-64 w-full object-contain bg-muted/30"
            />
            <button
              type="button"
              onClick={clearProof}
              className="absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-full bg-background/90 border border-border shadow-sm hover:bg-background"
              aria-label={t('paymentProofRemove')}
            >
              <X className="size-4" />
            </button>
            <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground border-t border-border bg-muted/10">
              <span className="truncate max-w-[200px]">
                {mobileMoneyDetails.proofFileName || t('paymentProofAttached')}
              </span>
              {uploading ? (
                <span className="inline-flex items-center gap-1 text-electric">
                  <Loader2 className="size-3 animate-spin" /> Uploading…
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-500 font-medium">
                  <CheckCircle2 className="size-3.5" /> Ready
                </span>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={compressing}
            className="w-full rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center hover:border-electric hover:bg-electric/5 transition-colors"
          >
            {compressing ? (
              <Loader2 className="mx-auto size-8 text-electric mb-2 animate-spin" />
            ) : (
              <ImagePlus className="mx-auto size-8 text-electric mb-2" />
            )}
            <p className="text-sm font-medium">
              {compressing ? 'Preparing image…' : t('paymentProofUpload')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t('paymentProofFormats')}</p>
          </button>
        )}

        {proofError && <p className="text-sm text-destructive">{proofError}</p>}

        <Button
          onClick={onPlaceOrder}
          disabled={loading || compressing || !isProofReady}
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
    setMobileMoneyDetails,
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
      let mobileDetails = mobileMoneyDetails;

      if (
        selectedPaymentMethodCode === 'mtn-rwanda' ||
        selectedPaymentMethodCode === 'airtel-rwanda'
      ) {
        // If background upload hasn't set proofUrl yet, upload now or fallback to dataUrl
        if (!mobileDetails.proofUrl && mobileDetails.proofDataUrl) {
          const uploaded = await uploadPaymentProof({
            fileBase64: mobileDetails.proofDataUrl,
            fileName: mobileDetails.proofFileName || 'payment-proof.jpg',
            mimeType: mobileDetails.proofMimeType || 'image/jpeg',
          });
          mobileDetails = {
            ...mobileDetails,
            proofUrl: uploaded.url || mobileDetails.proofDataUrl,
          };
          setMobileMoneyDetails(mobileDetails);
        }

        // Final safeguard: fallback to dataUrl if proofUrl is empty
        if (!mobileDetails.proofUrl && mobileDetails.proofDataUrl) {
          mobileDetails = {
            ...mobileDetails,
            proofUrl: mobileDetails.proofDataUrl,
          };
        }

        if (!mobileDetails.proofUrl && !mobileDetails.proofDataUrl) {
          setFormError(t('mobileMoneyFormIncomplete'));
          setLoading(false);
          return;
        }
      }

      const paymentReference = buildPaymentReference(selectedPaymentMethodCode, order.code);
      const metadata = buildPaymentMetadata(selectedPaymentMethodCode, {
        card: selectedPaymentMethodCode === 'card' ? cardDetails : undefined,
        mobile:
          selectedPaymentMethodCode === 'mtn-rwanda' || selectedPaymentMethodCode === 'airtel-rwanda'
            ? mobileDetails
            : undefined,
        paymentReference,
        deliveryDate,
        deliveryMethodName,
      });

      await placeOrderAction(selectedPaymentMethodCode, metadata);
    } catch (error: unknown) {
      // In Next.js, redirect() throws an error with digest NEXT_REDIRECT. Rethrow it!
      const digest = (error as { digest?: string })?.digest;
      if (
        digest?.startsWith?.('NEXT_REDIRECT') ||
        (error instanceof Error && error.message.includes('NEXT_REDIRECT'))
      ) {
        throw error;
      }

      console.error('Error placing order:', error);
      const message = error instanceof Error ? error.message : String(error || '');
      setFormError(
        message && !message.includes('Server Components render') && !message.includes('NEXT_REDIRECT')
          ? message
          : t('unexpectedError'),
      );
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
