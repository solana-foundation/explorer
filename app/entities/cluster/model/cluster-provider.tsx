'use client';

import { createContext, type ReactNode } from 'react';
import useSWRImmutable from 'swr/immutable';

import { Logger } from '@/app/shared/lib/logger';

import { fetchGenesisHash } from '../api/fetch-genesis-hash';
import { Cluster, type ClusterSelection, ClusterStatus } from '../lib/cluster';
import type { ConnectableUrl } from '../lib/connectable-url';
import { parseQuery } from '../lib/resolve-cluster';
import type { RpcEndpoint } from '../lib/rpc-endpoint';
import { useClusterUrl } from './use-cluster-url';

interface State {
    // The endpoint a consumer may connect to, or `undefined` until a custom URL is settled. Fetching
    // hooks key on this; `url` stays the value to display.
    //
    // Required rather than optional, because absent and "not settled yet" are the same value to every
    // consumer: a provider that forgot the field would leave all of them waiting, and say nothing.
    connectableUrl: ConnectableUrl | undefined;
    // Chain identity, resolved by the connection health check. Cheap and static per cluster.
    genesisHash?: string;
    // A valid custom endpoint from the query string that the user has not agreed to yet. Nothing connects
    // to it while it is set; the consent prompt owns the decision. Kept beside the selection rather than
    // inside its Custom arm, because it is a question awaiting an answer, not the endpoint in use.
    pendingCustomUrl?: RpcEndpoint;
    // One value, so cluster and endpoint can never disagree. `useCluster()` flattens it for consumers that
    // want only one of them; pass `selection` itself to `clusterUrl` and `buildExplorerLink`.
    selection: ClusterSelection;
    status: ClusterStatus;
}

export type { State as ClusterState };

export const StateContext = createContext<State | undefined>(undefined);

// The cluster selection lives in the URL, but reading/updating it is the host framework's job. The
// app layer injects the current query params and a callback to replace them, so this entity carries no
// router (e.g. next/navigation) dependency.
type ClusterProviderProps = {
    searchParams: URLSearchParams | null;
    onReplaceSearchParams: (next: URLSearchParams) => void;
    children: ReactNode;
};
export function ClusterProvider({ searchParams, onReplaceSearchParams, children }: ClusterProviderProps) {
    const cluster = parseQuery(searchParams);
    const { connectableUrl, pendingCustomUrl, selection, url } = useClusterUrl({
        cluster,
        onReplaceSearchParams,
        searchParams,
    });

    // The connection health check IS the fetch. Keying by URL means a cluster switch abandons the
    // in-flight request (SWR writes it to the old key, never the current one), and a new key resets `data`
    // to undefined, i.e. back to Connecting. A falsy key waits, which is what an unsettled custom URL
    // should do: connecting would contact a node nobody chose.
    const { data: genesisHash, error } = useSWRImmutable(
        connectableUrl && (['cluster-connection', connectableUrl] as const),
        ([, endpoint]: readonly ['cluster-connection', ConnectableUrl]) => fetchGenesisHash(endpoint),
        {
            onError: connectionError => {
                if (cluster !== Cluster.Custom) {
                    Logger.error(connectionError, { clusterUrl: url });
                }
            },
            // What lets a failed connection recover: nothing in the UI retries the check, and a reachable
            // endpoint answers from cache, so the cost falls on the failed case.
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            // A down endpoint must not be hammered while the tab sits open.
            shouldRetryOnError: false,
        },
    );

    // Genesis-hash reachability only. Live ledger info is fetched separately and lazily, so a partial RPC
    // failure there degrades to a loading card that self-heals — it does not fail the whole cluster.
    const status = deriveConnectionStatus({ error, genesisHash });

    return (
        <StateContext.Provider value={{ connectableUrl, genesisHash, pendingCustomUrl, selection, status }}>
            {children}
        </StateContext.Provider>
    );
}

function deriveConnectionStatus({ error, genesisHash }: { error: unknown; genesisHash?: string }): ClusterStatus {
    if (error !== undefined) return ClusterStatus.Failure;
    if (genesisHash !== undefined) return ClusterStatus.Connected;
    return ClusterStatus.Connecting;
}
