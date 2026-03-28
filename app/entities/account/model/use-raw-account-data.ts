import { useCluster } from '@providers/cluster';
import { Connection, PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';

export const rawAccountDataKey = (url: string, address: string) => ['raw-account-data', url, address] as const;

function useConnection() {
    const { url } = useCluster();
    return useMemo(() => new Connection(url, 'confirmed'), [url]);
}

export function useRawAccountData(address: string) {
    const connection = useConnection();

    return useSWR(rawAccountDataKey(connection.rpcEndpoint, address), () => fetchRawAccountData(connection, address), {
        revalidateOnFocus: false,
        revalidateOnMount: false,
        revalidateOnReconnect: false,
    });
}

/** Eager variant — fetches immediately on mount. Used by RawAccountRows in AccountCard. */
export function useRawAccountDataOnMount(pubkey: PublicKey): { data: Uint8Array | undefined; isLoading: boolean } {
    const connection = useConnection();

    const { data, isLoading } = useSWRImmutable(rawAccountDataKey(connection.rpcEndpoint, pubkey.toBase58()), () =>
        fetchRawAccountData(connection, pubkey.toBase58()),
    );

    return { data, isLoading };
}

async function fetchRawAccountData(connection: Connection, address: string): Promise<Uint8Array | undefined> {
    const info = await connection.getAccountInfo(new PublicKey(address));
    return info?.data ? new Uint8Array(info.data) : undefined;
}
