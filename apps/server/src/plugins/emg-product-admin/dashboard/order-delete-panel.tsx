import {api, Button, Input, Label, graphql} from '@vendure/dashboard';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Loader2, Trash2} from 'lucide-react';
import {useMemo, useState} from 'react';
import {toast} from 'sonner';

const orderDeleteQuery = graphql(`
    query EmgOrderDeleteInfo($id: ID!) {
        order(id: $id) {
            id
            code
            state
            lines {
                id
                quantity
            }
        }
    }
`);

const cancelOrderMutation = graphql(`
    mutation EmgCancelOrder($input: CancelOrderInput!) {
        cancelOrder(input: $input) {
            __typename
            ... on Order {
                id
                code
                state
            }
            ... on ErrorResult {
                errorCode
                message
            }
        }
    }
`);

/**
 * GitHub-style delete: type the order code twice before canceling the full order.
 */
export function OrderDeletePanel({context}: {context: {entity?: {id?: string; code?: string}}}) {
    const orderId = context.entity?.id;
    const queryClient = useQueryClient();
    const [step, setStep] = useState<'idle' | 'confirm'>('idle');
    const [typedCode, setTypedCode] = useState('');
    const [confirmPhrase, setConfirmPhrase] = useState('');

    const orderQuery = useQuery({
        queryKey: ['emg-order-delete', orderId],
        queryFn: () => api.query(orderDeleteQuery, {id: orderId!}),
        enabled: Boolean(orderId),
    });

    const order = orderQuery.data?.order;
    const orderCode = order?.code || context.entity?.code || '';
    const canDelete =
        Boolean(order) &&
        order!.state !== 'Cancelled' &&
        order!.state !== 'Delivered' &&
        (order!.lines?.length ?? 0) > 0;

    const codeMatches = useMemo(
        () => typedCode.trim().toUpperCase() === orderCode.toUpperCase() && orderCode.length > 0,
        [typedCode, orderCode],
    );
    const phraseMatches = confirmPhrase.trim() === 'delete my order';

    const cancelMutation = useMutation({
        mutationFn: async () => {
            if (!order) throw new Error('Order not loaded');
            return api.mutate(cancelOrderMutation, {
                input: {
                    orderId: order.id,
                    cancelShipping: true,
                    reason: 'Deleted by administrator (double-confirmed)',
                    lines: order.lines.map((line: {id: string; quantity: number}) => ({
                        orderLineId: line.id,
                        quantity: line.quantity,
                    })),
                },
            });
        },
        onSuccess: async data => {
            const result = data.cancelOrder;
            if (result.__typename !== 'Order') {
                toast.error('Could not delete order', {
                    description: 'message' in result ? String(result.message) : 'Unknown error',
                });
                return;
            }
            toast.success(`Order #${result.code} deleted (cancelled)`);
            setStep('idle');
            setTypedCode('');
            setConfirmPhrase('');
            await queryClient.invalidateQueries({queryKey: ['emg-order-delete', orderId]});
            await queryClient.invalidateQueries({queryKey: ['DetailPage']});
            await queryClient.invalidateQueries({queryKey: ['emg-pending-payment-orders']});
        },
        onError: (error: Error) => {
            toast.error('Could not delete order', {description: error.message});
        },
    });

    if (!orderId) return null;
    if (orderQuery.isLoading) {
        return <p className="text-sm text-muted-foreground">Loading…</p>;
    }
    if (!order) {
        return <p className="text-sm text-muted-foreground">Order not found.</p>;
    }
    if (order.state === 'Cancelled') {
        return <p className="text-sm text-muted-foreground">This order is already cancelled.</p>;
    }
    if (!canDelete) {
        return (
            <p className="text-sm text-muted-foreground">
                This order cannot be deleted in its current state ({order.state}).
            </p>
        );
    }

    if (step === 'idle') {
        return (
            <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                    Permanently cancel this order. You will need to type the order code to confirm —
                    this cannot be undone accidentally.
                </p>
                <Button type="button" variant="destructive" className="w-full" onClick={() => setStep('confirm')}>
                    <Trash2 className="mr-2 size-4" />
                    Delete order…
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4 text-sm">
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 space-y-1">
                <p className="font-medium text-destructive">Delete order #{orderCode}</p>
                <p className="text-muted-foreground">
                    This cancels the order and cannot be undone. Type the order code and confirmation
                    phrase below.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="emg-delete-order-code">
                    Type <span className="font-mono font-semibold">{orderCode}</span> to confirm
                </Label>
                <Input
                    id="emg-delete-order-code"
                    value={typedCode}
                    onChange={e => setTypedCode(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={orderCode}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="emg-delete-order-phrase">
                    Type <span className="font-mono font-semibold">delete my order</span>
                </Label>
                <Input
                    id="emg-delete-order-phrase"
                    value={confirmPhrase}
                    onChange={e => setConfirmPhrase(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="delete my order"
                />
            </div>

            <div className="flex gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                        setStep('idle');
                        setTypedCode('');
                        setConfirmPhrase('');
                    }}
                    disabled={cancelMutation.isPending}
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    variant="destructive"
                    className="flex-1"
                    disabled={!codeMatches || !phraseMatches || cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate()}
                >
                    {cancelMutation.isPending ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                        <Trash2 className="mr-2 size-4" />
                    )}
                    I understand, delete
                </Button>
            </div>
        </div>
    );
}
