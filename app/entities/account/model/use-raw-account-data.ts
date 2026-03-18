import { useCluster } from '@providers/cluster';
import { Connection, PublicKey } from '@solana/web3.js';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';

export const rawAccountDataKey = (url: string, address: string) => ['raw-account-data', url, address] as const;

export function useRawAccountData(address: string) {
    const { url } = useCluster();
    return useSWR(rawAccountDataKey(url, address), () => fetchRawAccountData(url, address), {
        revalidateOnFocus: false,
        revalidateOnMount: false,
        revalidateOnReconnect: false,
    });
}

/** Eager variant — fetches immediately on mount. Used by RawAccountRows in AccountCard. */
export function useRawAccountDataOnMount(pubkey: PublicKey): Uint8Array | null {
    const { url } = useCluster();

    const { data } = useSWRImmutable(rawAccountDataKey(url, pubkey.toBase58()), () =>
        fetchRawAccountData(url, pubkey.toBase58()),
    );

    return data ?? null;
}

async function fetchRawAccountData(url: string, address: string): Promise<Uint8Array | undefined> {
    const connection = new Connection(url, 'confirmed');
    const info = await connection.getAccountInfo(new PublicKey(address));
    return info?.data ? new Uint8Array(info.data) : undefined;
}
