'use client';

import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Field, FieldLabel, FieldError, FieldGroup} from '@/components/ui/field';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {useForm} from 'react-hook-form';
import {Loader2, AlertCircle, Pencil} from 'lucide-react';
import {Link, useRouter} from '@/i18n/navigation';
import {setCustomerForOrder, updateCheckoutCustomer, SetCustomerForOrderResult} from '../actions';
import {useCheckout} from '../checkout-provider';
import {useTranslations} from 'next-intl';

interface ContactStepProps {
    onComplete: () => void;
}

interface ContactFormData {
    emailAddress: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
}

export default function ContactStep({onComplete}: ContactStepProps) {
    const t = useTranslations('Checkout');
    const router = useRouter();
    const {order, isGuest, customerProfile} = useCheckout();
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState<SetCustomerForOrderResult | null>(null);

    const prefilled = {
        emailAddress: order.customer?.emailAddress || customerProfile?.emailAddress || '',
        firstName: order.customer?.firstName || customerProfile?.firstName || '',
        lastName: order.customer?.lastName || customerProfile?.lastName || '',
        phoneNumber:
            order.customer?.phoneNumber ||
            customerProfile?.phoneNumber ||
            '',
    };

    const hasPrefill = Boolean(prefilled.emailAddress && prefilled.firstName && prefilled.lastName);

    const {
        register,
        handleSubmit,
        reset,
        formState: {errors},
    } = useForm<ContactFormData>({
        defaultValues: prefilled,
    });

    // Keep form in sync when order/profile loads after refresh
    useEffect(() => {
        reset(prefilled);
        // If we already have account data, start in review mode; empty → editing
        setEditing(!hasPrefill);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when identity fields change
    }, [
        order.customer?.emailAddress,
        order.customer?.firstName,
        order.customer?.lastName,
        order.customer?.phoneNumber,
        customerProfile?.emailAddress,
        customerProfile?.firstName,
        customerProfile?.lastName,
        customerProfile?.phoneNumber,
    ]);

    function getErrorMessage(result: SetCustomerForOrderResult) {
        if (result.success) return null;

        switch (result.errorCode) {
            case 'EMAIL_CONFLICT':
                return (
                    <>
                        {t('emailConflict')}{' '}
                        <Link href="/sign-in?redirectTo=/checkout" className="underline hover:no-underline">
                            {t('emailConflictSignIn')}
                        </Link>{' '}
                        {t('emailConflictSuffix')}
                    </>
                );
            case 'GUEST_CHECKOUT_DISABLED':
                return t('guestCheckoutDisabled');
            case 'NO_ACTIVE_ORDER':
                return (
                    <>
                        {t('cartEmpty')}{' '}
                        <Link href="/" className="underline hover:no-underline">
                            {t('cartEmptyShop')}
                        </Link>
                    </>
                );
            default:
                return result.message;
        }
    }

    const onSubmit = async (data: ContactFormData) => {
        setLoading(true);
        setError(null);

        try {
            if (isGuest) {
                const result = await setCustomerForOrder({
                    emailAddress: data.emailAddress.trim(),
                    firstName: data.firstName.trim(),
                    lastName: data.lastName.trim(),
                    phoneNumber: data.phoneNumber.trim() || undefined,
                });
                if (!result.success) {
                    setError(result);
                    return;
                }
            } else {
                const result = await updateCheckoutCustomer({
                    firstName: data.firstName.trim(),
                    lastName: data.lastName.trim(),
                    phoneNumber: data.phoneNumber.trim() || undefined,
                });
                if (!result.success) {
                    setError({
                        success: false,
                        errorCode: 'UNKNOWN',
                        message: result.message || t('unexpectedError'),
                    });
                    return;
                }
            }

            router.refresh();
            onComplete();
        } catch (err) {
            console.error('Error setting customer:', err);
            setError({success: false, errorCode: 'UNKNOWN', message: t('unexpectedError')});
        } finally {
            setLoading(false);
        }
    };

    const fieldsLocked = hasPrefill && !editing && !isGuest;

    return (
        <div className="space-y-6">
            {isGuest ? (
                <p className="text-sm text-muted-foreground">
                    {t('alreadyHaveAccount')}{' '}
                    <Link href="/sign-in?redirectTo=/checkout" className="text-primary underline hover:no-underline">
                        {t('signInLink')}
                    </Link>
                </p>
            ) : (
                <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{t('contactAutofillHint')}</p>
                    {hasPrefill && (
                        <button
                            type="button"
                            onClick={() => setEditing(v => !v)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-electric hover:underline shrink-0"
                        >
                            <Pencil className="size-3.5" />
                            {editing ? t('doneEditing') : t('edit')}
                        </button>
                    )}
                </div>
            )}

            {error && !error.success && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{getErrorMessage(error)}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
                <FieldGroup>
                    <div className="grid grid-cols-2 gap-4">
                        <Field className="col-span-2">
                            <FieldLabel htmlFor="emailAddress">{t('emailAddress')}</FieldLabel>
                            <Input
                                id="emailAddress"
                                type="email"
                                readOnly={!isGuest}
                                className={!isGuest ? 'bg-muted/50' : undefined}
                                {...register('emailAddress', {
                                    required: t('emailRequired'),
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: t('invalidEmail'),
                                    },
                                })}
                            />
                            {!isGuest && (
                                <p className="text-xs text-muted-foreground mt-1">{t('emailFromAccount')}</p>
                            )}
                            <FieldError>{errors.emailAddress?.message}</FieldError>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="firstName">{t('firstName')}</FieldLabel>
                            <Input
                                id="firstName"
                                readOnly={fieldsLocked}
                                className={fieldsLocked ? 'bg-muted/50' : undefined}
                                {...register('firstName', {required: t('firstNameRequired')})}
                            />
                            <FieldError>{errors.firstName?.message}</FieldError>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="lastName">{t('lastName')}</FieldLabel>
                            <Input
                                id="lastName"
                                readOnly={fieldsLocked}
                                className={fieldsLocked ? 'bg-muted/50' : undefined}
                                {...register('lastName', {required: t('lastNameRequired')})}
                            />
                            <FieldError>{errors.lastName?.message}</FieldError>
                        </Field>

                        <Field className="col-span-2">
                            <FieldLabel htmlFor="phoneNumber">{t('phoneNumberLabel')}</FieldLabel>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                inputMode="tel"
                                readOnly={fieldsLocked}
                                className={fieldsLocked ? 'bg-muted/50' : undefined}
                                placeholder="+2507..."
                                {...register('phoneNumber')}
                            />
                        </Field>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-electric hover:bg-electric/90 text-electric-foreground"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('continue')}
                    </Button>
                </FieldGroup>
            </form>
        </div>
    );
}
