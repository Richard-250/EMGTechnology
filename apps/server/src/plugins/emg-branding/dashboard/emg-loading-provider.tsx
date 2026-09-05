import {useEffect, useRef, useState, type ReactNode} from 'react';
import {useQueryClient, useIsFetching} from '@tanstack/react-query';
import {EmgDashboardLoader} from './emg-loader';

/**
 * Stabilizes dashboard loading:
 * - Keeps the app tree mounted (no full remount / hard reload)
 * - Soft boot overlay only until shell is ready
 * - Thin progress bar while background queries refetch
 * - Sensible React Query defaults to preserve previous data
 */
export function EmgLoadingStabilityProvider({children}: {children: ReactNode}) {
    const queryClient = useQueryClient();
    const fetchingCount = useIsFetching();
    const [bootstrapping, setBootstrapping] = useState(true);
    const bootEnded = useRef(false);

    useEffect(() => {
        queryClient.setDefaultOptions({
            queries: {
                staleTime: 45_000,
                gcTime: 10 * 60_000,
                refetchOnWindowFocus: false,
                refetchOnReconnect: true,
                retry: 1,
            },
        });
    }, [queryClient]);

    useEffect(() => {
        if (bootEnded.current) return;

        const endBoot = () => {
            if (bootEnded.current) return;
            bootEnded.current = true;
            setBootstrapping(false);
        };

        // Prefer ending when main content is present; hard-cap so we never stick.
        const readyTimer = window.setTimeout(endBoot, 900);
        const safetyTimer = window.setTimeout(endBoot, 1800);

        const hasShell = () =>
            Boolean(
                document.querySelector('[data-slot="sidebar-inset"]') ||
                    document.querySelector('[data-sidebar="sidebar"]') ||
                    document.querySelector('.login-form'),
            );

        if (hasShell()) {
            window.setTimeout(endBoot, 280);
        }

        const observer = new MutationObserver(() => {
            if (hasShell()) {
                window.setTimeout(endBoot, 200);
            }
        });
        observer.observe(document.documentElement, {childList: true, subtree: true});

        return () => {
            window.clearTimeout(readyTimer);
            window.clearTimeout(safetyTimer);
            observer.disconnect();
        };
    }, []);

    const showRefreshBar = !bootstrapping && fetchingCount > 0;

    return (
        <>
            {/* Children always stay mounted — overlay never unmounts the tree */}
            <div className={bootstrapping ? 'emg-boot-root emg-boot-root--pending' : 'emg-boot-root'}>
                {children}
            </div>
            {bootstrapping && <EmgDashboardLoader variant="overlay" />}
            {showRefreshBar && <EmgDashboardLoader variant="bar" />}
        </>
    );
}
