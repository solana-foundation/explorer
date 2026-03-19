import { useCluster } from '@providers/cluster';
import { Connection, PublicKey } from '@solana/web3.js';
import { useCallback } from 'react';
import useSWR, { useSWRConfig } from 'swr';

export const rawAccountDataKey = (url: string, address: string) => ['raw-account-data', url, address] as const;

export function useRawAccountData(address: string) {
    const { url } = useCluster();
    return useSWR(rawAccountDataKey(url, address), () => fetchRawAccountData(url, address), {
        revalidateOnFocus: false,
        revalidateOnMount: false,
        revalidateOnReconnect: false,
    });
}

export function useRefreshRawAccountData(address: string) {
    const { url } = useCluster();
    const { mutate } = useSWRConfig();

    return useCallback(() => {
        mutate(rawAccountDataKey(url, address));
    }, [mutate, url, address]);
}

async function fetchRawAccountData(url: string, address: string): Promise<Uint8Array | undefined> {
    const connection = new Connection(url, 'confirmed');
    const info = await connection.getAccountInfo(new PublicKey(address));
    return info?.data ? new Uint8Array(info.data) : undefined;
}
