/** E-commerce themed SVG loader for dashboard transitions */
export function EmgDashboardLoader() {
    return (
        <div className="emg-dashboard-loader" role="status" aria-label="Loading">
            <svg
                className="emg-dashboard-loader__svg"
                viewBox="0 0 64 64"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
            >
                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeOpacity="0.15" strokeWidth="4" />
                <path
                    d="M32 8a24 24 0 0 1 24 24"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className="emg-dashboard-loader__arc"
                />
                <path
                    d="M22 26h20l-2 14H24L22 26z"
                    fill="currentColor"
                    fillOpacity="0.9"
                    className="emg-dashboard-loader__bag"
                />
                <path
                    d="M26 26c0-3.3 2.7-6 6-6s6 2.7 6 6"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="emg-dashboard-loader__handle"
                />
            </svg>
            <span className="emg-dashboard-loader__label">Loading EMG Admin…</span>
        </div>
    );
}
