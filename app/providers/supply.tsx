'use client';

import { getRpc, useCluster } from '@providers/cluster';
import { Cluster, ClusterStatus } from '@utils/cluster';
import React from 'react';

import { Logger } from '@/app/shared/lib/logger';

type Lamports = bigint;

type Supply = Readonly<{
    circulating: Lamports;
    nonCirculating: Lamports;
    total: Lamports;
}>;

/**
 * One variant per case a consumer has to tell apart, so none of them infers the state from the shape of
 * the value. `idle` and `loading` render the same, but only `idle` means nothing has been asked for yet:
 * the provider leaves the first fetch to whichever consumer mounts.
 */
export type SupplyState =
    | { kind: 'idle' }
    | { kind: 'disconnected' }
    | { kind: 'loading' }
    | { kind: 'failed'; message: string }
    | { kind: 'ready'; supply: Supply };

export type { Supply };

// Both failure paths report the same thing, so the message has one home.
const FAILED_TO_FETCH: SupplyState = { kind: 'failed', message: 'Failed to fetch supply' };

type Dispatch = React.Dispatch<React.SetStateAction<SupplyState>>;
export const StateContext: React.Context<SupplyState | undefined> = React.createContext<SupplyState | undefined>(
    undefined,
);
export const DispatchContext: React.Context<Dispatch | undefined> = React.createContext<Dispatch | undefined>(
    undefined,
);

type Props = { children: React.ReactNode };
export function SupplyProvider({ children }: Props) {
    const [state, setState] = React.useState<SupplyState>({ kind: 'idle' });
    const { status: clusterStatus, cluster, url } = useCluster();

    React.useEffect(() => {
        // Reported even from idle, unlike the transitions below: `fetch` only runs on a connected cluster,
        // so a failed connection would otherwise leave consumers on a loading state forever.
        if (clusterStatus === ClusterStatus.Failure) {
            setState(FAILED_TO_FETCH);
            return;
        }
        if (state.kind === 'idle') return;
        if (clusterStatus === ClusterStatus.Connecting) setState({ kind: 'disconnected' });
        if (clusterStatus === ClusterStatus.Connected) fetch(setState, cluster, url);
    }, [clusterStatus, cluster, url]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={setState}>{children}</DispatchContext.Provider>
        </StateContext.Provider>
    );
}

async function fetch(dispatch: Dispatch, cluster: Cluster, url: string) {
    dispatch({ kind: 'loading' });

    try {
        const rpc = getRpc(url);

        const supplyResponse = await rpc
            .getSupply({ commitment: 'finalized', excludeNonCirculatingAccountsList: true })
            .send();
        const supply: Supply = {
            circulating: supplyResponse.value.circulating,
            nonCirculating: supplyResponse.value.nonCirculating,
            total: supplyResponse.value.total,
        };

        // Land the result only if nothing moved the state on in the meantime.
        dispatch(current => (current.kind === 'loading' ? { kind: 'ready', supply } : current));
    } catch (err) {
        if (cluster !== Cluster.Custom) {
            Logger.error(err, { url });
        }
        dispatch(FAILED_TO_FETCH);
    }
}

export function useSupply() {
    const state = React.useContext(StateContext);
    if (state === undefined) {
        throw new Error(`useSupply must be used within a SupplyProvider`);
    }
    return state;
}

export function useFetchSupply() {
    const dispatch = React.useContext(DispatchContext);
    if (!dispatch) {
        throw new Error(`useFetchSupply must be used within a SupplyProvider`);
    }

    const { cluster, url } = useCluster();
    return React.useCallback(() => {
        fetch(dispatch, cluster, url);
    }, [dispatch, cluster, url]);
}
