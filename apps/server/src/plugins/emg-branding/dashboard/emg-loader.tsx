/** E-commerce themed SVG loaders for dashboard boot and soft refresh. */

type EmgLoaderVariant = 'overlay' | 'inline' | 'bar';

interface EmgDashboardLoaderProps {
    variant?: EmgLoaderVariant;
    label?: string;
}

function ShoppingBagMark({className}: {className?: string}) {
    return (
        <svg
            className={className}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeOpacity="0.14"
                strokeWidth="4"
            />
            <path
                d="M32 8a24 24 0 0 1 24 24"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className="emg-dashboard-loader__arc"
            />
            {/* Shopping bag */}
            <path
                d="M20 26h24l-2.2 18.5a3 3 0 0 1-3 2.5H25.2a3 3 0 0 1-3-2.5L20 26z"
                fill="currentColor"
                fillOpacity="0.92"
                className="emg-dashboard-loader__bag"
            />
            <path
                d="M26 26c0-3.5 2.7-6.2 6-6.2s6 2.7 6 6.2"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                className="emg-dashboard-loader__handle"
            />
            {/* Tag accent */}
            <circle cx="40.5" cy="34.5" r="2.2" fill="#F59E0B" className="emg-dashboard-loader__tag" />
        </svg>
    );
}

/**
 * Professional dashboard loader.
 * - overlay: translucent boot cover (children stay mounted underneath)
 * - inline: centered mark for widget skeletons
 * - bar: thin top progress for background refetch
 */
export function EmgDashboardLoader({
    variant = 'overlay',
    label = 'Loading EMG Admin…',
}: EmgDashboardLoaderProps) {
    if (variant === 'bar') {
        return (
            <div className="emg-refresh-bar" role="status" aria-label="Refreshing">
                <div className="emg-refresh-bar__inner" />
            </div>
        );
    }

    if (variant === 'inline') {
        return (
            <div className="emg-dashboard-loader emg-dashboard-loader--inline" role="status" aria-label="Loading">
                <ShoppingBagMark className="emg-dashboard-loader__svg emg-dashboard-loader__svg--sm" />
                <span className="emg-dashboard-loader__label">{label}</span>
            </div>
        );
    }

    return (
        <div className="emg-dashboard-loader emg-dashboard-loader--overlay" role="status" aria-label="Loading">
            <ShoppingBagMark className="emg-dashboard-loader__svg" />
            <span className="emg-dashboard-loader__label">{label}</span>
        </div>
    );
}

export function EmgStatCardSkeleton() {
    return (
        <div className="emg-stat-card emg-skeleton-card" aria-hidden>
            <span className="emg-skeleton-line emg-skeleton-line--sm" />
            <span className="emg-skeleton-line emg-skeleton-line--lg" />
            <span className="emg-skeleton-line emg-skeleton-line--xs" />
        </div>
    );
}

export function EmgChartSkeleton() {
    return (
        <div className="emg-chart-card emg-skeleton-card" aria-hidden>
            <div className="emg-chart-card__header">
                <div className="w-full space-y-2">
                    <span className="emg-skeleton-line emg-skeleton-line--sm" />
                    <span className="emg-skeleton-line emg-skeleton-line--md" />
                </div>
            </div>
            <div className="emg-skeleton-chart" />
        </div>
    );
}

export function EmgStatsWidgetSkeleton() {
    return (
        <div className="emg-insights-layout emg-insights-layout--analytics" aria-busy="true">
            <div className="emg-kpi-grid">
                <EmgStatCardSkeleton />
                <EmgStatCardSkeleton />
                <EmgStatCardSkeleton />
                <EmgStatCardSkeleton />
                <EmgStatCardSkeleton />
                <EmgStatCardSkeleton />
            </div>
            <div className="emg-charts-grid">
                <EmgChartSkeleton />
                <EmgChartSkeleton />
            </div>
            <div className="emg-skeleton-card emg-analytics-card min-h-[10rem] rounded-xl border border-border/60" />
        </div>
    );
}
