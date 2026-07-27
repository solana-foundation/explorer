import type { SWRConfiguration } from 'swr';

export const PRICE_CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const PRICE_SWR_CONFIG: SWRConfiguration = {
    dedupingInterval: PRICE_CACHE_DURATION_MS,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};
