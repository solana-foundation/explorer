'use client';

import { type BlockWithV1, fetchBlock as fetchBlockBySlot } from '@entities/block-data';
import { getRpc } from '@entities/cluster';
import * as Cache from '@providers/cache';
import { useCacheEntry } from '@providers/cache-entry';
import { useCluster } from '@providers/cluster';
import type { Address } from '@solana/kit';
import type { PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import React from 'react';

import { Logger } from '@/app/shared/lib/logger';
import { toLegacyPublicKey } from '@/app/shared/lib/web3js-compat';

export enum FetchStatus {
    Fetching,
    FetchFailed,
    Fetched,
}

export enum ActionType {
    Update,
    Clear,
}

type Block = {
    block?: BlockWithV1;
    blockLeader?: PublicKey;
    childSlot?: number;
    childLeader?: PublicKey;
    parentLeader?: PublicKey;
};

type State = Cache.State<Block>;
type Dispatch = Cache.Dispatch<Block>;

const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type BlockProviderProps = { children: React.ReactNode };

export function BlockProvider({ children }: BlockProviderProps) {
    const { url } = useCluster();
    const [state, dispatch] = Cache.useReducer<Block>(url);

    React.useEffect(() => {
        dispatch({ type: ActionType.Clear, url });
    }, [dispatch, url]);

    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
        </StateContext.Provider>
    );
}

export function useBlock(key: number): Cache.CacheEntry<Block> | undefined {
    const context = React.useContext(StateContext);

    if (!context) {
        throw new Error(`useBlock must be used within a BlockProvider`);
    }

    return useCacheEntry(context.entries, key);
}

export async function fetchBlock(dispatch: Dispatch, url: string, cluster: Cluster, slot: number) {
    dispatch({
        key: slot,
        status: FetchStatus.Fetching,
        type: ActionType.Update,
        url,
    });

    let status: FetchStatus;
    let data: Block | undefined = undefined;

    try {
        const rpc = getRpc(url);
        const block = await fetchBlockBySlot(url, slot);
        if (block === null) {
            data = {};
            status = FetchStatus.Fetched;
        } else {
            const childSlotBigint = (await rpc.getBlocks(BigInt(slot + 1), BigInt(slot + 100)).send()).at(0);
            const childSlot = childSlotBigint === undefined ? undefined : Number(childSlotBigint);
            const firstLeaderSlot = block.parentSlot;

            let leaders: Address[] = [];
            try {
                const lastLeaderSlot = childSlot !== undefined ? childSlot : slot;
                const slotLeadersLimit = lastLeaderSlot - block.parentSlot + 1;
                leaders = await rpc.getSlotLeaders(BigInt(firstLeaderSlot), slotLeadersLimit).send();
            } catch (_err) {
                // ignore errors
            }

            const getLeader = (slot: number): PublicKey | undefined => {
                const leader = leaders.at(slot - firstLeaderSlot);
                return leader === undefined ? undefined : toLegacyPublicKey(leader);
            };

            data = {
                block,
                blockLeader: getLeader(slot),
                childLeader: childSlot !== undefined ? getLeader(childSlot) : undefined,
                childSlot,
                parentLeader: getLeader(block.parentSlot),
            };
            status = FetchStatus.Fetched;
        }
    } catch (err) {
        status = FetchStatus.FetchFailed;
        if (cluster !== Cluster.Custom) {
            Logger.error(err, { url });
        }
    }

    dispatch({
        data,
        key: slot,
        status,
        type: ActionType.Update,
        url,
    });
}

export function useFetchBlock() {
    const dispatch = React.useContext(DispatchContext);
    if (!dispatch) {
        throw new Error(`useFetchBlock must be used within a BlockProvider`);
    }

    const { cluster, url } = useCluster();
    return React.useCallback((key: number) => fetchBlock(dispatch, url, cluster, key), [dispatch, cluster, url]);
}
