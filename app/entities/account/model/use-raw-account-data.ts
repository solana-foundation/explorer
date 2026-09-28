import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';

import { fetchRawAccountData } from '../api/fetch-raw-account-data';

export const rawAccountDataKey = (url: string, address: string) => ['raw-account-data', url, address] as const;

export function useLazyRawAccountData(accountAddress: string) {
    const { data, error, isLoading, mutate } = useRawAccountData(accountAddress);

    return {
        data,
        error,
        load: () => {
            if (data === undefined) void mutate();
        },
        loading: isLoading,
    };
}

const LAZY_SWR = {
    errorRetryCount: 3,
    revalidateOnFocus: false,
    revalidateOnMount: false,
    revalidateOnReconnect: false,
} as const;

export function useRawAccountData(accountAddress: string) {
    const { url } = useCluster();

    return useSWR<Uint8Array | undefined, Error>(
        rawAccountDataKey(url, accountAddress),
        () => fetchRawAccountData(url, accountAddress),
        LAZY_SWR,
    );
}

export function useRawAccountDataOnMount(pubkey: PublicKey): { data: Uint8Array | undefined; isLoading: boolean } {
    const { url } = useCluster();

    const { data, isLoading } = useSWRImmutable(rawAccountDataKey(url, pubkey.toBase58()), () =>
        fetchRawAccountData(url, pubkey.toBase58()),
    );

    return { data, isLoading };
}
