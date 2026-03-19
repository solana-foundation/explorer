import { useCluster } from '@providers/cluster';
import { Connection, PublicKey } from '@solana/web3.js';
import useSWR from 'swr';

export const rawAccountDataKey = (url: string, address: string) => ['raw-account-data', url, address] as const;

export function useRawAccountData(address: string) {
    const { url } = useCluster();
    return useSWR(rawAccountDataKey(url, address), () => fetchRawAccountData(url, address), {
        revalidateOnFocus: false,
        revalidateOnMount: false,
        revalidateOnReconnect: false,
    });
}

async function fetchRawAccountData(url: string, address: string): Promise<Uint8Array | undefined> {
    const connection = new Connection(url, 'confirmed');
    const info = await connection.getAccountInfo(new PublicKey(address));
    return info?.data ? new Uint8Array(info.data) : undefined;
}
