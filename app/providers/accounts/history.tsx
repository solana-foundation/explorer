'use client';

import * as Cache from '@providers/cache';
import { ActionType, FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import {
    ConfirmedSignatureInfo,
    Connection,
    ParsedTransactionWithMeta,
    PublicKey,
    TransactionSignature,
} from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { fetchAll } from '@utils/fetch-all';
import { fetchOnce } from '@utils/fetch-once';
import { withBackoff } from '@utils/with-backoff';
import React from 'react';

import { mergeTransactionMap } from '@/app/entities/transaction-data';
import { Logger } from '@/app/shared/lib/logger';

type TransactionMap = Map<string, ParsedTransactionWithMeta>;
type FailedTransactionSignatures = Set<string>;

type AccountHistory = {
    fetched: ConfirmedSignatureInfo[];
    transactionMap?: TransactionMap;
    failedTransactionSignatures?: FailedTransactionSignatures;
    foundOldest: boolean;
};

type HistoryUpdate = {
    history?: AccountHistory;
    transactionMap?: TransactionMap;
    failedTransactionSignatures?: FailedTransactionSignatures;
    before?: TransactionSignature;
};

type State = Cache.State<AccountHistory>;
type Dispatch = Cache.Dispatch<HistoryUpdate>;

function combineFetched(
    fetched: ConfirmedSignatureInfo[],
    current: ConfirmedSignatureInfo[] | undefined,
    before: TransactionSignature | undefined,
) {
    if (current === undefined || current.length === 0) {
        return fetched;
    }

    // History was refreshed, fetch results should be prepended if contiguous
    if (before === undefined) {
        const end = fetched.findIndex(f => f.signature === current[0].signature);
        if (end < 0) return fetched;
        return fetched.slice(0, end).concat(current);
    }

    // More history was loaded, fetch results should be appended
    if (current[current.length - 1].signature === before) {
        return current.concat(fetched);
    }

    return fetched;
}

function mergeFailedTransactionSignatures(
    current: FailedTransactionSignatures | undefined,
    update: FailedTransactionSignatures | undefined,
) {
    if (!update) {
        return current ?? new Set<string>();
    }

    return new Set([...(current ?? []), ...update]);
}

function reconcile(history: AccountHistory | undefined, update: HistoryUpdate | undefined) {
    if (update?.history === undefined) {
        // Support transactionMap-only updates from background lazy fetches
        if ((update?.transactionMap || update?.failedTransactionSignatures) && history) {
            const transactionMap = mergeTransactionMap(history.transactionMap, update.transactionMap);
            const failedTransactionSignatures = mergeFailedTransactionSignatures(
                history.failedTransactionSignatures,
                update.failedTransactionSignatures,
            );
            return { ...history, failedTransactionSignatures, transactionMap };
        }
        return history;
    }

    const transactionMap = mergeTransactionMap(history?.transactionMap, update.transactionMap);
    const failedTransactionSignatures = mergeFailedTransactionSignatures(
        update.before === undefined ? undefined : history?.failedTransactionSignatures,
        update.failedTransactionSignatures,
    );

    return {
        failedTransactionSignatures,
        fetched: combineFetched(update.history.fetched, history?.fetched, update?.before),
        foundOldest: update?.history?.foundOldest || history?.foundOldest || false,
        transactionMap,
    };
}

const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);
const InFlightContext = React.createContext<Set<string> | undefined>(undefined);

type HistoryProviderProps = { children: React.ReactNode };
export function HistoryProvider({ children }: HistoryProviderProps) {
    const { url } = useCluster();
    const [state, dispatch] = Cache.useCustomReducer(url, reconcile);
    const inFlightRef = React.useRef(new Set<string>());

    React.useEffect(() => {
        dispatch({ type: ActionType.Clear, url });
        inFlightRef.current.clear();
    }, [dispatch, url]);

    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>
                <InFlightContext.Provider value={inFlightRef.current}>{children}</InFlightContext.Provider>
            </DispatchContext.Provider>
        </StateContext.Provider>
    );
}

async function fetchParsedTransactions(url: string, cluster: Cluster, transactionSignatures: string[]) {
    const connection = new Connection(url);
    const results = await fetchAll(transactionSignatures, async signature => {
        try {
            const transaction = await withBackoff(() =>
                connection.getParsedTransaction(signature, {
                    maxSupportedTransactionVersion: 0,
                }),
            );

            return { signature, transaction };
        } catch (error) {
            if (cluster !== Cluster.Custom) {
                Logger.error(error, { signature, url });
            }
            return { signature, transaction: null };
        }
    });

    const transactionMap = new Map<string, ParsedTransactionWithMeta>();
    const failedTransactionSignatures = new Set<string>();

    results.forEach(({ signature, transaction }) => {
        if (transaction !== null) {
            transactionMap.set(signature, transaction);
        } else {
            failedTransactionSignatures.add(signature);
        }
    });

    return { failedTransactionSignatures, transactionMap };
}

async function fetchAccountHistory(
    dispatch: Dispatch,
    pubkey: PublicKey,
    cluster: Cluster,
    url: string,
    options: {
        before?: TransactionSignature;
        limit: number;
    },
    fetchTransactions?: boolean,
    additionalSignatures?: string[],
) {
    dispatch({
        key: pubkey.toBase58(),
        status: FetchStatus.Fetching,
        type: ActionType.Update,
        url,
    });

    let status;
    let history;
    try {
        const connection = new Connection(url);
        const fetched = await connection.getSignaturesForAddress(pubkey, options);
        history = {
            fetched,
            foundOldest: fetched.length < options.limit,
        };
        status = FetchStatus.Fetched;
    } catch (error) {
        if (cluster !== Cluster.Custom) {
            Logger.error(error, { url });
        }
        status = FetchStatus.FetchFailed;
    }

    let failedTransactionSignatures;
    let transactionMap;
    if (fetchTransactions && history?.fetched) {
        try {
            const signatures = history.fetched.map(signature => signature.signature).concat(additionalSignatures || []);
            ({ failedTransactionSignatures, transactionMap } = await fetchParsedTransactions(url, cluster, signatures));
        } catch (error) {
            if (cluster !== Cluster.Custom) {
                Logger.error(error, { url });
            }
            status = FetchStatus.FetchFailed;
        }
    }

    dispatch({
        data: {
            before: options?.before,
            failedTransactionSignatures,
            history,
            transactionMap,
        },
        key: pubkey.toBase58(),
        status,
        type: ActionType.Update,
        url,
    });
}

export function useAccountHistories() {
    const context = React.useContext(StateContext);

    if (!context) {
        throw new Error(`useAccountHistories must be used within a AccountsProvider`);
    }

    return context.entries;
}

export function useAccountHistory(address: string): Cache.CacheEntry<AccountHistory> | undefined {
    const context = React.useContext(StateContext);

    if (!context) {
        throw new Error(`useAccountHistory must be used within a AccountsProvider`);
    }

    return context.entries[address];
}

function getUnfetchedSignaturesFromHistory(history: AccountHistory): string[] {
    const existingMap = history.transactionMap ?? new Map<string, ParsedTransactionWithMeta>();
    const failedSigs = history.failedTransactionSignatures ?? new Set<string>();
    return history.fetched.map(info => info.signature).filter(sig => !existingMap.has(sig) && !failedSigs.has(sig));
}

function getUnfetchedSignatures(before: Cache.CacheEntry<AccountHistory>) {
    if (!before.data) {
        return [];
    }
    return getUnfetchedSignaturesFromHistory(before.data);
}

export function useFetchTransactionsForHistory() {
    const { cluster, url } = useCluster();
    const state = React.useContext(StateContext);
    const dispatch = React.useContext(DispatchContext);
    const inFlight = React.useContext(InFlightContext);
    if (!state || !dispatch || !inFlight) {
        throw new Error(`useFetchTransactionsForHistory must be used within a HistoryProvider`);
    }

    return React.useCallback(
        (pubkey: PublicKey, history: AccountHistory) => {
            const unfetched = getUnfetchedSignaturesFromHistory(history);
            if (unfetched.length === 0) return;

            const key = `${pubkey.toBase58()}:transactions`;
            fetchOnce(key, inFlight, async () => {
                try {
                    const { failedTransactionSignatures, transactionMap } = await fetchParsedTransactions(
                        url,
                        cluster,
                        unfetched,
                    );
                    dispatch({
                        data: { failedTransactionSignatures, transactionMap },
                        key: pubkey.toBase58(),
                        status: FetchStatus.Fetched,
                        type: ActionType.Update,
                        url,
                    });
                } catch (error) {
                    if (cluster !== Cluster.Custom) {
                        Logger.error(error, { url });
                    }
                }
            }).catch(e => Logger.error(e));
        },
        [cluster, url, dispatch, inFlight],
    );
}

export function useFetchAccountHistory(limit = 25) {
    const { cluster, url } = useCluster();
    const state = React.useContext(StateContext);
    const dispatch = React.useContext(DispatchContext);
    const inFlight = React.useContext(InFlightContext);
    if (!state || !dispatch || !inFlight) {
        throw new Error(`useFetchAccountHistory must be used within a HistoryProvider`);
    }

    return React.useCallback(
        (pubkey: PublicKey, fetchTransactions?: boolean, refresh?: boolean) => {
            const before = state.entries[pubkey.toBase58()];
            if (!refresh && before?.data?.fetched && before.data.fetched.length > 0) {
                if (before.data.foundOldest) return;

                let additionalSignatures: string[] = [];
                if (fetchTransactions) {
                    additionalSignatures = getUnfetchedSignatures(before);
                }

                const oldest = before.data.fetched[before.data.fetched.length - 1].signature;
                fetchOnce(pubkey.toBase58(), inFlight, () =>
                    fetchAccountHistory(
                        dispatch,
                        pubkey,
                        cluster,
                        url,
                        { before: oldest, limit },
                        fetchTransactions,
                        additionalSignatures,
                    ),
                ).catch(e => Logger.error(e));
            } else {
                fetchOnce(pubkey.toBase58(), inFlight, () =>
                    fetchAccountHistory(dispatch, pubkey, cluster, url, { limit }, fetchTransactions),
                ).catch(e => Logger.error(e));
            }
        },
        [limit, state, dispatch, cluster, url, inFlight],
    );
}
