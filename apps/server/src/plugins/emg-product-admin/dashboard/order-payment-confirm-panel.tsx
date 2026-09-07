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
                `Payment confirmed by ${data.emgConfirmOrderPayment.paymentConfirmedByName || 'staff'}. Customer will receive the paid-order email.`,
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

    return (
        <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
                Review the customer payment proof, then confirm once money is verified. The staff
                member who confirms is stored on this order permanently.
            </p>

            {payment ? (
                <div className="rounded-lg border border-border divide-y text-sm">
                    <Row label="Method" value={meta.mobileMoneyProvider || payment.method} />
                    <Row label="Payer name" value={meta.payerAccountName || '—'} />
                    <Row label="Payer phone" value={meta.mobileMoneyPhone || '—'} />
                    <Row label="Transaction ID" value={meta.transactionId || '—'} />
                    <Row label="Reference" value={meta.paymentReference || '—'} />
                    <Row label="Note" value={meta.paymentNote || '—'} />
                    <Row label="Payment state" value={payment.state} />
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
