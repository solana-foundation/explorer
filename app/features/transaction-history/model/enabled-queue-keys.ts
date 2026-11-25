import { useLayoutEffect } from 'react';

// A queued task runs only while its key is here. The queue checks the key each time the task starts or wakes, so a
// component that remounts before the next check keeps its task.
const enabledKeys = new Set<string>();

// A layout effect adds the key before any passive effect in the commit enqueues a task. Call this hook before the
// hook that enqueues.
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
