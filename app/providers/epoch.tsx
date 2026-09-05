'use client';

import { getRpc } from '@entities/cluster';
import * as Cache from '@providers/cache';
import { useCacheEntry } from '@providers/cache-entry';
import { useCluster } from '@providers/cluster';
import type { UnixTimestamp } from '@solana/kit';
import { Cluster } from '@utils/cluster';
import React from 'react';

import { Logger } from '@/app/shared/lib/logger';

import { EpochSchedule, getFirstSlotInEpoch, getLastSlotInEpoch } from '../utils/epoch-schedule';

export enum FetchStatus {
    Fetching,
    FetchFailed,
    Fetched,
}

export enum ActionType {
    Update,
    Clear,
}

type Epoch = {
    firstBlock: number;
    firstTimestamp: number | null;
    lastBlock?: number;
    lastTimestamp: number | null;
};

type State = Cache.State<Epoch>;
type Dispatch = Cache.Dispatch<Epoch>;

const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type EpochProviderProps = { children: React.ReactNode };

export function EpochProvider({ children }: EpochProviderProps) {
    const { url } = useCluster();
    const [state, dispatch] = Cache.useReducer<Epoch>(url);

    React.useEffect(() => {
        dispatch({ type: ActionType.Clear, url });
    }, [dispatch, url]);

    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
        </StateContext.Provider>
    );
}

export function useEpoch(key: number): Cache.CacheEntry<Epoch> | undefined {
    const context = React.useContext(StateContext);

    if (!context) {
        throw new Error(`useEpoch must be used within a EpochProvider`);
    }

    return useCacheEntry(context.entries, key);
}

export async function fetchEpoch(
    dispatch: Dispatch,
    url: string,
    cluster: Cluster,
    epochSchedule: EpochSchedule,
    currentEpoch: bigint,
    epoch: number,
) {
    dispatch({
        key: epoch,
        status: FetchStatus.Fetching,
        type: ActionType.Update,
        url,
    });

    let status: FetchStatus;
    let data: Epoch | undefined = undefined;

    try {
        const rpc = getRpc(url);
        const firstSlot = getFirstSlotInEpoch(epochSchedule, BigInt(epoch));
        const lastSlot = getLastSlotInEpoch(epochSchedule, BigInt(epoch));
        const [firstBlock, lastBlock] = await Promise.all([
            (async () => {
                const firstBlocks = await rpc.getBlocks(firstSlot, firstSlot + 100n).send();
                return firstBlocks.at(0);
            })(),
            (async () => {
                const lastBlocks = await rpc.getBlocks(lastSlot > 100n ? lastSlot - 100n : 0n, lastSlot).send();
                return lastBlocks.at(-1);
            })(),
        ]);

        if (firstBlock === undefined) {
            throw new Error(`failed to find confirmed block at start of epoch ${epoch}`);
        } else if (epoch < currentEpoch && lastBlock === undefined) {
            throw new Error(`failed to find confirmed block at end of epoch ${epoch}`);
        }

        const [firstTimestamp, lastTimestamp] = await Promise.all<UnixTimestamp | null>([
            rpc.getBlockTime(firstBlock).send(),
            lastBlock === undefined ? null : rpc.getBlockTime(lastBlock).send(),
        ]);

        data = {
            firstBlock: Number(firstBlock),
            firstTimestamp: firstTimestamp === null ? null : Number(firstTimestamp),
            lastBlock: lastBlock === undefined ? undefined : Number(lastBlock),
            lastTimestamp: lastTimestamp === null ? null : Number(lastTimestamp),
        };
        status = FetchStatus.Fetched;
    } catch (err) {
        status = FetchStatus.FetchFailed;
        if (cluster !== Cluster.Custom) {
            Logger.error(err, { epoch: epoch.toString() });
        }
    }

    dispatch({
        data,
        key: epoch,
        status,
        type: ActionType.Update,
        url,
    });
}

export function useFetchEpoch() {
    const dispatch = React.useContext(DispatchContext);
    if (!dispatch) {
        throw new Error(`useFetchEpoch must be used within a EpochProvider`);
    }

    const { cluster, url } = useCluster();
    return React.useCallback(
        (key: number, currentEpoch: bigint, epochSchedule: EpochSchedule) =>
            fetchEpoch(dispatch, url, cluster, epochSchedule, currentEpoch, key),
        [dispatch, cluster, url],
    );
}
