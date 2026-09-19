import useSWR from 'swr';

import { fetchAccountSizes } from '../api/fetch-account-sizes';

const EMPTY_SIZES: ReadonlyMap<string, number> = new Map();

// Takes base58 addresses, not pubkeys: `toBase58` re-encodes on every call, and a caller that renders
// one row per account already holds the string.
export function useAccountSizes(addresses: readonly string[], clusterUrl: string) {
    // eslint-disable-next-line unicorn/no-null -- SWR's sentinel for "skip this fetch"
    const swrKey = addresses.length > 0 ? ['account-sizes', addresses.join(','), clusterUrl] : null;

    const { data, error, isLoading } = useSWR(swrKey, () => fetchAccountSizes(addresses, clusterUrl), {
        // Sizes feed a footer total, so refetching the whole list on tab focus is wasted.
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
    });

    return { error, loading: isLoading, sizes: data ?? EMPTY_SIZES };
}
