import 'client-only';

import { createJSONStorage } from 'jotai/utils';

type JsonStorage<T> = ReturnType<typeof createJSONStorage<T>>;

/**
 * A localStorage-backed jotai storage whose every access is guarded.
 *
 * `isValid` decides what a stored (or cross-tab) value must look like; anything else — a corrupt entry,
 * a foreign write, a blocked localStorage — falls back to `fallback` instead of rendering garbage or
 * throwing out of a render. Clearing to `fallback` removes the key rather than persisting the literal
 * string `"undefined"` that `JSON.stringify(undefined)` would otherwise write.
 *
 * The storage-event wiring is owned here rather than delegated to jotai's built-in subscriber: jotai's
 * handler re-reads `window.localStorage` to compare `event.storageArea` *before* invoking the callback,
 * so if access is revoked after mount that read throws upstream of anything we could wrap.
 */
export function createGuardedJsonStorage<T>(isValid: (value: unknown) => value is T, fallback: T): JsonStorage<T> {
    const jsonStorage = createJSONStorage<T>(() => window.localStorage);
    return {
        ...jsonStorage,
        getItem: (key, initialValue) => {
            try {
                const value = jsonStorage.getItem(key, initialValue);
                return isValid(value) ? value : fallback;
            } catch {
                return fallback;
            }
        },
        removeItem: key => {
            try {
                jsonStorage.removeItem(key);
            } catch {
                // ignore — the in-memory atom value is still the source of truth for this session.
            }
        },
        setItem: (key, value) => {
            try {
                if (value === fallback) {
                    jsonStorage.removeItem(key);
                } else {
                    jsonStorage.setItem(key, value);
                }
            } catch {
                // ignore — the in-memory atom value is still the source of truth for this session.
            }
        },
        subscribe: (key, callback, initialValue) => {
            if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
                return () => {};
            }
            const handler = (event: StorageEvent) => {
                try {
                    if (event.key !== key) return;
                    if (event.storageArea && event.storageArea !== window.localStorage) return;
                    let value: unknown;
                    try {
                        value = event.newValue === null ? initialValue : JSON.parse(event.newValue);
                    } catch {
                        value = initialValue;
                    }
                    callback(isValid(value) ? value : fallback);
                } catch {
                    // ignore — retain the current in-memory atom value for this session.
                }
            };
            window.addEventListener('storage', handler);
            return () => window.removeEventListener('storage', handler);
        },
    };
}
