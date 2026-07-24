import type { SWRConfiguration } from 'swr';

export const MARKET_DATA_CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

export const MARKET_DATA_SWR_CONFIG: SWRConfiguration = {
    dedupingInterval: MARKET_DATA_CACHE_DURATION_MS,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};
