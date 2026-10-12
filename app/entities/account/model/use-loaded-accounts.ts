import { useCluster } from '@providers/cluster';
import { Cluster } from '@utils/cluster';
import useSWR from 'swr';

import { Logger } from '@/app/shared/lib/logger';

import { fetchLoadedAccounts, type LoadedAccounts } from '../api/fetch-loaded-accounts';

export const ERROR_RETRY_COUNT = 3;

/** The accounts a transaction naming `addresses` loads, or `undefined` until they are known. */
export function useLoadedAccounts(addresses: readonly string[]): LoadedAccounts | undefined {
    const { cluster, url } = useCluster();
    // eslint-disable-next-line unicorn/no-null -- SWR's sentinel for "skip this fetch"
    const swrKey = addresses.length > 0 ? getLoadedAccountsSwrKey(addresses, url) : null;

    const { data } = useSWR(swrKey, () => fetchLoadedAccounts(addresses, url), {
        errorRetryCount: ERROR_RETRY_COUNT,
        onError: error => {
            if (cluster !== Cluster.Custom) {
                Logger.error(error, { url });
            }
        },
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
    });

    return data;
}

export function getLoadedAccountsSwrKey(addresses: readonly string[], url: string) {
    return ['loaded-accounts', addresses.join(','), url];
}
