import type { SWRConfiguration } from 'swr';

export const TOKEN_VERIFICATION_CACHE_DURATION_MS = 4 * 60 * 60 * 1000;

export const TOKEN_VERIFICATION_SWR_CONFIG: SWRConfiguration = {
    dedupingInterval: TOKEN_VERIFICATION_CACHE_DURATION_MS,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
};
