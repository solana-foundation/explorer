import { is, number, type Struct, type, unknown } from 'superstruct';

const StoredEntry = type({ expiresAt: number(), value: unknown() });

export function getStoredValue<T>(name: string, struct: Struct<T>): T | undefined {
    if (typeof window === 'undefined') return undefined;
    try {
        const raw = localStorage.getItem(name);
        const entry: unknown = raw === null ? undefined : JSON.parse(raw);
        if (!is(entry, StoredEntry) || entry.expiresAt <= Date.now()) return undefined;
        return is(entry.value, struct) ? entry.value : undefined;
    } catch {
        return undefined;
    }
}

export function setStoredValue(name: string, value: string, maxAgeSeconds: number): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(name, JSON.stringify({ expiresAt: Date.now() + maxAgeSeconds * 1000, value }));
    } catch {
        // A browser that blocks storage keeps nothing, so the next visit asks again.
    }
}
