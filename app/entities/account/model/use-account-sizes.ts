import { useCluster } from '@providers/cluster';
import { Cluster } from '@utils/cluster';
import useSWR from 'swr';

import { Logger } from '@/app/shared/lib/logger';

import { fetchAccountSizes } from '../api/fetch-account-sizes';

const EMPTY_SIZES: ReadonlyMap<string, number> = new Map();

export const ERROR_RETRY_COUNT = 3;

export function useAccountSizes(addresses: readonly string[]): ReadonlyMap<string, number> {
    const { cluster, url } = useCluster();
    // eslint-disable-next-line unicorn/no-null -- SWR's sentinel for "skip this fetch"
    const swrKey = addresses.length > 0 ? ['account-sizes', addresses.join(','), url] : null;

    const { data } = useSWR(swrKey, () => fetchAccountSizes(addresses, url), {
        errorRetryCount: ERROR_RETRY_COUNT,
        onError: error => {
            if (cluster !== Cluster.Custom) {
                Logger.error(error, { url });
            }
        },
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
    });

    return data ?? EMPTY_SIZES;
}
