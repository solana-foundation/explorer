import { FetchAccountDataMode, useFetchAccountInfo } from '@providers/accounts';
import { useCluster } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import { getFullTokenInfoSwrKey } from '@utils/token-info';
import { useCallback } from 'react';
import { useSWRConfig } from 'swr';

import { rawAccountDataKey } from './use-raw-account-data';

export function useRefreshAccount() {
    const fetchAccount = useFetchAccountInfo();
    const { cluster, genesisHash, url } = useCluster();
    const { mutate } = useSWRConfig();

    return useCallback(
        (pubkey: PublicKey, dataMode: FetchAccountDataMode) => {
            fetchAccount(pubkey, dataMode);
            mutate(rawAccountDataKey(url, pubkey.toBase58()));
            mutate(getFullTokenInfoSwrKey(pubkey.toBase58(), cluster, url, genesisHash));
        },
        [cluster, fetchAccount, genesisHash, mutate, url],
    );
}
