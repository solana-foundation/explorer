import { act, renderHook, waitFor, type waitForOptions } from '@testing-library/react';
import { Cluster, clusterName, clusterSelection, ClusterStatus } from '@utils/cluster';
import type { ReactNode } from 'react';
import { SWRConfig, type SWRConfiguration, useSWRConfig } from 'swr';

// Both from their own modules, because the specs that use these helpers mock the entity barrel.
import { toConnectableUrl } from '@/app/entities/cluster/lib/connectable-url';
import type { useCluster } from '@/app/entities/cluster/model/use-cluster';

/** Wraps a hook in its own SWR cache, so one test's responses never reach the next. */
export function swrWrapper(config: SWRConfiguration = {}) {
    return function SwrWrapper({ children }: { children: ReactNode }) {
        return <SWRConfig value={{ provider: () => new Map(), ...config }}>{children}</SWRConfig>;
    };
}

// A hook changes no DOM, so `waitFor` re-checks only on its poll interval, which is 50 ms by default.
export function waitForHook<T>(callback: () => T | Promise<T>, options?: waitForOptions): Promise<T> {
    return waitFor(callback, { interval: 1, ...options });
}

/**
 * SWR doubles the delay from `errorRetryInterval`, so a hook with a small `errorRetryCount` stops retrying
 * within `settleRetries`. On the default interval, a retry runs after the test ends. A call count then passes
 * whether retrying is off or not.
 */
export const FAST_RETRY: SWRConfiguration = { errorRetryInterval: 1 };

/** Both throttles off, so a request following a focus is the config's doing and not a coincidence. */
export const UNTHROTTLED_FOCUS: SWRConfiguration = { dedupingInterval: 0, focusThrottleInterval: 0 };

export function settleRetries(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, RETRY_SETTLE_MS));
}

const RETRY_SETTLE_MS = 50;

/** A handle on `mutate` beside the hook, to force a revalidation the hook does not expose. */
export function renderHookWithRevalidate<T>(hook: () => T, config?: SWRConfiguration) {
    return renderHook(() => ({ revalidate: useSWRConfig().mutate, state: hook() }), { wrapper: swrWrapper(config) });
}

export async function refocusTab() {
    await act(async () => {
        window.dispatchEvent(new Event('focus'));
        document.dispatchEvent(new Event('visibilitychange'));
    });
}

// The real return type, not a hand-written stand-in. A weaker type lets a hook read a field the provider
// no longer publishes, and types the endpoint as a plain string instead of the branded one.
export type ClusterContext = ReturnType<typeof useCluster>;

export function clusterContext({
    cluster,
    connectableUrl,
    status,
    url,
}: {
    cluster: Cluster;
    connectableUrl: string | undefined;
    status: ClusterStatus;
    url: string;
}): ClusterContext {
    const selection = clusterSelection(cluster, url);
    return {
        ...selection,
        connectableUrl: connectableUrl === undefined ? undefined : toConnectableUrl(connectableUrl),
        name: clusterName(cluster),
        selection,
        status,
        url,
    };
}
