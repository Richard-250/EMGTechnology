import {api, Button, graphql} from '@vendure/dashboard';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
    AlertCircle,
    AlertTriangle,
    BadgeCheck,
    Check,
    CheckCircle2,
    Copy,
    ExternalLink,
    Info,
    Loader2,
    MessageCircle,
    Phone,
    RotateCw,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {toast} from 'sonner';

const orderPaymentQuery = graphql(`
    query EmgOrderPaymentProof($id: ID!) {
        order(id: $id) {
            id
            code
            state
            totalWithTax
            currencyCode
            customer {
                id
                firstName
                lastName
                emailAddress
                phoneNumber
            }
            shippingAddress {
                fullName
                phoneNumber
                city
                province
                streetLine1
                streetLine2
            }
            customFields {
                paymentConfirmedByName
                paymentConfirmedAt
                deliveryDate
                paymentProofUrl
            }
            payments {
                id
                method
                state
                amount
                metadata
                createdAt
                transactionId
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

function normalizeProofUrl(rawUrl?: string | null): string {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    const trimmed = rawUrl.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('data:image/')) {
        return trimmed;
    }
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://emgtechnologyltd.com';
    let path = trimmed.replace(/^\//, '');
    if (!path.startsWith('assets/') && (path.startsWith('preview/') || path.startsWith('source/'))) {
        path = `assets/${path}`;
    }
    return `${origin.replace(/\/$/, '')}/${path}`;
}

/** Pull a payment-proof image URL from arbitrary payment metadata JSON. */
function extractProofUrlFromMetadata(metadata: unknown): string {
    if (!metadata || typeof metadata !== 'object') return '';
    const meta = metadata as Record<string, unknown>;
    const keys = [
        'paymentProofUrl',
        'proofUrl',
        'paymentProof',
        'proofImageUrl',
        'screenshotUrl',
        'url',
    ];
    for (const key of keys) {
        const value = meta[key];
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }
    for (const value of Object.values(meta)) {
        if (typeof value === 'string') {
            const v = value.trim();
            if (
                (v.startsWith('http') || v.startsWith('/') || v.startsWith('data:image/')) &&
                (/payment-proof|\/assets\/|\/preview\/|\/uploads\/|cloudinary|\.(jpe?g|png|webp|gif)(\?|$)/i.test(
                    v,
                ) ||
                    /proof/i.test(v))
            ) {
                return v;
            }
        } else if (value && typeof value === 'object') {
            const nested = extractProofUrlFromMetadata(value);
            if (nested) return nested;
        }
    }
    return '';
}

function formatMoney(amountMajor: number, currencyCode = 'RWF'): string {
    const isRwf = currencyCode.toUpperCase() === 'RWF';
    if (isRwf) {
        return `${Math.round(amountMajor).toLocaleString()} RWF`;
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
    }).format(amountMajor);
}

function cleanPhoneForWhatsApp(phone?: string | null): string {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('0')) {
        return `250${digits.slice(1)}`;
    }
    if (digits.length === 9) {
        return `250${digits}`;
    }
    return digits;
}

export function OrderPaymentConfirmPanel({context}: {context: {entity?: {id?: string}}}) {
    const orderId = context.entity?.id;
    const queryClient = useQueryClient();

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [verifiedAmountStr, setVerifiedAmountStr] = useState<string>('');
    const [checklistChecked, setChecklistChecked] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
                `Payment confirmed by ${data.emgConfirmOrderPayment.paymentConfirmedByName || 'staff'}. Customer & staff notified.`,
            );
            await queryClient.invalidateQueries({queryKey: ['emg-order-payment-proof', orderId]});
            await queryClient.invalidateQueries({queryKey: ['DetailPage']});
            await queryClient.invalidateQueries({queryKey: ['emg-pending-payment-orders']});
        },
        onError: (error: Error) => {
            toast.error('Could not confirm payment', {description: error.message});
        },
    });

    const order = orderQuery.data?.order;

    // Resolve payment and metadata
    const payment = useMemo(() => {
        if (!order?.payments?.length) return null;
        return (
            order.payments.find((p: {state: string}) => p.state === 'Authorized') ||
            order.payments.find((p: {metadata?: unknown}) =>
                Boolean(extractProofUrlFromMetadata(p.metadata)),
            ) ||
            order.payments[order.payments.length - 1]
        );
    }, [order?.payments]);

    const meta = useMemo(() => {
        return (payment?.metadata ?? {}) as Record<string, string>;
    }, [payment?.metadata]);

    const proofUrl = useMemo(() => {
        const fromOrderField = (order?.customFields as {paymentProofUrl?: string} | undefined)
            ?.paymentProofUrl;
        const fromMeta = extractProofUrlFromMetadata(payment?.metadata);
        // Scan all payments if the selected one has no proof
        let fromAnyPayment = fromMeta;
        if (!fromAnyPayment && order?.payments?.length) {
            for (const p of order.payments) {
                fromAnyPayment = extractProofUrlFromMetadata(p.metadata);
                if (fromAnyPayment) break;
            }
        }
        return normalizeProofUrl(fromOrderField || fromAnyPayment || '');
    }, [order?.customFields, order?.payments, payment?.metadata]);

    // Expected order total in major units
    const expectedMajor = useMemo(() => {
        if (!order?.totalWithTax) return 0;
        return order.totalWithTax / 100;
    }, [order?.totalWithTax]);

    const currency = order?.currencyCode || 'RWF';

    // Pre-fill verified amount input with expected amount
    useEffect(() => {
        if (expectedMajor > 0 && verifiedAmountStr === '') {
            setVerifiedAmountStr(String(Math.round(expectedMajor)));
        }
    }, [expectedMajor, verifiedAmountStr]);

    const verifiedAmount = Number(verifiedAmountStr.replace(/,/g, '')) || 0;
    const diff = verifiedAmount - expectedMajor;
    const isExact = Math.abs(diff) < 0.01;
    const isUnderpaid = diff < -0.01;
    const isOverpaid = diff > 0.01;

    // Close lightbox on Escape key
    useEffect(() => {
        if (!lightboxOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen]);

    const copyToClipboard = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        toast.success('Copied message to clipboard');
        setTimeout(() => setCopiedKey(null), 3000);
    };

    if (!orderId) return null;

    if (orderQuery.isLoading) {
        return (
            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span>Loading payment verification details…</span>
            </div>
        );
    }

    if (orderQuery.isError || !order) {
        return (
            <p className="text-sm text-destructive p-2">
                Could not load payment proof for this order. Refresh the page to retry.
            </p>
        );
    }

    const customerName =
        [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') ||
        order.shippingAddress?.fullName ||
        'Customer';
    const customerPhone = order.customer?.phoneNumber || order.shippingAddress?.phoneNumber || '';
    const waPhone = cleanPhoneForWhatsApp(customerPhone);
    const confirmedName = order.customFields?.paymentConfirmedByName;
    const confirmedAt = order.customFields?.paymentConfirmedAt;
    const isConfirmed = Boolean(confirmedName) || payment?.state === 'Settled';
    const isAwaiting = !isConfirmed && (order.state === 'PaymentAuthorized' || payment?.state === 'Authorized');

    // Messages for underpayment and overpayment
    const underpaymentMsg = `Hello ${customerName}, thank you for your EMG Technology order #${order.code}. We received your payment proof of ${formatMoney(verifiedAmount, currency)}, but the total order amount is ${formatMoney(expectedMajor, currency)}. Please pay the remaining balance of ${formatMoney(Math.abs(diff), currency)} so we can dispatch your delivery. For assistance, contact +250 788 316 024. Thank you!`;

    const overpaymentMsg = `Hello ${customerName}, thank you for your EMG Technology order #${order.code}! We verified your payment proof of ${formatMoney(verifiedAmount, currency)} against the order total of ${formatMoney(expectedMajor, currency)}. You have an excess balance of ${formatMoney(diff, currency)} which will be refunded to your account. For assistance, contact +250 788 316 024. Thank you!`;

    return (
        <div className="space-y-4 text-sm">
            {/* Header Status & Financial Overview */}
            <div className="rounded-xl border border-border bg-card p-3.5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5">
                    <div>
                        <span className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
                            Order #{order.code}
                        </span>
                        <p className="text-base font-bold text-foreground mt-0.5">
                            {formatMoney(expectedMajor, currency)}
                        </p>
                    </div>
                    {isConfirmed ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            <BadgeCheck className="size-3.5" />
                            Confirmed
                        </span>
                    ) : isAwaiting ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                            ● Needs Confirmation
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            {order.state}
                        </span>
                    )}
                </div>

                {/* Customer Contact Details */}
                <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Customer:</span>
                        <span className="font-semibold text-foreground text-right">{customerName}</span>
                    </div>

                    {customerPhone && (
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Phone:</span>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`tel:${customerPhone}`}
                                    className="font-mono text-electric hover:underline flex items-center gap-1"
                                    title="Call customer"
                                >
                                    <Phone className="size-3" />
                                    {customerPhone}
                                </a>
                                {waPhone && (
                                    <a
                                        href={`https://wa.me/${waPhone}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 hover:text-emerald-500 flex items-center gap-0.5 font-medium"
                                        title="Open WhatsApp chat"
                                    >
                                        <MessageCircle className="size-3.5" />
                                        WhatsApp
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Payment Method:</span>
                        <span className="font-medium text-foreground text-right">
                            {meta.mobileMoneyProvider || payment?.method || 'Mobile Money'}
                        </span>
                    </div>

                    {meta.paymentReference && (
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Reference:</span>
                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">
                                {meta.paymentReference}
                            </span>
                        </div>
                    )}

                    {order.customFields?.deliveryDate && (
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Delivery Date:</span>
                            <span className="font-medium text-foreground text-right">
                                {order.customFields.deliveryDate}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Proof Screenshot Section */}
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <ExternalLink className="size-3.5" />
                        Customer Payment Proof
                    </span>
                    {proofUrl && (
                        <a
                            href={proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-electric hover:underline font-medium"
                        >
                            Open raw
                        </a>
                    )}
                </div>

                {proofUrl ? (
                    <div className="p-3 space-y-2.5">
                        <div
                            onClick={() => setLightboxOpen(true)}
                            className="relative group cursor-pointer overflow-hidden rounded-lg border border-border bg-muted/20 flex items-center justify-center min-h-[180px] max-h-[320px] transition-all hover:border-electric/50"
                            title="Click to view full size and zoom receipt"
                        >
                            <img
                                src={proofUrl}
                                alt={`Payment proof for order #${order.code}`}
                                className="w-full h-auto max-h-[300px] object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-medium backdrop-blur-xs">
                                <ZoomIn className="size-4" />
                                <span>Click to Enlarge & Inspect</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setLightboxOpen(true)}
                                className="w-full text-xs font-medium"
                            >
                                <ZoomIn className="size-3.5 mr-1.5" />
                                Inspect Receipt (Zoom)
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 text-center space-y-2 bg-amber-500/5">
                        <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 mx-auto" />
                        <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                            No payment screenshot attached
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Customer may have used Card, or the upload did not save. Check Payment
                            details → Payment metadata for <code>paymentProofUrl</code>.
                        </p>
                        {payment?.metadata ? (
                            <pre className="text-left text-[10px] max-h-28 overflow-auto rounded bg-muted/60 p-2 text-muted-foreground whitespace-pre-wrap break-all">
                                {JSON.stringify(payment.metadata, null, 2)}
                            </pre>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Amount Verification & Discrepancy Tool */}
            <div className="rounded-xl border border-border bg-card p-3.5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Amount Verification
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Expected: <strong>{formatMoney(expectedMajor, currency)}</strong>
                    </span>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                        Amount shown on customer receipt / SMS:
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={verifiedAmountStr}
                            onChange={e => setVerifiedAmountStr(e.target.value)}
                            className="w-full h-9 px-3 py-1.5 rounded-lg border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-electric/40"
                            placeholder="Enter amount from screenshot"
                        />
                        <span className="absolute right-3 top-2 text-xs font-medium text-muted-foreground">
                            {currency}
                        </span>
                    </div>
                </div>

                {/* Verification Result Badges & Alerts */}
                {isExact && (
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                        <div>
                            <p className="font-semibold">Full Payment Verified</p>
                            <p className="text-muted-foreground text-xs mt-0.5">
                                Customer paid the exact amount ({formatMoney(expectedMajor, currency)}). Ready to confirm.
                            </p>
                        </div>
                    </div>
                )}

                {isUnderpaid && (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs space-y-2">
                        <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
                            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div>
                                <p className="font-bold text-amber-700 dark:text-amber-400">
                                    Underpayment Detected (Shortfall: {formatMoney(Math.abs(diff), currency)})
                                </p>
                                <p className="text-muted-foreground mt-0.5">
                                    Customer paid {formatMoney(verifiedAmount, currency)} of {formatMoney(expectedMajor, currency)}. They must pay the remaining {formatMoney(Math.abs(diff), currency)} before delivery, or order will be cancelled.
                                </p>
                            </div>
                        </div>

                        {/* Fast Action Buttons for Underpaid */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => copyToClipboard(underpaymentMsg, 'underpaid')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-background border border-border hover:bg-muted transition-colors"
                            >
                                {copiedKey === 'underpaid' ? (
                                    <Check className="size-3 text-emerald-600" />
                                ) : (
                                    <Copy className="size-3" />
                                )}
                                Copy Reminder Message
                            </button>
                            {waPhone && (
                                <a
                                    href={`https://wa.me/${waPhone}?text=${encodeURIComponent(underpaymentMsg)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                                >
                                    <MessageCircle className="size-3" />
                                    WhatsApp Reminder
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {isOverpaid && (
                    <div className="rounded-lg border border-blue-500/40 bg-blue-500/10 p-3 text-xs space-y-2">
                        <div className="flex items-start gap-2 text-blue-900 dark:text-blue-200">
                            <Info className="size-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                                <p className="font-bold text-blue-700 dark:text-blue-400">
                                    Overpayment Detected (Excess: {formatMoney(diff, currency)})
                                </p>
                                <p className="text-muted-foreground mt-0.5">
                                    Customer paid {formatMoney(verifiedAmount, currency)} instead of {formatMoney(expectedMajor, currency)}. EMG must refund {formatMoney(diff, currency)} to the customer.
                                </p>
                            </div>
                        </div>

                        {/* Fast Action Buttons for Overpaid */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            <button
                                type="button"
                                onClick={() => copyToClipboard(overpaymentMsg, 'overpaid')}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-background border border-border hover:bg-muted transition-colors"
                            >
                                {copiedKey === 'overpaid' ? (
                                    <Check className="size-3 text-emerald-600" />
                                ) : (
                                    <Copy className="size-3" />
                                )}
                                Copy Refund Notice
                            </button>
                            {waPhone && (
                                <a
                                    href={`https://wa.me/${waPhone}?text=${encodeURIComponent(overpaymentMsg)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                >
                                    <MessageCircle className="size-3" />
                                    WhatsApp Refund Notice
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Confirmation Section */}
            {isConfirmed ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs space-y-1">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <BadgeCheck className="size-4" />
                        Payment Verified & Confirmed by {confirmedName || 'Staff'}
                    </p>
                    {confirmedAt && (
                        <p className="text-muted-foreground text-xs">
                            Confirmed at {new Date(confirmedAt).toLocaleString()}
                        </p>
                    )}
                </div>
            ) : isAwaiting ? (
                <div className="space-y-3 pt-1">
                    <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-muted-foreground">
                        <input
                            type="checkbox"
                            checked={checklistChecked}
                            onChange={e => setChecklistChecked(e.target.checked)}
                            className="mt-0.5 rounded border-border text-electric focus:ring-electric"
                        />
                        <span>
                            I have visually examined the payment screenshot and verified that the transaction reference and amount match.
                        </span>
                    </label>

                    <Button
                        type="button"
                        onClick={() => confirmMutation.mutate(payment?.id)}
                        disabled={confirmMutation.isPending || !checklistChecked}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                    >
                        {confirmMutation.isPending ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                        ) : (
                            <BadgeCheck className="mr-2 size-4" />
                        )}
                        Confirm Payment Received
                    </Button>
                </div>
            ) : null}

            {/* Full-Screen Lightbox Modal for Receipt Inspection */}
            {lightboxOpen && proofUrl && (
                <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    {/* Top Controls Bar */}
                    <div className="w-full max-w-4xl flex items-center justify-between pb-3 text-white">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">
                                Proof of Payment — Order #{order.code}
                            </span>
                            <span className="text-xs text-zinc-400">
                                ({customerName})
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setZoomLevel(prev => Math.min(prev + 0.3, 3))}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                title="Zoom in"
                            >
                                <ZoomIn className="size-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setZoomLevel(prev => Math.max(prev - 0.3, 0.7))}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                title="Zoom out"
                            >
                                <ZoomOut className="size-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setRotation(prev => (prev + 90) % 360)}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                title="Rotate clockwise"
                            >
                                <RotateCw className="size-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setZoomLevel(1);
                                    setRotation(0);
                                }}
                                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white transition-colors"
                                title="Reset view"
                            >
                                Reset
                            </button>
                            <a
                                href={proofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                                title="Open in new window"
                            >
                                <ExternalLink className="size-4" />
                            </a>
                            <button
                                type="button"
                                onClick={() => setLightboxOpen(false)}
                                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors ml-2"
                                title="Close (Esc)"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>

                    {/* Enlarged Image Area */}
                    <div
                        onClick={e => {
                            if (e.target === e.currentTarget) setLightboxOpen(false);
                        }}
                        className="w-full max-w-4xl max-h-[82vh] overflow-auto flex items-center justify-center rounded-xl bg-zinc-950/80 border border-white/10 p-4"
                    >
                        <img
                            src={proofUrl}
                            alt="Receipt screenshot enlarged"
                            style={{
                                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                                transformOrigin: 'center center',
                                transition: 'transform 0.15s ease-out',
                            }}
                            className="max-h-[76vh] max-w-full object-contain select-none"
                        />
                    </div>

                    {/* Bottom Helper Bar */}
                    <div className="w-full max-w-4xl flex items-center justify-between pt-2 text-xs text-zinc-400">
                        <span>Expected: <strong>{formatMoney(expectedMajor, currency)}</strong></span>
                        <span>Click outside or press Esc to close</span>
                    </div>
                </div>
            )}
        </div>
    );
}
