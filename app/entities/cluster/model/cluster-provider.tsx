'use client';

import { createContext, type ReactNode } from 'react';
import useSWRImmutable from 'swr/immutable';

import { Logger } from '@/app/shared/lib/logger';

import { fetchGenesisHash } from '../api/fetch-genesis-hash';
import { Cluster, type ClusterSelection, ClusterStatus } from '../lib/cluster';
import { parseQuery } from '../lib/resolve-cluster';
import type { RpcEndpoint } from '../lib/rpc-endpoint';
import { useClusterUrl } from './use-cluster-url';

interface State {
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
    const { customUrlDecided, pendingCustomUrl, selection, url } = useClusterUrl({
        cluster,
        onReplaceSearchParams,
        searchParams,
    });

    // The connection health check IS the fetch. Keying by URL means a cluster switch abandons the
    // in-flight request (SWR writes it to the old key, never the current one), and a new key resets `data`
    // to undefined, i.e. back to Connecting.
    //
    // The key is null while consent is pending or the custom URL is undecided (see `useClusterUrl`): `url`
    // is the fallback endpoint then, so connecting would contact a node nobody chose and defeat the prompt
    // asking about a different one. Status reads Connecting until the user answers.
    //
    // Status tracks ONLY genesis-hash reachability. Live ledger info (epoch/schedule/first block) is
    // fetched separately and lazily by useClusterInfo(), so a partial RPC failure there degrades to a
    // loading card that self-heals via SWR retry — it does not fail the whole cluster.
    // eslint-disable-next-line unicorn/no-null -- SWR treats a null key, and only null, as "do not fetch"
    const connectionKey = pendingCustomUrl === undefined && customUrlDecided ? ['cluster-connection', url] : null;
    const { data: genesisHash, error } = useSWRImmutable(connectionKey, () => fetchGenesisHash(url), {
        onError: connectionError => {
            if (cluster !== Cluster.Custom) {
                Logger.error(connectionError, { clusterUrl: url });
            }
        },
        shouldRetryOnError: false,
    });

    const status = deriveConnectionStatus({ error, genesisHash });

    return (
        <StateContext.Provider value={{ genesisHash, pendingCustomUrl, selection, status }}>
            {children}
        </StateContext.Provider>
    );
}

function deriveConnectionStatus({ error, genesisHash }: { error: unknown; genesisHash?: string }): ClusterStatus {
    if (error !== undefined) return ClusterStatus.Failure;
    if (genesisHash !== undefined) return ClusterStatus.Connected;
    return ClusterStatus.Connecting;
}
