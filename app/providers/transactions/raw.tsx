'use client';

import { fetchRawTransaction, type RawTransaction } from '@entities/transaction-data';
import * as Cache from '@providers/cache';
import { ActionType, FetchStatus } from '@providers/cache';
import { useCacheEntry } from '@providers/cache-entry';
import { useCluster } from '@providers/cluster';
import { type Finality, type TransactionSignature } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import React from 'react';

import { Logger } from '@/app/shared/lib/logger';

export interface Details {
    raw?: RawTransaction | null;
}

type State = Cache.State<Details>;
type Dispatch = Cache.Dispatch<Details>;

export const StateContext = React.createContext<State | undefined>(undefined);
export const DispatchContext = React.createContext<Dispatch | undefined>(undefined);

type DetailsProviderProps = { children: React.ReactNode };
export function RawDetailsProvider({ children }: DetailsProviderProps) {
    const { url } = useCluster();
    const [state, dispatch] = Cache.useReducer<Details>(url);

    React.useEffect(() => {
        dispatch({ type: ActionType.Clear, url });
    }, [dispatch, url]);

    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
        </StateContext.Provider>
    );
}

export function useRawTransactionDetails(signature: TransactionSignature): Cache.CacheEntry<Details> | undefined {
    const context = React.useContext(StateContext);

    if (!context) {
        throw new Error(`useRawTransactionDetails must be used within a TransactionsProvider`);
    }

    return useCacheEntry(context.entries, signature);
}

async function loadRawTransaction(
    dispatch: Dispatch,
    signature: TransactionSignature,
    cluster: Cluster,
    url: string,
    commitment?: Finality,
) {
    dispatch({
        key: signature,
        status: FetchStatus.Fetching,
        type: ActionType.Update,
        url,
    });

    let fetchStatus;
    try {
        const raw = await fetchRawTransaction(url, signature, commitment);
        fetchStatus = FetchStatus.Fetched;

        dispatch({
            data: { raw },
            key: signature,
            status: fetchStatus,
            type: ActionType.Update,
            url,
        });
    } catch (error) {
        if (cluster !== Cluster.Custom) {
            Logger.error(error, { url });
        }
        dispatch({
            key: signature,
            status: FetchStatus.FetchFailed,
            type: ActionType.Update,
            url,
        });
    }
}

export function useFetchRawTransaction() {
    const dispatch = React.useContext(DispatchContext);
    if (!dispatch) {
        throw new Error(`useFetchRawTransaction must be used within a TransactionsProvider`);
    }

    const { cluster, url } = useCluster();
    return React.useCallback(
        (signature: TransactionSignature, commitment?: Finality) => {
            url && loadRawTransaction(dispatch, signature, cluster, url, commitment);
        },
        [dispatch, cluster, url],
    );
}
