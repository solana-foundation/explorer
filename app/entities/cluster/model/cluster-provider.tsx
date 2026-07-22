'use client';

import { createContext, type ReactNode } from 'react';
import useSWRImmutable from 'swr/immutable';

import { Logger } from '@/app/shared/lib/logger';

import { fetchGenesisHash } from '../api/fetch-genesis-hash';
import { Cluster, ClusterStatus } from '../lib/cluster';
import { parseQuery } from '../lib/resolve-cluster';
import { useClusterUrl } from './use-cluster-url';

interface State {
    cluster: Cluster;
    customUrl: string;
    // Chain identity, resolved by the connection health check. Cheap and static per cluster.
    genesisHash?: string;
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
    const { customUrl, url } = useClusterUrl({ cluster, onReplaceSearchParams, searchParams });

    // The connection health check IS the fetch. Keying by URL means a cluster switch abandons the
    // in-flight request (SWR writes it to the old key, never the current one) — this replaces the old
    // manual stale-response guard — and a new key resets `data` to undefined, i.e. back to Connecting.
    //
    // Status tracks ONLY genesis-hash reachability. Live ledger info (epoch/schedule/first block) is
    // fetched separately and lazily by useClusterInfo(), so a partial RPC failure there degrades to a
    // loading card that self-heals via SWR retry — it does not fail the whole cluster.
    const { data: genesisHash, error } = useSWRImmutable(['cluster-connection', url], () => fetchGenesisHash(url), {
        onError: connectionError => {
            if (cluster !== Cluster.Custom) {
                Logger.error(connectionError, { clusterUrl: url });
            }
        },
        shouldRetryOnError: false,
    });

    const status = deriveConnectionStatus({ error, genesisHash });

    return (
        <StateContext.Provider value={{ cluster, customUrl, genesisHash, status }}>{children}</StateContext.Provider>
    );
}

function deriveConnectionStatus({ error, genesisHash }: { error: unknown; genesisHash?: string }): ClusterStatus {
    if (error !== undefined) return ClusterStatus.Failure;
    if (genesisHash !== undefined) return ClusterStatus.Connected;
    return ClusterStatus.Connecting;
}
