import { FetchAccountDataMode, useFetchAccountInfo } from '@providers/accounts';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { useCallback } from 'react';
import { useSWRConfig } from 'swr';

import { rawAccountDataKey } from './use-raw-account-data';

/**
 * Drop-in replacement for `useFetchAccountInfo` that also invalidates
 * any lazily-fetched raw account data cached by SWR.
 * Use this for refresh buttons so that both parsed and raw data are re-fetched.
 */
export function useRefreshAccount() {
    const fetchAccount = useFetchAccountInfo();
    const { url } = useCluster();
    const { mutate } = useSWRConfig();

    return useCallback(
        (pubkey: PublicKey, dataMode: FetchAccountDataMode) => {
            fetchAccount(pubkey, dataMode);
            mutate(rawAccountDataKey(url, pubkey.toBase58()));
        },
        [fetchAccount, mutate, url],
    );
}
