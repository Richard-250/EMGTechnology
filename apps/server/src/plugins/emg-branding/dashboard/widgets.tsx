import {
    api,
    graphql,
    useChannel,
    useLocalFormat,
    useWidgetFilters,
} from '@vendure/dashboard';
import {keepPreviousData, useQuery} from '@tanstack/react-query';
import {EmgStatsWidgetSkeleton} from './emg-loader';

const orderMetricsQuery = graphql(`
    query EmgOrderMetrics(
        $types: [DashboardMetricType!]!
        $startDate: DateTime!
        $endDate: DateTime!
        $refresh: Boolean
    ) {
        dashboardMetricSummary(
            input: { types: $types, refresh: $refresh, startDate: $startDate, endDate: $endDate }
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
        orders(options: { take: 1 }) {
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

function buildLinePath(values: number[], width: number, height: number): string {
    if (!values.length) return '';
    const max = Math.max(...values, 1);
    const step = width / Math.max(values.length - 1, 1);
    return values
        .map((v, i) => {
            const x = i * step;
            const y = height - (v / max) * (height - 8) - 4;
            return `${i === 0 ? 'M' : 'L'}${x},${y}`;
        })
        .join(' ');
}

function buildAreaPath(values: number[], width: number, height: number): string {
    const line = buildLinePath(values, width, height);
    if (!line) return '';
    return `${line} L ${width} ${height} L 0 ${height} Z`;
}

function MetricChart({
    title,
    values,
    labels,
    color,
    formatValue,
}: {
    title: string;
    values: number[];
    labels: string[];
    color: string;
    formatValue: (v: number) => string;
}) {
    const width = 320;
    const height = 120;
    const linePath = buildLinePath(values, width, height);
    const areaPath = buildAreaPath(values, width, height);
    const total = values.reduce((sum, v) => sum + v, 0);

    return (
        <div className="emg-chart-card">
            <div className="emg-chart-card__header">
                <div>
                    <p className="emg-chart-card__title">{title}</p>
                    <p className="emg-chart-card__value">{formatValue(total)}</p>
                </div>
                <span className="emg-chart-card__badge">Overview</span>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="emg-chart-card__svg" aria-hidden>
                <defs>
                    <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                {areaPath && <path d={areaPath} fill={`url(#grad-${title})`} />}
                {linePath && (
                    <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
                )}
            </svg>
            <div className="emg-chart-card__labels">
                {labels.slice(-4).map(label => (
                    <span key={label}>{label}</span>
                ))}
            </div>
        </div>
    );
}

export function EmgWelcomeWidget() {
    const {data, isPending} = useQuery({
        queryKey: ['emg-current-admin'],
        queryFn: () => api.query(currentUserQuery, {}),
        staleTime: 5 * 60_000,
        placeholderData: keepPreviousData,
    });

    const admin = data?.activeAdministrator;
    const name = admin?.firstName
        ? `${admin.firstName}${admin.lastName ? ` ${admin.lastName}` : ''}`
        : isPending
          ? '…'
          : 'Admin';

    return (
        <div className="emg-welcome-card">
            <div className="emg-welcome-badge">Insights Overview</div>
            <p className="emg-welcome-title">Welcome back, {name}</p>
            <p className="emg-welcome-sub">
                Monitor store performance, revenue trends, and catalog activity from your EMG admin dashboard.
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
            <p className="emg-featured-title">Store snapshot</p>
            <p className="emg-featured-desc">
                Super Deals, payments, and fulfillment for EMG Technology. Kigali and nationwide delivery.
            </p>
            <div className="emg-mini-stats">
                <div className="emg-mini-stat">
                    <span>Payments</span>
                    <strong>MTN · Airtel · Card</strong>
                </div>
                <div className="emg-mini-stat">
                    <span>Currencies</span>
                    <strong>RWF · USD</strong>
                </div>
            </div>
        </div>
    );
}

export function EmgStatsWidget() {
    const {dateRange} = useWidgetFilters();
    const {formatCurrency} = useLocalFormat();
    const {activeChannel} = useChannel();
    const currency = activeChannel?.defaultCurrencyCode ?? 'RWF';

    const {data: metrics, isPending: metricsPending, isFetching: metricsFetching} = useQuery({
        queryKey: ['emg-stats-metrics', dateRange.from.toISOString(), dateRange.to.toISOString()],
        queryFn: () =>
            api.query(orderMetricsQuery, {
                types: ['OrderTotal', 'OrderCount'],
                startDate: dateRange.from.toISOString(),
                endDate: dateRange.to.toISOString(),
                // Avoid forced server refresh on every mount — preserves cached metrics
                refresh: false,
            }),
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });

    const {data: store, isPending: storePending, isFetching: storeFetching} = useQuery({
        queryKey: ['emg-store-stats'],
        queryFn: () => api.query(storeStatsQuery, {}),
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });

    const isInitialLoad = (metricsPending && !metrics) || (storePending && !store);
    if (isInitialLoad) {
        return <EmgStatsWidgetSkeleton />;
    }

    const revenueEntries = metrics?.dashboardMetricSummary?.find(m => m.type === 'OrderTotal')?.entries ?? [];
    const orderEntries = metrics?.dashboardMetricSummary?.find(m => m.type === 'OrderCount')?.entries ?? [];

    const revenue = revenueEntries.reduce((sum, e) => sum + e.value, 0);
    const orders = orderEntries.reduce((sum, e) => sum + e.value, 0);
    const products = store?.products?.totalItems ?? 0;
    const customers = store?.customers?.totalItems ?? 0;
    const refreshing = metricsFetching || storeFetching;

    return (
        <div className={`emg-insights-layout${refreshing ? ' emg-insights-layout--refreshing' : ''}`}>
            <div className="emg-stats-grid emg-stats-grid--compact">
                <div className="emg-stat-card">
                    <span className="emg-stat-label">Total orders</span>
                    <span className="emg-stat-value">{orders}</span>
                    <span className="emg-stat-trend up">Active period</span>
                </div>
                <div className="emg-stat-card">
                    <span className="emg-stat-label">Total revenue</span>
                    <span className="emg-stat-value">{formatCurrency(revenue, currency, 0)}</span>
                    <span className="emg-stat-trend up">{currency}</span>
                </div>
                <div className="emg-stat-card">
                    <span className="emg-stat-label">Products</span>
                    <span className="emg-stat-value">{products}</span>
                    <span className="emg-stat-trend up">In catalog</span>
                </div>
                <div className="emg-stat-card">
                    <span className="emg-stat-label">Customers</span>
                    <span className="emg-stat-value">{customers}</span>
                    <span className="emg-stat-trend up">Registered</span>
                </div>
            </div>

            <div className="emg-charts-grid">
                <MetricChart
                    title="Revenue trend"
                    values={revenueEntries.map(e => e.value)}
                    labels={revenueEntries.map(e => e.label)}
                    color="#269A2D"
                    formatValue={v => formatCurrency(v, currency, 0)}
                />
                <MetricChart
                    title="Orders trend"
                    values={orderEntries.map(e => e.value)}
                    labels={orderEntries.map(e => e.label)}
                    color="#00B8D9"
                    formatValue={v => String(Math.round(v))}
                />
            </div>
        </div>
    );
}

export function EmgHiddenWidget() {
    return <div data-emg-hidden-widget className="hidden" aria-hidden />;
}
