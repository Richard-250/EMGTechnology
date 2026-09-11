import {api, Button, graphql} from '@vendure/dashboard';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {BadgeCheck, Loader2} from 'lucide-react';
import {toast} from 'sonner';

const orderPaymentQuery = graphql(`
    query EmgOrderPaymentProof($id: ID!) {
        order(id: $id) {
            id
            code
            state
            totalWithTax
            currencyCode
            customFields {
                paymentConfirmedByName
                paymentConfirmedAt
            }
            payments {
                id
                method
                state
                amount
                metadata
            }
        }
    }
`);

const confirmPaymentMutation = graphql(`
    mutation EmgConfirmOrderPayment($orderId: ID!, $paymentId: ID) {
        emgConfirmOrderPayment(orderId: $orderId, paymentId: $paymentId) {
            id
            code
            state
            paymentConfirmedByName
            paymentConfirmedAt
        }
    }
`);

export function OrderPaymentConfirmPanel({context}: {context: {entity?: {id?: string}}}) {
    const orderId = context.entity?.id;
    const queryClient = useQueryClient();

    const orderQuery = useQuery({
        queryKey: ['emg-order-payment-proof', orderId],
        queryFn: () => api.query(orderPaymentQuery, {id: orderId!}),
        enabled: Boolean(orderId),
        retry: 1,
    });

    const confirmMutation = useMutation({
        mutationFn: async (paymentId?: string) =>
            api.mutate(confirmPaymentMutation, {orderId, paymentId}),
        onSuccess: async data => {
            toast.success(
                `Payment confirmed by ${data.emgConfirmOrderPayment.paymentConfirmedByName || 'staff'}. Customer and staff will receive confirmation emails.`,
            );
            await queryClient.invalidateQueries({queryKey: ['emg-order-payment-proof', orderId]});
            await queryClient.invalidateQueries({queryKey: ['DetailPage']});
            await queryClient.invalidateQueries({queryKey: ['emg-pending-payment-orders']});
        },
        onError: (error: Error) => {
            toast.error('Could not confirm payment', {description: error.message});
        },
    });

    if (!orderId) return null;

    if (orderQuery.isLoading) {
        return <p className="text-sm text-muted-foreground">Loading payment details…</p>;
    }
    if (orderQuery.isError) {
        return (
            <p className="text-sm text-destructive">
                Could not load payment proof. Restart the API after deploy so order custom fields are
                created, then refresh this page.
            </p>
        );
    }

    const order = orderQuery.data?.order;
    if (!order) {
        return <p className="text-sm text-muted-foreground">Order not found.</p>;
    }

    const payment =
        order.payments?.find((p: {state: string}) => p.state === 'Authorized') ||
        order.payments?.[order.payments.length - 1];
    const meta = (payment?.metadata ?? {}) as Record<string, string>;
    const confirmedName = order.customFields?.paymentConfirmedByName;
    const confirmedAt = order.customFields?.paymentConfirmedAt;
    const awaiting = order.state === 'PaymentAuthorized' || payment?.state === 'Authorized';
    const proofUrl = meta.paymentProofUrl || '';

    return (
        <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
                Review the customer payment screenshot, then confirm once the money is verified. The
                customer and administrators are emailed when you confirm.
            </p>

            {payment ? (
                <div className="space-y-3">
                    <div className="rounded-lg border border-border divide-y text-sm">
                        <Row label="Method" value={meta.mobileMoneyProvider || payment.method} />
                        <Row label="Reference" value={meta.paymentReference || '—'} />
                        <Row label="Payment state" value={payment.state} />
                    </div>

                    {proofUrl ? (
                        <div className="rounded-lg border border-border overflow-hidden bg-muted/20">
                            <div className="px-3 py-2 border-b border-border text-muted-foreground">
                                Payment screenshot
                            </div>
                            <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="block p-3">
                                <img
                                    src={proofUrl}
                                    alt="Customer payment proof"
                                    className="max-h-80 w-full object-contain rounded-md bg-background"
                                />
                            </a>
                            <div className="px-3 pb-3">
                                <a
                                    href={proofUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-electric hover:underline"
                                >
                                    Open full size
                                </a>
                            </div>
                        </div>
                    ) : (
                        <p className="text-amber-700 dark:text-amber-400 text-sm">
                            No payment screenshot was attached to this order.
                        </p>
                    )}
                </div>
            ) : (
                <p className="text-muted-foreground">No payment recorded yet.</p>
            )}

            {confirmedName ? (
                <div className="rounded-lg border border-electric/30 bg-electric/5 px-3 py-2.5">
                    <p className="font-medium text-electric flex items-center gap-1.5">
                        <BadgeCheck className="size-4" />
                        Confirmed by {confirmedName}
                    </p>
                    {confirmedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {new Date(confirmedAt).toLocaleString()}
                        </p>
                    )}
                </div>
            ) : null}

            {awaiting && (
                <Button
                    type="button"
                    onClick={() => confirmMutation.mutate(payment?.id)}
                    disabled={confirmMutation.isPending}
                    className="w-full"
                >
                    {confirmMutation.isPending ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                        <BadgeCheck className="mr-2 size-4" />
                    )}
                    Confirm payment received
                </Button>
            )}
        </div>
    );
}

function Row({label, value}: {label: string; value: string}) {
    return (
        <div className="flex justify-between gap-3 px-3 py-2">
            <span className="text-muted-foreground shrink-0">{label}</span>
            <span className="font-medium text-right break-all">{value}</span>
        </div>
    );
}
