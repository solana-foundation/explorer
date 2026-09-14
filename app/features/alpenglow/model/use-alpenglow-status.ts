import 'client-only';

import { type ConnectableUrl, useCluster } from '@entities/cluster';
import { type Cluster } from '@utils/cluster';
import useSWRImmutable from 'swr/immutable';

import { Logger } from '@/app/shared/lib/logger';

import { type AgGenesisCertAnswer, fetchAgGenesisCert } from '../api/fetch-ag-genesis-cert';
import { type AlpenglowUpgrade } from '../lib/genesis-cert';

/**
 * Where the cluster stands on the Alpenglow migration. `unavailable` covers every way an endpoint
 * declines to say — too old for the method, refusing it by policy or by key, answering with
 * something that is not a certificate, or failing outright. None is something a visitor can act on,
 * and the card shows nothing rather than reporting an outage it cannot diagnose.
 */
export type AlpenglowStatus = { kind: 'loading' } | { kind: 'unavailable' } | AlpenglowUpgrade;

/** How often a cluster still waiting for its certificate is asked again. */
export const POLL_INTERVAL_MS = 60_000;

/**
 * Capped, because SWR retries forever when this is unset and an endpoint failing this often will
 * not answer the next attempt either. Nothing the node has settled reaches this path — every such
 * reply is carried as an answer — so what is left is a node that is down or unreachable.
 */
export const ERROR_RETRY_COUNT = 3;

export function useAlpenglowStatus(): AlpenglowStatus {
    const { cluster, connectableUrl } = useCluster();

    // Immutable, so a focus, a reconnect or a revisit never re-asks: for two of the three answers
    // the next request cannot say anything new, and the third has its own poll below. A settled
    // endpoint therefore costs exactly one request per cluster per session.
    //
    // Every cluster is asked, rather than a list of the ones known to answer: mainnet is the one
    // most worth tracking, and such a list would need editing at the moment the migration lands.
    // The endpoint's own answer is the gate, and it costs one request per cluster to get.
    //
    // A falsy key waits, which is what an unsettled custom URL should do. The endpoint belongs in
    // the key because a known cluster can still point somewhere local.
    const { data, error } = useSWRImmutable(
        connectableUrl && (['alpenglow-genesis-cert', cluster, connectableUrl] as const),
        ([, , endpoint]: readonly ['alpenglow-genesis-cert', Cluster, ConnectableUrl]) => fetchAgGenesisCert(endpoint),
        {
            errorRetryCount: ERROR_RETRY_COUNT,
            onError: fetchError => {
                // Console only. This fires once per visitor with no cache in front of it, so one
                // slow cluster would otherwise set the Sentry error rate on its own — and a node
                // refusing the call needs a configuration change, not an alert.
                Logger.warn('[alpenglow] genesis certificate lookup failed', { cause: fetchError, cluster });
            },
            // The certificate is minted once and never changes, so only a cluster still waiting for
            // one is worth asking again. A node without the method will not grow one either.
            refreshInterval: (latest?: AgGenesisCertAnswer) => (latest?.kind === 'absent' ? POLL_INTERVAL_MS : 0),
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
