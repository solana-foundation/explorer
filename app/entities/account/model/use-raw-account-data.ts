import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';

import { fetchRawAccountData } from '../api/fetch-raw-account-data';

export const rawAccountDataKey = (url: string, address: string) => ['raw-account-data', url, address] as const;

/**
 * Raw bytes that nothing fetches until `load` runs, so listing accounts costs no account data.
 * `load` fetches only while the bytes are missing. An absent account also reads as missing, so `load`
 * asks for it again every time.
 */
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
    // Without a cap SWR retries a failing RPC forever, so the viewer never settles on the error.
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

/** Eager variant — fetches immediately on mount. */
export function useRawAccountDataOnMount(pubkey: PublicKey): { data: Uint8Array | undefined; isLoading: boolean } {
    const { url } = useCluster();

    const { data, isLoading } = useSWRImmutable(rawAccountDataKey(url, pubkey.toBase58()), () =>
        fetchRawAccountData(url, pubkey.toBase58()),
    );

    return { data, isLoading };
}
