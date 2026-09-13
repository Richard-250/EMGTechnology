import {Badge} from '@/components/ui/badge';
import {
    ShoppingCart,
    CreditCard,
    Clock,
    CheckCircle,
    Truck,
    PackageCheck,
    Package,
    XCircle,
    type LucideIcon,
} from 'lucide-react';
import {useTranslations} from 'next-intl';

const STATUS_CONFIG: Record<string, { color: string; icon: LucideIcon }> = {
    AddingItems: {
        color: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-500/20 dark:text-slate-200 dark:border-slate-500/40',
        icon: ShoppingCart,
    },
    ArrangingPayment: {
        color: 'bg-amber-100 text-amber-900 border-amber-400 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40',
        icon: CreditCard,
    },
    PaymentAuthorized: {
        color: 'bg-amber-100 text-amber-950 border-amber-500 dark:bg-amber-500/25 dark:text-amber-100 dark:border-amber-400/50',
        icon: Clock,
    },
    PaymentSettled: {
        color: 'bg-emerald-100 text-emerald-900 border-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-500/40',
        icon: CheckCircle,
    },
    PartiallyShipped: {
        color: 'bg-blue-100 text-blue-900 border-blue-400 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-500/40',
        icon: Package,
    },
    Shipped: {
        color: 'bg-blue-100 text-blue-950 border-blue-500 dark:bg-blue-500/25 dark:text-blue-100 dark:border-blue-400/50',
        icon: Truck,
    },
    PartiallyDelivered: {
        color: 'bg-violet-100 text-violet-900 border-violet-400 dark:bg-violet-500/20 dark:text-violet-200 dark:border-violet-500/40',
        icon: PackageCheck,
    },
    Delivered: {
        color: 'bg-violet-100 text-violet-950 border-violet-500 dark:bg-violet-500/25 dark:text-violet-100 dark:border-violet-400/50',
        icon: PackageCheck,
    },
    Cancelled: {
        color: 'bg-red-100 text-red-900 border-red-400 dark:bg-red-500/20 dark:text-red-200 dark:border-red-500/40',
        icon: XCircle,
    },
};

interface OrderStatusBadgeProps {
    state: string;
}

export function OrderStatusBadge({state}: OrderStatusBadgeProps) {
    const t = useTranslations('OrderStatus');
    const config = STATUS_CONFIG[state] || {
        color: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-500/20 dark:text-slate-200',
        icon: Clock,
    };
    const Icon = config.icon;
    const label =
        state in STATUS_CONFIG
            ? t(
                  state as
                      | 'AddingItems'
                      | 'ArrangingPayment'
                      | 'PaymentAuthorized'
                      | 'PaymentSettled'
                      | 'PartiallyShipped'
                      | 'Shipped'
                      | 'PartiallyDelivered'
                      | 'Delivered'
                      | 'Cancelled',
              )
            : state;

    return (
        <Badge className={`${config.color} border font-semibold`} variant="secondary">
            <Icon className="h-3 w-3 mr-1" />
            {label}
        </Badge>
    );
}
