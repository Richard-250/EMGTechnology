import {Badge} from '@vendure/dashboard';

/**
 * Distinct, high-contrast order-state badges for the admin order list.
 * Mirrors the storefront customer order status colors so staff can triage at a glance.
 */
const STATE_STYLES: Record<string, string> = {
    AddingItems:
        'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/40',
    ArrangingPayment:
        'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40',
    ArrangingAdditionalPayment:
        'bg-amber-100 text-amber-800 border-amber-400 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40',
    PaymentAuthorized:
        'bg-amber-100 text-amber-900 border-amber-500 dark:bg-amber-500/25 dark:text-amber-200 dark:border-amber-400/50 animate-pulse',
    PaymentSettled:
        'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40',
    PartiallyShipped:
        'bg-blue-100 text-blue-800 border-blue-400 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40',
    Shipped:
        'bg-blue-100 text-blue-900 border-blue-500 dark:bg-blue-500/25 dark:text-blue-200 dark:border-blue-400/50',
    PartiallyDelivered:
        'bg-violet-100 text-violet-800 border-violet-400 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/40',
    Delivered:
        'bg-violet-100 text-violet-900 border-violet-500 dark:bg-violet-500/25 dark:text-violet-200 dark:border-violet-400/50',
    Cancelled:
        'bg-red-100 text-red-800 border-red-400 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40',
    Modifying:
        'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30',
    Draft: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30',
};

const STATE_DOT: Record<string, string> = {
    AddingItems: 'bg-slate-400',
    ArrangingPayment: 'bg-amber-500',
    ArrangingAdditionalPayment: 'bg-amber-500',
    PaymentAuthorized: 'bg-amber-500',
    PaymentSettled: 'bg-emerald-500',
    PartiallyShipped: 'bg-blue-500',
    Shipped: 'bg-blue-600',
    PartiallyDelivered: 'bg-violet-500',
    Delivered: 'bg-violet-600',
    Cancelled: 'bg-red-500',
    Modifying: 'bg-slate-400',
    Draft: 'bg-slate-400',
};

function humanizeState(state: string): string {
    return state.replace(/([a-z])([A-Z])/g, '$1 $2');
}

type CellContextLike = {
    getValue?: () => unknown;
    cell?: {getValue?: () => unknown};
    row?: {original?: {state?: string}};
};

export function EmgOrderStateBadge(ctx: CellContextLike) {
    const finalState =
        (typeof ctx?.getValue === 'function' ? String(ctx.getValue() ?? '') : '') ||
        (typeof ctx?.cell?.getValue === 'function' ? String(ctx.cell.getValue() ?? '') : '') ||
        ctx?.row?.original?.state ||
        '';

    if (!finalState) return null;

    const style =
        STATE_STYLES[finalState] ||
        'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/20 dark:text-slate-300';
    const dot = STATE_DOT[finalState] || 'bg-slate-400';

    return (
        <Badge
            variant="outline"
            className={`emg-order-state-badge inline-flex items-center gap-1.5 border font-semibold text-[0.7rem] px-2 py-0.5 ${style}`}
        >
            <span className={`size-1.5 rounded-full shrink-0 ${dot}`} aria-hidden />
            {humanizeState(finalState)}
        </Badge>
    );
}
