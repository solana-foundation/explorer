import { getRpc } from '@entities/cluster/@x/account';
import { address } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';
import useSWR from 'swr';

import { ByteArray, fromBase64 } from '@/app/shared/lib/bytes';

export interface AccountInfo {
    data: ByteArray;
    size: number;
}

// The RPC rejects getMultipleAccounts requests over 100 addresses, so larger account
// lists must be split — otherwise the whole fetch fails and every row errors. Mirrors
// the accounts provider's BATCH_SIZE for the same ceiling.
export const MAX_ACCOUNTS_PER_REQUEST = 100;

async function fetchAccountsInfo(pubkeys: PublicKey[], clusterUrl: string): Promise<Map<string, AccountInfo>> {
    const result = new Map<string, AccountInfo>();

    for (let start = 0; start < pubkeys.length; start += MAX_ACCOUNTS_PER_REQUEST) {
        const chunk = pubkeys.slice(start, start + MAX_ACCOUNTS_PER_REQUEST);
        const { value: infos } = await getRpc(clusterUrl)
            .getMultipleAccounts(
                chunk.map(pubkey => address(pubkey.toBase58())),
                { encoding: 'base64' },
            )
            .send();

        infos.forEach((info, i) => {
            if (info) {
                const data = fromBase64(info.data[0]);
                result.set(chunk[i].toBase58(), {
                    data,
                    size: data.length,
                });
            }
        });
    }

    return result;
}

export function useAccountsInfo(pubkeys: PublicKey[], clusterUrl: string) {
    const swrKey = pubkeys.length > 0 ? ['accounts-info', pubkeys.map(p => p.toBase58()).join(','), clusterUrl] : null;

    const { data, error, isLoading } = useSWR(swrKey, () => fetchAccountsInfo(pubkeys, clusterUrl));

    return { accounts: data ?? new Map<string, AccountInfo>(), error, loading: isLoading };
}
