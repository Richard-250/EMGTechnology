import {
    api,
    graphql,
    useChannel,
    useLocalFormat,
    useWidgetFilters,
} from '@vendure/dashboard';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

const orderMetricsQuery = graphql(`
    query EmgOrderMetrics(
        $types: [DashboardMetricType!]!
        $startDate: DateTime!
        $endDate: DateTime!
    ) {
        dashboardMetricSummary(
            input: { types: $types, refresh: true, startDate: $startDate, endDate: $endDate }
        ) {
            type
            entries {
                label
                value
            }
        }
    }
`);

const storeStatsQuery = graphql(`
    query EmgStoreStats {
        products(options: { take: 1 }) {
            totalItems
        }
        customers(options: { take: 1 }) {
            totalItems
        }
    }
`);

const currentUserQuery = graphql(`
    query EmgCurrentAdmin {
        activeAdministrator {
            firstName
            lastName
        }
    }
`);

const SPARK_HEIGHTS = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88];

function SparkBars({ color = '#269A2D' }: { color?: string }) {
    return (
        <div className="emg-stat-spark" aria-hidden>
            {SPARK_HEIGHTS.map((h, i) => (
                <span key={i} style={{ height: `${h}%`, background: color, opacity: 0.4 + (i % 3) * 0.15 }} />
            ))}
        </div>
    );
}

export function EmgWelcomeWidget() {
    const { data } = useQuery({
        queryKey: ['emg-current-admin'],
        queryFn: () => api.query(currentUserQuery, {}),
    });

    const admin = data?.activeAdministrator;
    const name = admin?.firstName
        ? `${admin.firstName}${admin.lastName ? ` ${admin.lastName}` : ''}`
        : 'Super Admin';

    return (
        <div className="emg-welcome-card">
            <div className="emg-welcome-badge">Admin &amp; Staff Portal</div>
            <p className="emg-welcome-title">Welcome back 👋 {name}</p>
            <p className="emg-welcome-sub">
                Manage your EMG Technology store — products, orders, customers and fitness equipment
                catalog from one place.
            </p>
            <div className="emg-welcome-actions">
                <a href="/dashboard/products" className="emg-welcome-btn">
                    Manage products →
                </a>
                <a href="/dashboard/orders" className="emg-welcome-btn-secondary">
                    View orders →
                </a>
            </div>
        </div>
    );
}

export function EmgFeaturedWidget() {
    return (
        <div className="emg-featured-card">
            <div className="emg-featured-banner" aria-hidden />
            <p className="emg-featured-title">EMG Fitness Store — Rwanda&apos;s home gym destination</p>
            <p className="emg-featured-desc">
                Track sales in RWF &amp; USD, manage MTN/Airtel payments, and keep your catalog up to date
                for customers across Kigali and beyond.
            </p>
        </div>
    );
}

export function EmgStatsWidget() {
    const { dateRange } = useWidgetFilters();
    const { formatCurrency } = useLocalFormat();
    const { activeChannel } = useChannel();
    const currency = activeChannel?.defaultCurrencyCode ?? 'RWF';

    const { data: metrics } = useQuery({
        queryKey: ['emg-stats-metrics', dateRange.from, dateRange.to],
        queryFn: () =>
            api.query(orderMetricsQuery, {
                types: ['OrderTotal', 'OrderCount'],
                startDate: dateRange.from.toISOString(),
                endDate: dateRange.to.toISOString(),
            }),
    });

    const { data: store } = useQuery({
        queryKey: ['emg-store-stats'],
        queryFn: () => api.query(storeStatsQuery, {}),
    });

    const revenue = useMemo(() => {
        const entries = metrics?.dashboardMetricSummary?.find(m => m.type === 'OrderTotal')?.entries ?? [];
        return entries.reduce((sum, e) => sum + e.value, 0);
    }, [metrics]);

    const orders = useMemo(() => {
        const entries = metrics?.dashboardMetricSummary?.find(m => m.type === 'OrderCount')?.entries ?? [];
        return entries.reduce((sum, e) => sum + e.value, 0);
    }, [metrics]);

    const products = store?.products?.totalItems ?? 0;

    return (
        <div className="emg-stats-grid">
            <div className="emg-stat-card">
                <span className="emg-stat-label">Total orders</span>
                <span className="emg-stat-value">{orders}</span>
                <span className="emg-stat-trend up">↑ Active period</span>
                <SparkBars color="#269A2D" />
            </div>
            <div className="emg-stat-card">
                <span className="emg-stat-label">Total revenue</span>
                <span className="emg-stat-value">{formatCurrency(revenue, currency, 0)}</span>
                <span className="emg-stat-trend up">↑ {currency}</span>
                <SparkBars color="#5CBF60" />
            </div>
            <div className="emg-stat-card">
                <span className="emg-stat-label">Products in catalog</span>
                <span className="emg-stat-value">{products}</span>
                <span className="emg-stat-trend up">↑ Listed</span>
                <SparkBars color="#00B8D9" />
            </div>
        </div>
    );
}

export function EmgHiddenWidget() {
    return <div data-emg-hidden-widget className="hidden" aria-hidden />;
}
