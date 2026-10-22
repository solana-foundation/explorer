import { FetchAccountDataMode, useFetchAccountInfo } from '@providers/accounts';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { useCallback } from 'react';
import { useSWRConfig } from 'swr';

import { isAccountRefreshKey } from '@/app/shared/lib/account-refresh-key';

export function useRefreshAccount() {
    const fetchAccount = useFetchAccountInfo();
    const { url } = useCluster();
    const { mutate } = useSWRConfig();

    return useCallback(
        (pubkey: PublicKey, dataMode: FetchAccountDataMode) => {
            fetchAccount(pubkey, dataMode);
            mutate(key => isAccountRefreshKey(key, url, pubkey.toBase58()));
        },
        [fetchAccount, mutate, url],
    );
}
