import 'client-only';

import { getRpc, useCluster } from '@entities/cluster';
import useSWR from 'swr';

const REFRESH_INTERVAL_MS = 60_000;

/**
 * The cluster's current epoch. Unlike `useEpochInfo`, this revalidates, so a page left open across an
 * epoch boundary does not keep showing a lockup that has ended.
 */
export function useCurrentEpoch(): bigint | undefined {
    const { url } = useCluster();
    const { data } = useSWR(
        url ? (['stake-current-epoch', url] as const) : undefined,
        async () => (await getRpc(url).getEpochInfo().send()).epoch,
        { errorRetryCount: 3, refreshInterval: REFRESH_INTERVAL_MS },
    );
    return data;
}
