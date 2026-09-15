import { PublicKey } from '@solana/web3.js';
import useSWR from 'swr';

import { fetchAccountSizes } from '../api/fetch-account-sizes';

const EMPTY_SIZES: ReadonlyMap<string, number> = new Map();

export function useAccountSizes(pubkeys: PublicKey[], clusterUrl: string) {
    // eslint-disable-next-line unicorn/no-null -- SWR's sentinel for "skip this fetch"
    const swrKey = pubkeys.length > 0 ? ['account-sizes', pubkeys.map(p => p.toBase58()).join(','), clusterUrl] : null;

    const { data, error, isLoading } = useSWR(swrKey, () => fetchAccountSizes(pubkeys, clusterUrl), {
        // Sizes feed a footer total, so refetching the whole list on tab focus is wasted.
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
    });

    return { error, loading: isLoading, sizes: data ?? EMPTY_SIZES };
}
