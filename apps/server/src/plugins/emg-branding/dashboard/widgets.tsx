import {
    api,
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
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

const analyticsCatalogQuery = graphql(`
    query EmgAnalyticsCatalog {
        products(options: { take: 1 }) {
            totalItems
        }
        discountedProducts: products(
            options: { take: 1, filter: { isDiscounted: { eq: true } } }
        ) {
            totalItems
        }
        customers(options: { take: 1 }) {
            totalItems
        }
        productVariants(options: { take: 1 }) {
            totalItems
        }
        outOfStock: productVariants(
            options: { take: 1, filter: { stockOnHand: { lte: 0 } } }
        ) {
            totalItems
        }
        lowStock: productVariants(
            options: {
                take: 1
                filter: { stockOnHand: { between: { start: 1, end: 5 } } }
            }
        ) {
            totalItems
        }
        promotions(options: { take: 1, filter: { enabled: { eq: true } } }) {
            totalItems
        }
    }
`);

const analyticsOrdersQuery = graphql(`
    query EmgAnalyticsOrders {
        allOrders: orders(options: { take: 1 }) {
            totalItems
        }
        activeCarts: orders(options: { take: 1, filter: { active: { eq: true } } }) {
            totalItems
        }
        addingItems: orders(
            options: { take: 1, filter: { state: { eq: "AddingItems" } } }
        ) {
            totalItems
        }
        arrangingPayment: orders(
            options: { take: 1, filter: { state: { eq: "ArrangingPayment" } } }
        ) {
            totalItems
        }
        paymentAuthorized: orders(
            options: { take: 1, filter: { state: { eq: "PaymentAuthorized" } } }
        ) {
            totalItems
        }
        paymentSettled: orders(
            options: { take: 1, filter: { state: { eq: "PaymentSettled" } } }
        ) {
            totalItems
        }
        shipped: orders(options: { take: 1, filter: { state: { eq: "Shipped" } } }) {
            totalItems
        }
        delivered: orders(
            options: { take: 1, filter: { state: { eq: "Delivered" } } }
        ) {
            totalItems
        }
        cancelled: orders(
            options: { take: 1, filter: { state: { eq: "Cancelled" } } }
        ) {
            totalItems
        }
        recentOrders: orders(
            options: {
                take: 8
                sort: { orderPlacedAt: DESC }
                filter: { active: { eq: false } }
            }
        ) {
            totalItems
            items {
                id
                code
                state
                totalWithTax
                currencyCode
                orderPlacedAt
                customer {
                    firstName
                    lastName
                }
            }
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

type MetricEntry = { label: string; value: number };

function sumEntries(entries: MetricEntry[]): number {
    return entries.reduce((sum, e) => sum + e.value, 0);
}

function avgEntries(entries: MetricEntry[]): number {
    if (!entries.length) return 0;
    return sumEntries(entries) / entries.length;
}

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

function TrendChart({
    title,
    subtitle,
    values,
    labels,
    color,
    formatValue,
}: {
    title: string;
    subtitle: string;
    values: number[];
    labels: string[];
    color: string;
    formatValue: (v: number) => string;
}) {
    const width = 420;
    const height = 140;
    const linePath = buildLinePath(values, width, height);
    const areaPath = buildAreaPath(values, width, height);
    const total = sumEntries(values.map((value, i) => ({ label: labels[i] ?? '', value })));
    const gradientId = `emg-grad-${title.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <Card className="emg-analytics-card border-border/60 shadow-none">
            <CardHeader className="pb-2 space-y-1">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardDescription className="text-xs uppercase tracking-wide">
                            {title}
                        </CardDescription>
                        <CardTitle className="text-xl font-semibold tabular-nums">
                            {formatValue(total)}
                        </CardTitle>
                    </div>
                    <Badge variant="secondary" className="shrink-0 font-normal">
                        {subtitle}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {values.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-10 text-center">
                        No sales data in this date range yet.
                    </p>
                ) : (
                    <>
                        <svg
                            viewBox={`0 0 ${width} ${height}`}
                            className="emg-chart-card__svg"
                            aria-hidden
                        >
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color} stopOpacity="0.28" />
                                    <stop offset="100%" stopColor={color} stopOpacity="0.02" />
                                </linearGradient>
                            </defs>
                            {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
                            {linePath && (
                                <path
                                    d={linePath}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth="2.25"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            )}
                        </svg>
                        <div className="emg-chart-card__labels">
                            {labels.filter((_, i) => i % Math.max(1, Math.ceil(labels.length / 4)) === 0 || i === labels.length - 1).map(label => (
                                <span key={label}>{label}</span>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function KpiCard({
    label,
    value,
    hint,
    href,
}: {
    label: string;
    value: string;
    hint: string;
    href?: string;
}) {
    const body = (
        <Card className="emg-kpi-card border-border/60 shadow-none h-full">
            <CardContent className="pt-4 pb-4 px-4 space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                    {value}
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug">{hint}</p>
            </CardContent>
        </Card>
    );

    if (!href) return body;
    return (
        <a href={href} className="emg-kpi-link block h-full no-underline text-inherit">
            {body}
        </a>
    );
}

function StatusRow({
    label,
    count,
    total,
    tone,
}: {
    label: string;
    count: number;
    total: number;
    tone: 'neutral' | 'warn' | 'ok' | 'danger';
}) {
    const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
    return (
        <div className="emg-status-row">
            <div className="emg-status-row__meta">
                <span>{label}</span>
                <strong className="tabular-nums">{count}</strong>
            </div>
            <div className="emg-status-row__track">
                <span
                    className={`emg-status-row__fill emg-status-row__fill--${tone}`}
                    style={{width: `${pct}%`}}
                />
            </div>
        </div>
    );
}

function stateTone(state: string): 'neutral' | 'warn' | 'ok' | 'danger' {
    if (state === 'Delivered' || state === 'PaymentSettled') return 'ok';
    if (state === 'Cancelled') return 'danger';
    if (state === 'Shipped' || state === 'PaymentAuthorized') return 'warn';
    return 'neutral';
}

export function EmgWelcomeWidget() {
    const {data, isPending} = useQuery({
        queryKey: ['emg-current-admin'],
        queryFn: () => api.query(currentUserQuery, {}),
        staleTime: 5 * 60_000,
        placeholderData: keepPreviousData,
    });
    const {dateRange} = useWidgetFilters();

    const admin = data?.activeAdministrator;
    const name = admin?.firstName
        ? `${admin.firstName}${admin.lastName ? ` ${admin.lastName}` : ''}`
        : isPending
          ? '…'
          : 'Admin';

    const rangeLabel = `${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}`;

    return (
        <Card className="emg-welcome-strip border-border/60 shadow-none">
            <CardContent className="py-4 px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">
                        Store overview
                    </p>
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground truncate">
                        Welcome back, {name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Live metrics for {rangeLabel}. Change the date range above to adjust sales charts.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button render={<a href="/dashboard/products" />} size="sm">
                        Products
                    </Button>
                    <Button render={<a href="/dashboard/orders" />} variant="outline" size="sm">
                        Orders
                    </Button>
                    <Button render={<a href="/dashboard/customers" />} variant="outline" size="sm">
                        Customers
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

/** Stock, order pipeline, and discount performance from live Admin API data. */
export function EmgFeaturedWidget() {
    const {data, isPending, isFetching} = useQuery({
        queryKey: ['emg-analytics-catalog-ops'],
        queryFn: async () => {
            const [catalog, orders] = await Promise.all([
                api.query(analyticsCatalogQuery, {}),
                api.query(analyticsOrdersQuery, {}),
            ]);
            return {catalog, orders};
        },
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });

    if (isPending && !data) {
        return (
            <div className="emg-ops-grid" aria-busy="true">
                <Card className="emg-skeleton-card border-border/60 shadow-none min-h-[12rem]" />
                <Card className="emg-skeleton-card border-border/60 shadow-none min-h-[12rem]" />
                <Card className="emg-skeleton-card border-border/60 shadow-none min-h-[12rem]" />
            </div>
        );
    }

    const catalog = data?.catalog;
    const orders = data?.orders;
    const variants = catalog?.productVariants?.totalItems ?? 0;
    const outOfStock = catalog?.outOfStock?.totalItems ?? 0;
    const lowStock = catalog?.lowStock?.totalItems ?? 0;
    const inStock = Math.max(0, variants - outOfStock);
    const discounted = catalog?.discountedProducts?.totalItems ?? 0;
    const products = catalog?.products?.totalItems ?? 0;
    const promotions = catalog?.promotions?.totalItems ?? 0;
    const dealShare = products > 0 ? Math.round((discounted / products) * 100) : 0;

    const pipeline = [
        {label: 'Active carts', count: orders?.activeCarts?.totalItems ?? 0, tone: 'neutral' as const},
        {label: 'Adding items', count: orders?.addingItems?.totalItems ?? 0, tone: 'neutral' as const},
        {label: 'Arranging payment', count: orders?.arrangingPayment?.totalItems ?? 0, tone: 'warn' as const},
        {label: 'Payment authorized', count: orders?.paymentAuthorized?.totalItems ?? 0, tone: 'warn' as const},
        {label: 'Payment settled', count: orders?.paymentSettled?.totalItems ?? 0, tone: 'ok' as const},
        {label: 'Shipped', count: orders?.shipped?.totalItems ?? 0, tone: 'warn' as const},
        {label: 'Delivered', count: orders?.delivered?.totalItems ?? 0, tone: 'ok' as const},
        {label: 'Cancelled', count: orders?.cancelled?.totalItems ?? 0, tone: 'danger' as const},
    ];
    const pipelineTotal = Math.max(
        1,
        pipeline.reduce((sum, row) => sum + row.count, 0),
    );

    return (
        <div className={`emg-ops-grid${isFetching ? ' emg-insights-layout--refreshing' : ''}`}>
            <Card className="emg-analytics-card border-border/60 shadow-none">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Inventory</CardTitle>
                    <CardDescription>Variant stock levels from the catalog</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <StatusRow label="In stock" count={inStock} total={variants || 1} tone="ok" />
                    <StatusRow label="Low stock (1–5)" count={lowStock} total={variants || 1} tone="warn" />
                    <StatusRow label="Out of stock" count={outOfStock} total={variants || 1} tone="danger" />
                    <p className="text-xs text-muted-foreground pt-1">
                        {variants} variants tracked ·{' '}
                        <a href="/dashboard/products" className="underline-offset-2 hover:underline">
                            Manage stock
                        </a>
                    </p>
                </CardContent>
            </Card>

            <Card className="emg-analytics-card border-border/60 shadow-none">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Order status</CardTitle>
                    <CardDescription>Current pipeline across all orders</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                    {pipeline.map(row => (
                        <StatusRow
                            key={row.label}
                            label={row.label}
                            count={row.count}
                            total={pipelineTotal}
                            tone={row.tone}
                        />
                    ))}
                </CardContent>
            </Card>

            <Card className="emg-analytics-card border-border/60 shadow-none">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Deals &amp; promotions</CardTitle>
                    <CardDescription>Discounted catalog products and active promotions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="emg-deal-metrics">
                        <div>
                            <p className="text-xs text-muted-foreground">On super deal</p>
                            <p className="text-2xl font-semibold tabular-nums">{discounted}</p>
                            <p className="text-[11px] text-muted-foreground">
                                {dealShare}% of {products} products
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Active promotions</p>
                            <p className="text-2xl font-semibold tabular-nums">{promotions}</p>
                            <p className="text-[11px] text-muted-foreground">Enabled in Admin</p>
                        </div>
                    </div>
                    <StatusRow
                        label="Discounted products"
                        count={discounted}
                        total={products || 1}
                        tone="ok"
                    />
                    <a
                        href="/dashboard/products?filters=isDiscounted"
                        className="text-xs font-medium text-primary hover:underline underline-offset-2"
                    >
                        Review discounted products
                    </a>
                </CardContent>
            </Card>
        </div>
    );
}

export function EmgStatsWidget() {
    const {dateRange} = useWidgetFilters();
    const {formatCurrency} = useLocalFormat();
    const {activeChannel} = useChannel();
    const currency = activeChannel?.defaultCurrencyCode ?? 'RWF';

    const {
        data: metrics,
        isPending: metricsPending,
        isFetching: metricsFetching,
    } = useQuery({
        queryKey: ['emg-stats-metrics', dateRange.from.toISOString(), dateRange.to.toISOString()],
        queryFn: () =>
            api.query(orderMetricsQuery, {
                types: ['OrderTotal', 'OrderCount', 'AverageOrderValue'],
                startDate: dateRange.from.toISOString(),
                endDate: dateRange.to.toISOString(),
                refresh: false,
            }),
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });

    const {
        data: catalog,
        isPending: catalogPending,
        isFetching: catalogFetching,
    } = useQuery({
        queryKey: ['emg-analytics-catalog'],
        queryFn: () => api.query(analyticsCatalogQuery, {}),
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });

    const {
        data: orderStats,
        isPending: ordersPending,
        isFetching: ordersFetching,
    } = useQuery({
        queryKey: ['emg-analytics-orders'],
        queryFn: () => api.query(analyticsOrdersQuery, {}),
        staleTime: 45_000,
        placeholderData: keepPreviousData,
    });

    const isInitialLoad =
        (metricsPending && !metrics) ||
        (catalogPending && !catalog) ||
        (ordersPending && !orderStats);

    if (isInitialLoad) {
        return <EmgStatsWidgetSkeleton />;
    }

    const revenueEntries =
        metrics?.dashboardMetricSummary?.find(m => m.type === 'OrderTotal')?.entries ?? [];
    const orderEntries =
        metrics?.dashboardMetricSummary?.find(m => m.type === 'OrderCount')?.entries ?? [];
    const aovEntries =
        metrics?.dashboardMetricSummary?.find(m => m.type === 'AverageOrderValue')?.entries ?? [];

    const revenue = sumEntries(revenueEntries);
    const periodOrders = sumEntries(orderEntries);
    const aov = avgEntries(aovEntries);
    const products = catalog?.products?.totalItems ?? 0;
    const customers = catalog?.customers?.totalItems ?? 0;
    const allOrders = orderStats?.allOrders?.totalItems ?? 0;
    const recent = orderStats?.recentOrders?.items ?? [];
    const refreshing = metricsFetching || catalogFetching || ordersFetching;

    return (
        <div className={`emg-insights-layout emg-insights-layout--analytics${refreshing ? ' emg-insights-layout--refreshing' : ''}`}>
            <div className="emg-kpi-grid">
                <KpiCard
                    label="Revenue"
                    value={formatCurrency(revenue, currency, 0)}
                    hint="Selected date range"
                    href="/dashboard/orders"
                />
                <KpiCard
                    label="Orders"
                    value={String(Math.round(periodOrders))}
                    hint={`${allOrders} lifetime orders`}
                    href="/dashboard/orders"
                />
                <KpiCard
                    label="Avg. order value"
                    value={formatCurrency(aov, currency, 0)}
                    hint="Period average"
                />
                <KpiCard
                    label="Customers"
                    value={String(customers)}
                    hint="Registered accounts"
                    href="/dashboard/customers"
                />
                <KpiCard
                    label="Products"
                    value={String(products)}
                    hint={`${catalog?.discountedProducts?.totalItems ?? 0} on deal`}
                    href="/dashboard/products"
                />
                <KpiCard
                    label="Active carts"
                    value={String(orderStats?.activeCarts?.totalItems ?? 0)}
                    hint="In-progress checkouts"
                    href="/dashboard/orders"
                />
            </div>

            <div className="emg-charts-grid">
                <TrendChart
                    title="Sales overview"
                    subtitle="Revenue trend"
                    values={revenueEntries.map(e => e.value)}
                    labels={revenueEntries.map(e => e.label)}
                    color="#269A2D"
                    formatValue={v => formatCurrency(v, currency, 0)}
                />
                <TrendChart
                    title="Order volume"
                    subtitle="Orders trend"
                    values={orderEntries.map(e => e.value)}
                    labels={orderEntries.map(e => e.label)}
                    color="#00B8D9"
                    formatValue={v => String(Math.round(v))}
                />
            </div>

            <Card className="emg-analytics-card border-border/60 shadow-none">
                <CardHeader className="pb-3 flex-row items-center justify-between gap-3 space-y-0">
                    <div>
                        <CardTitle className="text-base">Recent orders</CardTitle>
                        <CardDescription>Latest placed orders from the database</CardDescription>
                    </div>
                    <Button render={<a href="/dashboard/orders" />} variant="outline" size="sm">
                        View all
                    </Button>
                </CardHeader>
                <CardContent className="pt-0">
                    {recent.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">
                            No placed orders yet.
                        </p>
                    ) : (
                        <div className="emg-orders-table-wrap">
                            <table className="emg-orders-table">
                                <thead>
                                    <tr>
                                        <th>Order</th>
                                        <th>Customer</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th className="text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recent.map(order => {
                                        const customerName = order.customer
                                            ? `${order.customer.firstName} ${order.customer.lastName}`.trim()
                                            : 'Guest';
                                        const placed = order.orderPlacedAt
                                            ? new Date(order.orderPlacedAt).toLocaleString()
                                            : 'N/A';
                                        return (
                                            <tr key={order.id}>
                                                <td>
                                                    <a
                                                        href={`/dashboard/orders/${order.id}`}
                                                        className="font-medium text-foreground hover:underline underline-offset-2"
                                                    >
                                                        {order.code}
                                                    </a>
                                                </td>
                                                <td className="text-muted-foreground">{customerName}</td>
                                                <td>
                                                    <Badge
                                                        variant="secondary"
                                                        className={`emg-state-badge emg-state-badge--${stateTone(order.state)}`}
                                                    >
                                                        {order.state}
                                                    </Badge>
                                                </td>
                                                <td className="text-muted-foreground whitespace-nowrap">
                                                    {placed}
                                                </td>
                                                <td className="text-right tabular-nums font-medium">
                                                    {formatCurrency(
                                                        order.totalWithTax,
                                                        order.currencyCode || currency,
                                                        0,
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

