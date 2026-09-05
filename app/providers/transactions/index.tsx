'use client';

import { getRpc } from '@entities/cluster';
import * as Cache from '@providers/cache';
import { ActionType, FetchStatus } from '@providers/cache';
import { useCacheEntry } from '@providers/cache-entry';
import { useCluster } from '@providers/cluster';
import { signature as createSignature } from '@solana/kit';
import type { SignatureResult, TransactionConfirmationStatus, TransactionSignature } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import React from 'react';

import { withNumbersInsteadOfBigInts } from '@/app/shared/lib/bigint-to-number';
import { Logger } from '@/app/shared/lib/logger';

import { DetailsProvider } from './parsed';
import { RawDetailsProvider } from './raw';

export { useTransactionDetails } from './parsed';

export type Confirmations = number | 'max';

export type Timestamp = number | 'unavailable';

export interface TransactionStatusInfo {
    slot: number;
    result: SignatureResult;
    timestamp: Timestamp;
    confirmations: Confirmations;
    confirmationStatus?: TransactionConfirmationStatus;
}

export interface TransactionStatus {
    signature: TransactionSignature;
    info: TransactionStatusInfo | null;
}

type State = Cache.State<TransactionStatus>;
type Dispatch = Cache.Dispatch<TransactionStatus>;

export const StateContext: React.Context<State | undefined> = React.createContext<State | undefined>(undefined);
export const DispatchContext: React.Context<Dispatch | undefined> = React.createContext<Dispatch | undefined>(
    undefined,
);

type TransactionsProviderProps = { children: React.ReactNode };
export function TransactionsProvider({ children }: TransactionsProviderProps) {
    const { url } = useCluster();
    const [state, dispatch] = Cache.useReducer<TransactionStatus>(url);

    // Clear accounts cache whenever cluster is changed
    React.useEffect(() => {
        dispatch({ type: ActionType.Clear, url });
    }, [dispatch, url]);

    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>
                <RawDetailsProvider>
                    <DetailsProvider>{children}</DetailsProvider>
                </RawDetailsProvider>
            </DispatchContext.Provider>
        </StateContext.Provider>
    );
}

export async function fetchTransactionStatus(
    dispatch: Dispatch,
    signature: TransactionSignature,
    cluster: Cluster,
    url: string,
) {
    dispatch({
        key: signature,
        status: FetchStatus.Fetching,
        type: ActionType.Update,
        url,
    });

    let fetchStatus;
    let data;
    try {
        const rpc = getRpc(url);
        const { value: statuses } = await rpc
            .getSignatureStatuses([createSignature(signature)], {
                searchTransactionHistory: true,
            })
            .send();
        if (statuses.length !== 1) {
            throw new Error(`expected 1 signature status, received ${statuses.length}`);
        }
        const value = statuses[0] ?? null;

        let info = null;
        if (value !== null) {
            const confirmations: Confirmations =
                typeof value.confirmations === 'bigint' ? Number(value.confirmations) : 'max';
            let blockTime: bigint | null = null;
            try {
                blockTime = await rpc.getBlockTime(value.slot).send();
            } catch (error) {
                if (cluster === Cluster.MainnetBeta && confirmations === 'max') {
                    Logger.error(error, { slot: `${value.slot}` });
                }
            }
            const timestamp: Timestamp = blockTime !== null ? Number(blockTime) : 'unavailable';

            info = {
                confirmationStatus: value.confirmationStatus ?? undefined,
                confirmations,
                result: { err: withNumbersInsteadOfBigInts(value.err) },
                slot: Number(value.slot),
                timestamp,
            };
        }
        data = { info, signature };
        fetchStatus = FetchStatus.Fetched;
    } catch (error) {
        if (cluster !== Cluster.Custom) {
            Logger.error(error, { url });
        }
        fetchStatus = FetchStatus.FetchFailed;
    }

    dispatch({
        data,
        key: signature,
        status: fetchStatus,
        type: ActionType.Update,
        url,
    });
}

export function useTransactionStatus(
    signature: TransactionSignature | undefined,
): Cache.CacheEntry<TransactionStatus> | undefined {
    const context = React.useContext(StateContext);

    if (!context) {
        throw new Error(`useTransactionStatus must be used within a TransactionsProvider`);
    }

    return useCacheEntry(context.entries, signature);
}

export function useFetchTransactionStatus() {
    const dispatch = React.useContext(DispatchContext);
    if (!dispatch) {
        throw new Error(`useFetchTransactionStatus must be used within a TransactionsProvider`);
    }

    const { cluster, url } = useCluster();
    return React.useCallback(
        (signature: TransactionSignature) => {
            fetchTransactionStatus(dispatch, signature, cluster, url);
        },
        [dispatch, cluster, url],
    );
}
