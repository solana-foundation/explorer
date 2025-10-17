import { LRUCache } from 'lru-cache';

/**
 * LRU cache for program names with automatic expiration
 * - Maximum 5000 entries
 * - 1 day TTL
 * - TTL refreshes on access
 */
export const programNameCache = new LRUCache<string, string>({
    max: 5000,
    ttl: 1000 * 60 * 60 * 24, // 1 day
    updateAgeOnGet: true,
});
