import { Connection, PublicKey } from '@solana/web3.js';
import useSWR from 'swr';

import { ByteArray } from '@/app/shared/lib/bytes';

export interface AccountInfo {
    data: ByteArray;
    size: number;
}

async function fetchAccountsInfo(pubkeys: PublicKey[], clusterUrl: string): Promise<Map<string, AccountInfo>> {
    const connection = new Connection(clusterUrl);
    const infos = await connection.getMultipleAccountsInfo(pubkeys);

    const result = new Map<string, AccountInfo>();
    infos.forEach((info, i) => {
        if (info) {
            result.set(pubkeys[i].toBase58(), {
                data: info.data,
                size: info.data.length,
            });
        }
    });
    return result;
}

export function useAccountsInfo(pubkeys: PublicKey[], clusterUrl: string) {
    const swrKey = pubkeys.length > 0 ? ['accounts-info', pubkeys.map(p => p.toBase58()).join(','), clusterUrl] : null;

    const { data, error, isLoading } = useSWR(swrKey, () => fetchAccountsInfo(pubkeys, clusterUrl));

    return { accounts: data ?? new Map<string, AccountInfo>(), error, loading: isLoading };
}
