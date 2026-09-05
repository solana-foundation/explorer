'use client';

import { getRpc } from '@entities/cluster';
import { ActionType } from '@providers/block';
import * as Cache from '@providers/cache';
import { FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { InflationReward, PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import React from 'react';

import { Logger } from '@/app/shared/lib/logger';
import { toKitAddress } from '@/app/shared/lib/web3js-compat';

const REWARDS_AVAILABLE_EPOCH = new Map<Cluster, number>([
    [Cluster.MainnetBeta, 132],
    [Cluster.Testnet, 43],
]);

const PAGE_SIZE = 15;

export type Rewards = {
    highestFetchedEpoch?: number;
    lowestFetchedEpoch?: number;
    rewards: (InflationReward | null)[];
    foundOldest?: boolean;
};

export type RewardsUpdate = {
    rewards: (InflationReward | null)[];
    highestFetchedEpoch: number;
    lowestFetchedEpoch: number;
    foundOldest?: boolean;
};

type State = Cache.State<Rewards>;
type Dispatch = Cache.Dispatch<RewardsUpdate>;

function reconcile(rewards: Rewards | undefined, update: RewardsUpdate | undefined): Rewards | undefined {
    if (update === undefined) {
        return rewards;
    }

    const combined = [...(rewards?.rewards ?? []), ...update.rewards];
    const byEpoch = new Map<number, InflationReward>();
    combined.forEach(r => {
        if (r) byEpoch.set(r.epoch, r);
    });

    return {
        foundOldest: update.foundOldest,
        highestFetchedEpoch: rewards?.highestFetchedEpoch ?? update.highestFetchedEpoch,
        lowestFetchedEpoch: update.lowestFetchedEpoch,
        rewards: Array.from(byEpoch.values()),
    };
}

export const StateContext = React.createContext<State | undefined>(undefined);
export const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type RewardsProviderProps = { children: React.ReactNode };

export function RewardsProvider({ children }: RewardsProviderProps) {
    const { url } = useCluster();
    const [state, dispatch] = Cache.useCustomReducer(url, reconcile);

    React.useEffect(() => {
        dispatch({ type: ActionType.Clear, url });
    }, [dispatch, url]);

    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
        </StateContext.Provider>
    );
}

async function fetchRewards(
    dispatch: Dispatch,
    pubkey: PublicKey,
    cluster: Cluster,
    url: string,
    fromEpoch?: number,
    highestEpoch?: number,
) {
    dispatch({
        key: pubkey.toBase58(),
        status: FetchStatus.Fetching,
        type: ActionType.Update,
        url,
    });

    const lowestAvailableEpoch = REWARDS_AVAILABLE_EPOCH.get(cluster) || 0;
    const rpc = getRpc(url);
    const address = toKitAddress(pubkey);

    if (!fromEpoch) {
        try {
            const epochInfo = await rpc.getEpochInfo().send();
            fromEpoch = Number(epochInfo.epoch) - 1;
        } catch (error) {
            if (cluster !== Cluster.Custom) {
                Logger.error(error, { url });
            }

            return dispatch({
                key: pubkey.toBase58(),
                status: FetchStatus.FetchFailed,
                type: ActionType.Update,
                url,
            });
        }

        if (highestEpoch && highestEpoch < fromEpoch) {
            fromEpoch = highestEpoch;
        }
    }

    const getInflationReward = async (epoch: number): Promise<InflationReward | null> => {
        try {
            const [reward] = await rpc.getInflationReward([address], { epoch: BigInt(epoch) }).send();
            // kit returns lamports, slots and epochs as bigints; the cached `Rewards` shape and
            // `reconcile`'s epoch-keyed Map are numbers, as the RPC's own JSON is.
            return reward
                ? {
                      amount: Number(reward.amount),
                      commission: reward.commission,
                      effectiveSlot: Number(reward.effectiveSlot),
                      epoch: Number(reward.epoch),
                      postBalance: Number(reward.postBalance),
                  }
                : null;
        } catch (error) {
            if (cluster !== Cluster.Custom) {
                Logger.error(error, { url });
            }
        }
        return null;
    };

    const requests = [];
    for (let i: number = fromEpoch; i > fromEpoch - PAGE_SIZE; i--) {
        if (i >= 0) {
            requests.push(getInflationReward(i));
        }
    }

    const results = await Promise.all(requests);
    const lowestFetchedEpoch = fromEpoch - requests.length + 1;

    dispatch({
        data: {
            foundOldest: lowestFetchedEpoch <= lowestAvailableEpoch,
            highestFetchedEpoch: fromEpoch,
            lowestFetchedEpoch,
            rewards: results || [],
        },
        key: pubkey.toBase58(),
        status: FetchStatus.Fetched,
        type: ActionType.Update,
        url,
    });
}

export function useRewards(address: string): Cache.CacheEntry<Rewards> | undefined {
    const context = React.useContext(StateContext);

    if (!context) {
        throw new Error(`useRewards must be used within a AccountsProvider`);
    }

    return context.entries[address];
}

export function useFetchRewards() {
    const { cluster, url } = useCluster();
    const state = React.useContext(StateContext);
    const dispatch = React.useContext(DispatchContext);

    if (!state || !dispatch) {
        throw new Error(`useFetchRewards must be used within a AccountsProvider`);
    }

    return React.useCallback(
        (pubkey: PublicKey, highestEpoch?: number) => {
            const before = state.entries[pubkey.toBase58()];
            if (before?.data) {
                fetchRewards(
                    dispatch,
                    pubkey,
                    cluster,
                    url,
                    before.data.lowestFetchedEpoch ? before.data.lowestFetchedEpoch - 1 : undefined,
                    highestEpoch,
                );
            } else {
                fetchRewards(dispatch, pubkey, cluster, url, undefined, highestEpoch);
            }
        },
        [state, dispatch, cluster, url],
    );
}
