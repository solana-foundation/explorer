import { is, number, string, type } from 'superstruct';

const StoredEntry = type({ expiresAt: number(), value: string() });

/** The value {@link setStoredValue} saved under `name`, or `null` when it is missing or expired. */
export function getStoredValue(name: string): string | null {
    const raw = readStorage(name);
    if (raw === null) return null;

    const entry = parseJson(raw);
    if (!is(entry, StoredEntry) || entry.expiresAt <= Date.now()) return null;
    return entry.value;
}

export function setStoredValue(name: string, value: string, maxAgeSeconds: number): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(name, JSON.stringify({ expiresAt: Date.now() + maxAgeSeconds * 1000, value }));
    } catch {
        // A browser that blocks storage keeps nothing, so the next visit asks again.
    }
}

function readStorage(name: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return localStorage.getItem(name);
    } catch {
        return null;
    }
}

function parseJson(raw: string): unknown {
    try {
        return JSON.parse(raw);
    } catch {
        return undefined;
    }
}
