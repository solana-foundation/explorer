import 'client-only';

import { type ConnectableUrl, useCluster } from '@entities/cluster';
import { type Cluster } from '@utils/cluster';
import useSWR from 'swr';

import { Logger } from '@/app/shared/lib/logger';

import { type AgGenesisCertAnswer, fetchAgGenesisCert } from '../api/fetch-ag-genesis-cert';
import { type AlpenglowUpgrade } from '../lib/genesis-cert';

/**
 * Where the cluster stands on the Alpenglow migration.
 *
 * `unavailable` covers every way an endpoint declines to answer. None of them is actionable for a
 * visitor, so the card shows nothing.
 */
export type AlpenglowStatus = { kind: 'loading' } | { kind: 'unavailable' } | AlpenglowUpgrade;

/** How often a cluster still waiting for its certificate is asked again. */
export const POLL_INTERVAL_MS = 60_000;

/**
 * SWR retries forever when this is unset, so the count is capped. Settled replies never reach this
 * path, so a failure here means the node is down or unreachable.
 */
export const ERROR_RETRY_COUNT = 3;

export function useAlpenglowStatus(): AlpenglowStatus {
    const { cluster, connectableUrl } = useCluster();

    // An unsettled custom URL produces a falsy key, so SWR waits instead of fetching. The
    // endpoint is part of the key because a known cluster can still point somewhere local.
    const { data, error } = useSWR(
        connectableUrl && (['alpenglow-genesis-cert', cluster, connectableUrl] as const),
        ([, , endpoint]: readonly ['alpenglow-genesis-cert', Cluster, ConnectableUrl]) => fetchAgGenesisCert(endpoint),
        {
            errorRetryCount: ERROR_RETRY_COUNT,
            onError: fetchError => {
                // This fires once per visitor with no cache in front of it, so one slow cluster
                // would dominate the Sentry error rate. It logs to the console instead.
                Logger.warn('[alpenglow] genesis certificate lookup failed', { cause: fetchError, cluster });
            },
            // The certificate is minted once, so only a cluster still waiting for one is polled.
            refreshInterval: (latest?: AgGenesisCertAnswer) => (latest?.kind === 'absent' ? POLL_INTERVAL_MS : 0),
            // `swr/immutable` is shorter, but it pins `refreshInterval` to 0 and would disable
            // the poll above.
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        },
    );

    if (data) {
        switch (data.kind) {
            case 'present':
                return { cert: data.cert, kind: 'migrated' };
            case 'absent':
                return { kind: 'pending' };
            case 'unsupported':
            case 'refused':
            case 'unreadable':
                return { kind: 'unavailable' };
        }
    }
    if (error) return { kind: 'unavailable' };
    return { kind: 'loading' };
}
