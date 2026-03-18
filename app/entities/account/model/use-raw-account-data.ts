import { useCluster } from '@providers/cluster';
import { Connection, PublicKey } from '@solana/web3.js';
import { useState } from 'react';
import useSWRImmutable from 'swr/immutable';

export function useRawAccountData(pubkey: PublicKey): [Uint8Array | null, () => void] {
    const { url } = useCluster();
    const [enabled, setEnabled] = useState(false);

    const { data } = useSWRImmutable(enabled ? getRawAccountDataKey(url, pubkey) : null, fetchRawAccountData);

    return [data ?? null, () => setEnabled(true)];
}

function getRawAccountDataKey(url: string, pubkey: PublicKey) {
    return ['rawAccountData', url, pubkey.toBase58()];
}

async function fetchRawAccountData([, url, address]: [string, string, string]): Promise<Uint8Array | null> {
    const connection = new Connection(url, 'confirmed');
    const info = await connection.getAccountInfo(new PublicKey(address));
    return info ? Uint8Array.from(info.data) : null;
}
