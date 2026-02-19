import { getCookie, setCookie } from './cookie';

const CACHE_TOKEN_VERIFICATION_MS = 4 * 60 * 60 * 1000; // 4 hours
const cache = new Map<string, { data: unknown; timestamp: number }>();

export function getFromCache<T>(key: string): T | null {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TOKEN_VERIFICATION_MS) {
        return entry.data as T;
    }

    try {
        const stored = getCookie(key);
        if (stored) {
            const parsed = JSON.parse(decodeURIComponent(stored));

            if (Date.now() - parsed.timestamp < CACHE_TOKEN_VERIFICATION_MS) {
                cache.set(key, parsed);
                return parsed.data as T;
            }
        }
    } catch {}

    return null;
}

export function setToCache<T>(key: string, data: T): void {
    const entry = { data, timestamp: Date.now() };
    cache.set(key, entry);
    try {
        setCookie(key, encodeURIComponent(JSON.stringify(entry)), CACHE_TOKEN_VERIFICATION_MS / 1000);
    } catch {}
}

export function createCacheKey(prefix: string, ...args: (string | undefined)[]): string {
    return `${prefix}_${args.filter(Boolean).join('_')}`;
}
