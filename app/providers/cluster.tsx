'use client';

import { findSavedClusterUrl, persistedClusterAtom, SAVED_CLUSTER_PREFIX, savedClustersAtom } from '@features/custom-cluster';
import { createSolanaRpc } from '@solana/kit';
import { Cluster, clusterFromSlug, clusterName, clusterSlug, ClusterStatus, clusterUrl, DEFAULT_CLUSTER } from '@utils/cluster';
import { localStorageIsAvailable } from '@utils/local-storage';
import { useAtom, useAtomValue } from 'jotai';
import { ReadonlyURLSearchParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';

import { EpochSchedule } from '../utils/epoch-schedule';

type Action = State;

interface EpochInfo {
    absoluteSlot: bigint;
    blockHeight: bigint;
    epoch: bigint;
    slotIndex: bigint;
    slotsInEpoch: bigint;
}

export interface ClusterInfo {
    firstAvailableBlock: bigint;
    epochSchedule: EpochSchedule;
    epochInfo: EpochInfo;
    genesisHash: string;
}

type Dispatch = (action: Action) => void;

type SetShowModal = React.Dispatch<React.SetStateAction<boolean>>;

interface State {
    cluster: Cluster;
    customUrl: string;
    clusterInfo?: ClusterInfo;
    status: ClusterStatus;
}

const DEFAULT_CUSTOM_URL = 'http://localhost:8899';

function clusterReducer(state: State, action: Action): State {
    switch (action.status) {
        case ClusterStatus.Connected:
        case ClusterStatus.Failure: {
            if (state.cluster !== action.cluster || state.customUrl !== action.customUrl) return state;
            return action;
        }
        case ClusterStatus.Connecting: {
            return action;
        }
    }
}

export function parseQuery(searchParams: ReadonlyURLSearchParams | null, persisted: string | null): Cluster {
    const clusterParam = searchParams?.get('cluster');
    if (clusterParam) {
        return clusterFromSlug(clusterParam) ?? DEFAULT_CLUSTER;
    }

    if (persisted?.startsWith(SAVED_CLUSTER_PREFIX)) return Cluster.Custom;

    return DEFAULT_CLUSTER;
}

const ModalContext = createContext<[boolean, SetShowModal] | undefined>(undefined);
const StateContext = createContext<State | undefined>(undefined);
const DispatchContext = createContext<Dispatch | undefined>(undefined);

const WHITELISTED_RPCS = [
    // Used for solana.com live code example
    'engine.mirror.ad',
];

function isWhitelistedRpc(url: string) {
    try {
        return WHITELISTED_RPCS.includes(new URL(url).hostname);
    } catch (e) {
        return false;
    }
}

type ClusterProviderProps = { children: React.ReactNode };
export function ClusterProvider({ children }: ClusterProviderProps) {
    const [state, dispatch] = useReducer(clusterReducer, {
        cluster: DEFAULT_CLUSTER,
        customUrl: DEFAULT_CUSTOM_URL,
        status: ClusterStatus.Connecting,
    });
    const modalState = useState(false);
    const searchParams = useSearchParams();
    const [persistedCluster, setPersistedCluster] = useAtom(persistedClusterAtom);
    const savedClusters = useAtomValue(savedClustersAtom);
    const cluster = parseQuery(searchParams, persistedCluster);
    const enableCustomUrl =
        cluster === Cluster.Custom ||
        (localStorageIsAvailable() && localStorage.getItem('enableCustomUrl') !== null) ||
        isWhitelistedRpc(state.customUrl);

    const urlFromParams = enableCustomUrl ? searchParams?.get('customUrl') || null : null;
    const urlFromSaved =
        cluster === Cluster.Custom && !urlFromParams ? findSavedClusterUrl(savedClusters, persistedCluster ?? '') : undefined;
    const customUrl = urlFromParams ?? urlFromSaved ?? state.customUrl;
    const pathname = usePathname();
    const router = useRouter();

    // Remove customUrl param if dev setting is disabled
    useEffect(() => {
        if (!enableCustomUrl && searchParams?.has('customUrl')) {
            const newSearchParams = new URLSearchParams();
            searchParams.forEach((value, key) => {
                if (key === 'customUrl') {
                    return;
                }
                newSearchParams.set(key, value);
            });
            const nextQueryString = newSearchParams.toString();
            router.push(`${pathname}${nextQueryString ? `?${nextQueryString}` : ''}`);
        }
    }, [enableCustomUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (cluster === Cluster.Custom && persistedCluster?.startsWith(SAVED_CLUSTER_PREFIX)) return;
        setPersistedCluster(null);
    }, [cluster]); // eslint-disable-line react-hooks/exhaustive-deps

    // Reconnect to cluster when params change
    useEffect(() => {
        updateCluster(dispatch, cluster, customUrl);
    }, [cluster, customUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>
                <ModalContext.Provider value={modalState}>{children}</ModalContext.Provider>
            </DispatchContext.Provider>
        </StateContext.Provider>
    );
}

async function updateCluster(dispatch: Dispatch, cluster: Cluster, customUrl: string) {
    dispatch({
        cluster,
        customUrl,
        status: ClusterStatus.Connecting,
    });

    try {
        // validate url
        new URL(customUrl);

        const transportUrl = clusterUrl(cluster, customUrl);
        const rpc = createSolanaRpc(transportUrl);

        const [firstAvailableBlock, epochSchedule, epochInfo, genesisHash] = await Promise.all([
            rpc.getFirstAvailableBlock().send(),
            rpc.getEpochSchedule().send(),
            rpc.getEpochInfo().send(),
            rpc.getGenesisHash().send(),
        ]);

        dispatch({
            cluster,
            clusterInfo: {
                epochInfo,
                // These are incorrectly typed as unknown
                // See https://github.com/solana-labs/solana-web3.js/issues/1389
                epochSchedule: epochSchedule as EpochSchedule,
                firstAvailableBlock: firstAvailableBlock as bigint,
                genesisHash,
            },
            customUrl,
            status: ClusterStatus.Connected,
        });
    } catch (error) {
        if (cluster !== Cluster.Custom) {
            console.error(error, { clusterUrl: clusterUrl(cluster, customUrl) });
        }
        dispatch({
            cluster,
            customUrl,
            status: ClusterStatus.Failure,
        });
    }
}

export function useUpdateCustomUrl() {
    const dispatch = useContext(DispatchContext);
    if (!dispatch) {
        throw new Error(`useUpdateCustomUrl must be used within a ClusterProvider`);
    }

    return (customUrl: string) => {
        updateCluster(dispatch, Cluster.Custom, customUrl);
    };
}

export function useCluster() {
    const context = useContext(StateContext);
    if (!context) {
        throw new Error(`useCluster must be used within a ClusterProvider`);
    }
    return {
        ...context,
        name: clusterName(context.cluster),
        url: clusterUrl(context.cluster, context.customUrl),
    };
}

export function useClusterModal() {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error(`useClusterModal must be used within a ClusterProvider`);
    }
    return context;
}
