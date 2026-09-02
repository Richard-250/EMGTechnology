'use client';

import {useState} from 'react';
import {Check, ChevronLeft, User, Truck, CreditCard, ClipboardCheck} from 'lucide-react';
import {Button} from '@/components/ui/button';
import ContactStep from './steps/contact-step';
import ShippingAddressStep from './steps/shipping-address-step';
import DeliveryStep from './steps/delivery-step';
import PaymentStep from './steps/payment-step';
import ReviewStep from './steps/review-step';
import OrderSummary from './order-summary';
import {useTranslations} from 'next-intl';

type CheckoutStep = 'contact' | 'fulfillment' | 'review' | 'payment';
type FulfillmentPhase = 'address' | 'delivery';

export default function CheckoutFlow() {
    const t = useTranslations('Checkout');

    const stepOrder: CheckoutStep[] = ['contact', 'fulfillment', 'review', 'payment'];

    const getInitialState = () => {
        const completed = new Set<CheckoutStep>();
        const current: CheckoutStep = 'contact';
        const fulfillmentPhase: FulfillmentPhase = 'address';
        return {completed, current, fulfillmentPhase};
    };

    const initial = getInitialState();
    const [currentStep, setCurrentStep] = useState<CheckoutStep>(initial.current);
    const [completedSteps, setCompletedSteps] = useState<Set<CheckoutStep>>(initial.completed);
    const [fulfillmentPhase, setFulfillmentPhase] = useState<FulfillmentPhase>(initial.fulfillmentPhase);

    const stepMeta: Record<CheckoutStep, {label: string; icon: typeof User}> = {
        contact: {label: t('steps.contact'), icon: User},
        fulfillment: {label: t('steps.fulfillment'), icon: Truck},
        review: {label: t('steps.review'), icon: ClipboardCheck},
        payment: {label: t('steps.payment'), icon: CreditCard},
    };

    const currentIndex = stepOrder.indexOf(currentStep);

    const goBack = () => {
        if (currentStep === 'fulfillment' && fulfillmentPhase === 'delivery') {
            setFulfillmentPhase('address');
            return;
        }
        if (currentIndex > 0) {
            const previous = stepOrder[currentIndex - 1];
            setCurrentStep(previous);
            if (previous === 'fulfillment') {
                setFulfillmentPhase('delivery');
            }
        }
    };

    const completeStep = (step: CheckoutStep) => {
        setCompletedSteps(prev => new Set([...prev, step]));
        const idx = stepOrder.indexOf(step);
        if (idx < stepOrder.length - 1) {
            setCurrentStep(stepOrder[idx + 1]);
        }
    };

    const handleFulfillmentAddressComplete = () => {
        setFulfillmentPhase('delivery');
    };

    const handleFulfillmentComplete = () => {
        completeStep('fulfillment');
    };

    const handlePayNow = () => {
        completeStep('review');
    };

    return (
        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
            <div>
                <nav className="flex flex-wrap gap-2 mb-6" aria-label={t('checkoutProgress')}>
                    {stepOrder.map(step => {
                        const done = completedSteps.has(step);
                        const active = currentStep === step;
                        const Icon = stepMeta[step].icon;
                        return (
                            <button
                                key={step}
                                type="button"
                                disabled={!done && !active}
                                onClick={() => done && setCurrentStep(step)}
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors ${
                                    active
                                        ? 'bg-electric text-electric-foreground shadow-sm'
                                        : done
                                          ? 'bg-electric/15 text-electric hover:bg-electric/25'
                                          : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                <span
                                    className={`flex size-6 items-center justify-center rounded-full text-[11px] ${
                                        active ? 'bg-electric-foreground/20' : done ? 'bg-electric/20' : 'bg-background'
                                    }`}
                                >
                                    {done && !active ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                                </span>
                                {stepMeta[step].label}
                            </button>
                        );
                    })}
                </nav>

                <section className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm min-h-[320px]">
                    {currentStep === 'contact' && (
                        <>
                            <h2 className="flex items-center gap-2 text-lg font-bold mb-5">
                                <User className="size-5 text-electric" />
                                {t('contactInformation')}
                            </h2>
                            <ContactStep onComplete={() => completeStep('contact')} />
                        </>
                    )}

                    {currentStep === 'fulfillment' && (
                        <>
                            <h2 className="flex items-center gap-2 text-lg font-bold mb-5">
                                <Truck className="size-5 text-electric" />
                                {fulfillmentPhase === 'address' ? t('shippingAddress') : t('deliveryMethod')}
                            </h2>
                            {fulfillmentPhase === 'address' ? (
                                <ShippingAddressStep onComplete={handleFulfillmentAddressComplete} />
                            ) : (
                                <DeliveryStep onComplete={handleFulfillmentComplete} />
                            )}
                        </>
                    )}

                    {currentStep === 'review' && (
                        <>
                            <h2 className="flex items-center gap-2 text-lg font-bold mb-5">
                                <ClipboardCheck className="size-5 text-electric" />
                                {t('reviewYourOrder')}
                            </h2>
                            <ReviewStep
                                onEditStep={step => {
                                    if (step === 'contact') setCurrentStep('contact');
                                    else if (step === 'shipping' || step === 'delivery') {
                                        setCurrentStep('fulfillment');
                                        setFulfillmentPhase(step === 'shipping' ? 'address' : 'delivery');
                                    }
                                }}
                                onPayNow={handlePayNow}
                            />
                        </>
                    )}

                    {currentStep === 'payment' && (
                        <>
                            <h2 className="flex items-center gap-2 text-lg font-bold mb-5">
                                <CreditCard className="size-5 text-electric" />
                                {t('completePayment')}
                            </h2>
                            <PaymentStep />
                        </>
                    )}

                    {currentStep !== 'review' && currentStep !== 'payment' && (
                        <div className="flex justify-between mt-8 pt-5 border-t border-border">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={goBack}
                                disabled={
                                    currentIndex === 0 &&
                                    !(currentStep === 'fulfillment' && fulfillmentPhase === 'delivery')
                                }
                                className="gap-1"
                            >
                                <ChevronLeft className="size-4" />
                                {t('back')}
                            </Button>
                            {currentStep === 'fulfillment' && fulfillmentPhase === 'address' && (
                                <p className="text-xs text-muted-foreground self-center">{t('fulfillmentHint')}</p>
                            )}
                        </div>
                    )}

                    {currentStep === 'payment' && (
                        <div className="flex justify-start mt-8 pt-5 border-t border-border">
                            <Button type="button" variant="outline" onClick={goBack} className="gap-1">
                                <ChevronLeft className="size-4" />
                                {t('back')}
                            </Button>
                        </div>
                    )}
                </section>
            </div>

            <div className="lg:sticky lg:top-28">
                <OrderSummary />
            </div>
        </div>
    );
}
