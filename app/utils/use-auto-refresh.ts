'use client';
import useTabVisibility from '@utils/use-tab-visibility';
import { useEffect } from 'react';

export const AUTO_REFRESH_INTERVAL = 2000;

export enum AutoRefresh {
    Active,
    Inactive,
    BailedOut,
}

export type WithAutoRefreshProp = {
    autoRefresh: AutoRefresh;
};

type UseAutoRefreshStateArgs = {
    enabled: boolean; // poll while true
    bailedOut?: boolean; // hard stop even if enabled
};

// Derives the AutoRefresh value from domain flags + tab visibility.
// Subscribes to tab visibility (visibilitychange) via useTabVisibility.
export function useAutoRefreshState({ enabled, bailedOut = false }: UseAutoRefreshStateArgs): AutoRefresh {
    const { visible: isTabVisible } = useTabVisibility();

    if (!isTabVisible) return AutoRefresh.Inactive;
    if (bailedOut) return AutoRefresh.BailedOut;
    if (enabled) return AutoRefresh.Active;
    return AutoRefresh.Inactive;
}

// Runs onRefresh on a timer while Active. Side effect only.
export function useAutoRefreshInterval(
    autoRefresh: AutoRefresh,
    onRefresh: () => void, // MUST be stable (wrap in useCallback)
    intervalMs: number = AUTO_REFRESH_INTERVAL,
): void {
    useEffect(() => {
        if (autoRefresh !== AutoRefresh.Active) return;
        const handle: NodeJS.Timeout = setInterval(onRefresh, intervalMs);
        return () => clearInterval(handle);
    }, [autoRefresh, onRefresh, intervalMs]);
}
