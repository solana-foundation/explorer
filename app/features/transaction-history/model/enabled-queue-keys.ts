import { useLayoutEffect } from 'react';

const enabledKeys = new Set<string>();

export function useEnabledQueueKey(key: string, enabled = true): void {
    useLayoutEffect(() => {
        if (!enabled) return;
        enabledKeys.add(key);
        return () => {
            enabledKeys.delete(key);
        };
    }, [key, enabled]);
}

export function isQueueKeyEnabled(key: string): boolean {
    return enabledKeys.has(key);
}
