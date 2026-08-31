'use client';

import {useState, useTransition} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    completeSignupAction,
    requestSignupOtpAction,
    verifySignupOtpAction,
} from './otp-actions';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {PasswordInput} from '@/components/ui/password-input';
import {Card, CardContent} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {cn} from '@/lib/utils';
import {Lock} from 'lucide-react';
import {useTranslations} from 'next-intl';

type Step = 'details' | 'otp' | 'password';

interface RegistrationFormProps {
    redirectTo?: string;
    embedded?: boolean;
}

export function RegistrationForm({redirectTo, embedded = false}: RegistrationFormProps) {
    const t = useTranslations('Auth');
    const [step, setStep] = useState<Step>('details');
    const [isPending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);
    const [otpSentTo, setOtpSentTo] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const detailsSchema = z.object({
        firstName: z.string().min(1, t('firstNameLabel')),
        lastName: z.string().min(1, t('lastNameLabel')),
        emailAddress: z.string().email(t('emailValidation')),
    });

    const otpSchema = z.object({
        code: z.string().min(6, t('otpRequired')).max(6),
    });

    const passwordSchema = z
        .object({
            phoneNumber: z.string().optional(),
            password: z.string().min(8, t('passwordMinLength')),
            confirmPassword: z.string(),
        })
        .refine(data => data.password === data.confirmPassword, {
            message: t('passwordsMismatch'),
            path: ['confirmPassword'],
        });

    const detailsForm = useForm<z.infer<typeof detailsSchema>>({
        resolver: zodResolver(detailsSchema),
        defaultValues: {firstName: '', lastName: '', emailAddress: ''},
    });

    const otpForm = useForm<z.infer<typeof otpSchema>>({
        resolver: zodResolver(otpSchema),
        defaultValues: {code: ''},
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {phoneNumber: '', password: '', confirmPassword: ''},
    });

    const sendOtp = (data: z.infer<typeof detailsSchema>) => {
        setServerError(null);
        startTransition(async () => {
            const result = await requestSignupOtpAction({
                email: data.emailAddress,
                firstName: data.firstName,
                lastName: data.lastName,
            });
            if (result.error) {
                setServerError(result.error);
                return;
            }
            setFirstName(data.firstName);
            setLastName(data.lastName);
            setOtpSentTo(data.emailAddress);
            setStep('otp');
        });
    };

    const confirmOtp = (data: z.infer<typeof otpSchema>) => {
        setServerError(null);
        startTransition(async () => {
            const result = await verifySignupOtpAction(otpSentTo, data.code);
            if (result.error) {
                setServerError(result.error);
                return;
            }
            setStep('password');
        });
    };

    const finishSignup = (data: z.infer<typeof passwordSchema>) => {
        setServerError(null);
        startTransition(async () => {
            const result = await completeSignupAction({
                email: otpSentTo,
                password: data.password,
                phoneNumber: data.phoneNumber,
                redirectTo: redirectTo || '/checkout',
            });
            if (result?.error) {
                setServerError(result.error);
            }
        });
    };

    const content = (
        <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm">
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium',
                        step === 'details' || step === 'otp'
                            ? 'bg-electric/15 text-electric'
                            : 'bg-muted text-muted-foreground',
                    )}
                >
                    <span className="flex size-5 items-center justify-center rounded-full bg-electric text-[11px] text-electric-foreground">
                        1
                    </span>
                    {t('verifyEmailStep')}
                </span>
                <span className="h-px flex-1 bg-border" />
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium',
                        step === 'password'
                            ? 'bg-electric/15 text-electric'
                            : 'bg-muted text-muted-foreground',
                    )}
                >
                    <span className="flex size-5 items-center justify-center rounded-full bg-muted-foreground/20 text-[11px]">
                        2
                    </span>
                    {t('completeRegistrationStep')}
                </span>
            </div>

            {(step === 'details' || step === 'otp') && (
                <div
                    role="alert"
                    className="rounded-lg border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 flex items-start gap-2"
                >
                    <Lock className="size-4 mt-0.5 shrink-0" />
                    {t('verifyEmailBeforeContinue')}
                </div>
            )}

            {step === 'details' && (
                <Form {...detailsForm}>
                    <form onSubmit={detailsForm.handleSubmit(sendOtp)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <FormField
                                control={detailsForm.control}
                                name="firstName"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('firstNameLabel')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={isPending} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={detailsForm.control}
                                name="lastName"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>{t('lastNameLabel')}</FormLabel>
                                        <FormControl>
                                            <Input disabled={isPending} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={detailsForm.control}
                            name="emailAddress"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('emailAddressLabel')}</FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <Input type="email" disabled={isPending} {...field} />
                                        </FormControl>
                                        <Button type="submit" disabled={isPending} className="shrink-0">
                                            {isPending ? t('sending') : t('sendVerificationCode')}
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </form>
                </Form>
            )}

            {step === 'otp' && (
                <Form {...otpForm}>
                    <form onSubmit={otpForm.handleSubmit(confirmOtp)} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {t('otpSentMessage', {email: otpSentTo})}
                        </p>
                        <FormField
                            control={otpForm.control}
                            name="code"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('otpLabel')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            inputMode="numeric"
                                            maxLength={6}
                                            autoComplete="one-time-code"
                                            className="tracking-[0.3em] text-center text-lg font-semibold"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? t('verifyingOtp') : t('verifyOtp')}
                        </Button>
                        <button
                            type="button"
                            className="text-sm text-electric hover:underline w-full"
                            disabled={isPending}
                            onClick={() =>
                                sendOtp({
                                    emailAddress: otpSentTo,
                                    firstName,
                                    lastName,
                                })
                            }
                        >
                            {t('resendOtp')}
                        </button>
                    </form>
                </Form>
            )}

            {step === 'password' && (
                <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(finishSignup)} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            {t('emailVerifiedContinue', {email: otpSentTo})}
                        </p>
                        <FormField
                            control={passwordForm.control}
                            name="phoneNumber"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('phoneNumberLabel')}</FormLabel>
                                    <FormControl>
                                        <Input type="tel" placeholder="+250 780 000 000" disabled={isPending} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={passwordForm.control}
                            name="password"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('passwordLabel')}</FormLabel>
                                    <FormControl>
                                        <PasswordInput disabled={isPending} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>{t('confirmPasswordLabel')}</FormLabel>
                                    <FormControl>
                                        <PasswordInput disabled={isPending} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? t('creatingAccount') : t('createAccount')}
                        </Button>
                    </form>
                </Form>
            )}

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
        </div>
    );

    if (embedded) {
        return content;
    }

    return (
        <Card>
            <CardContent className="pt-6">{content}</CardContent>
        </Card>
    );
}
