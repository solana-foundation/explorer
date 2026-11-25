'use client';

import { ActionType, FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { getOwn } from '@shared/lib/object';
import type { Address } from '@solana/kit';
import { Cluster } from '@utils/cluster';
import { fetchOnce } from '@utils/fetch-once';
import React from 'react';

import { Logger } from '@/app/shared/lib/logger';

import { fetchParsedTransactions } from '../api/fetch-parsed-transactions';
import { hasActiveFilters, type HistoryFilters } from '../lib/history-filters';
import { combineFetched } from '../lib/reconcile';
import type { AccountHistory, HistoryRow } from '../lib/types';
import { isQueueKeyEnabled, useEnabledQueueKey } from './enabled-queue-keys';
import { fetchHistoryPage } from './fetch-history-page';
import {
    type Dispatch,
    DispatchContext,
    GenerationContext,
    InFlightContext,
    MethodSupportContext,
    SignaturesOnlyContext,
    StateContext,
} from './history-provider';

export function useFetchAccountHistory(limit = 25, filters: HistoryFilters = {}) {
    const { cluster, url } = useCluster();
    const state = React.useContext(StateContext);
    const dispatch = React.useContext(DispatchContext);
    const inFlight = React.useContext(InFlightContext);
    const generations = React.useContext(GenerationContext);
    const signaturesOnly = React.useContext(SignaturesOnlyContext);
    const methodSupport = React.useContext(MethodSupportContext);
    if (!state || !dispatch || !inFlight || !generations || !signaturesOnly || !methodSupport) {
        throw new Error(`useFetchAccountHistory must be used within a HistoryProvider`);
    }
    const { markUnsupported } = methodSupport;

    // Destructure into primitives so the callback identity tracks filter changes.
    const { slot, blockTime, status } = filters;
    const slotGte = slot?.gte;
    const slotLte = slot?.lte;
    const blockTimeGte = blockTime?.gte;
    const blockTimeLte = blockTime?.lte;

    return React.useCallback(
        (address: Address, fetchTransactions?: boolean, refresh?: boolean) => {
            const activeFilters: HistoryFilters = {
                blockTime: { gte: blockTimeGte, lte: blockTimeLte },
                slot: { gte: slotGte, lte: slotLte },
                status,
            };
            const isCurrent = snapshotGeneration(generations, address);

            // Latch entries are keyed by endpoint as well as address. Index coverage is a
            // property of the endpoint, and a request still in flight when the cluster changes
            // resolves against the new one: the provider has already cleared the set, and the
            // generation guard can't help because it resets to 0 at the same moment. Scoping
            // the key makes such a late write inert instead of skipping a working gTFA path on
            // the new endpoint.
            const latchKey = `${url}:${address}`;

            // The latch only governs the unfiltered path. getSignaturesForAddress can't honour
            // filters, so once a filter is active getTransactionsForAddress is the only method
            // that can answer it — reverting to the signatures path would render unfiltered
            // rows while the UI still shows the filter as applied. (The statically disabled
            // addresses are handled inside fetchHistoryPage, which is not filter-dependent.)
            const forceSignatures = signaturesOnly.has(latchKey) && !hasActiveFilters(activeFilters);

            const cached = getOwn(state.entries, address);

            const common = {
                address,
                cachedHistory: cached?.data,
                cluster,
                dispatch,
                fetchTransactions,
                filters: activeFilters,
                forceSignatures,
                isCurrent,
                limit,
                onMethodNotFound: markUnsupported,
                // Recorded even when isCurrent() later rejects the page. A filter change
                // supersedes the request but not what it proved: the endpoint really does
                // return an empty gTFA page for this address, so the next unfiltered request
                // should still skip it. Cross-endpoint leakage is handled by latchKey above.
                onSignaturesOnly: () => signaturesOnly.add(latchKey),
                url,
            };

            const isLoadMore = !refresh && Boolean(cached?.data?.fetched?.length);
            if (isLoadMore && cached?.data) {
                if (cached.data.foundOldest) return;

                // Cursor for the next page: paginationToken drives getTransactionsForAddress,
                // the trailing signature drives the getSignaturesForAddress fallback.
                const oldest = cached.data.fetched[cached.data.fetched.length - 1].signature;
                fetchOnce(address, inFlight, () =>
                    fetchAccountHistory({
                        ...common,
                        append: true,
                        before: oldest,
                        paginationToken: cached.data?.paginationToken,
                    }),
                ).catch(e => Logger.error(e));
            } else {
                fetchOnce(address, inFlight, () => fetchAccountHistory({ ...common, append: false })).catch(e =>
                    Logger.error(e),
                );
            }
        },
        [
            limit,
            slotGte,
            slotLte,
            blockTimeGte,
            blockTimeLte,
            status,
            state,
            dispatch,
            cluster,
            url,
            inFlight,
            generations,
            signaturesOnly,
            markUnsupported,
        ],
    );
}

// A retry fetches no page, so a newer page cannot replace the rows whose transactions it fetches.
export function useRetryFailedTransactions(): (address: Address) => void {
    const { cluster, url } = useCluster();
    const state = React.useContext(StateContext);
    const dispatch = React.useContext(DispatchContext);
    const inFlight = React.useContext(InFlightContext);
    const generations = React.useContext(GenerationContext);
    if (!state || !dispatch || !inFlight || !generations) {
        throw new Error(`useRetryFailedTransactions must be used within a HistoryProvider`);
    }

    return React.useCallback(
        (address: Address) => {
            const cached = getOwn(state.entries, address);
            const cachedHistory = cached?.data;
            if (!cached || !cachedHistory) return;
            const isCurrent = snapshotGeneration(generations, address);
            fetchOnce(address, inFlight, () =>
                retryFailedTransactions({
                    address,
                    cachedHistory,
                    cluster,
                    dispatch,
                    isCurrent,
                    status: cached.status,
                    url,
                }),
            ).catch(e => Logger.error(e));
        },
        [cluster, dispatch, generations, inFlight, state, url],
    );
}

// A card that fetches transactions calls this, or the queue skips every transaction fetch.
export function useEnableTransactionFetches(address: Address): void {
    const { url } = useCluster();
    useEnabledQueueKey(transactionFetchesKey(url, address));
}

function transactionFetchesKey(url: string, address: Address): string {
    return `history-transactions:${url}:${address}`;
}

// The returned function returns false after the generation advances (a filter change or a reset), so the caller
// drops the result of a superseded request.
function snapshotGeneration(generations: Map<string, number>, address: Address): () => boolean {
    const generation = generations.get(address) ?? 0;
    return () => (generations.get(address) ?? 0) === generation;
}

type FetchAccountHistoryOptions = {
    dispatch: Dispatch;
    address: Address;
    cluster: Cluster;
    url: string;
    limit: number;
    paginationToken?: string;
    before?: string;
    filters: HistoryFilters;
    append: boolean;
    forceSignatures?: boolean;
    fetchTransactions?: boolean;
    // The history already in the cache. Some of its rows that have no transaction are fetched with the page.
    cachedHistory?: AccountHistory;
    // Returns false once this request has been superseded (e.g. by a filter change),
    // in which case its result is dropped rather than written into the cache.
    isCurrent?: () => boolean;
    onMethodNotFound?: () => void;
    // Called when this page proved the endpoint's getTransactionsForAddress index does not
    // cover the address, so the caller can latch it onto the signatures path.
    onSignaturesOnly?: () => void;
};

// Fetches one page and writes it into the cache. Owns status transitions and error
// reporting; `fetchHistoryPage` owns which RPC method answers the page.
async function fetchAccountHistory({
    dispatch,
    address,
    cluster,
    url,
    limit,
    paginationToken,
    before,
    filters,
    append,
    forceSignatures = false,
    fetchTransactions,
    cachedHistory,
    isCurrent = () => true,
    onMethodNotFound,
    onSignaturesOnly,
}: FetchAccountHistoryOptions) {
    dispatch({
        key: address,
        status: FetchStatus.Fetching,
        type: ActionType.Update,
        url,
    });

    let status;
    let history;

    try {
        const page = await fetchHistoryPage({
            address,
            before,
            filters,
            forceSignatures,
            limit,
            onMethodNotFound,
            paginationToken,
            url,
        });
        history = page.history;
        if (page.signaturesOnly) onSignaturesOnly?.();
        status = FetchStatus.Fetched;
    } catch (error) {
        if (cluster !== Cluster.Custom) {
            Logger.error(error, { url });
        }
        status = FetchStatus.FetchFailed;
    }

    // A newer request (e.g. triggered by a filter change) has taken over for this
    // address; discard this stale result so it can't overwrite the fresh cache.
    if (!isCurrent()) return;

    if (!fetchTransactions || !history) {
        dispatch({ data: { append, history }, key: address, status, type: ActionType.Update, url });
        return;
    }

    // The page is written before its transactions load, so the rows of each transaction show when it lands.
    dispatch({ data: { append, history }, key: address, status: FetchStatus.Fetching, type: ActionType.Update, url });

    await fetchTransactionsIntoCache({
        address,
        cluster,
        dispatch,
        isCurrent,
        signatures: getSignaturesToFetch({ append, cachedHistory, page: history.fetched }),
        url,
    });

    if (!isCurrent()) return;

    dispatch({ key: address, status, type: ActionType.Update, url });
}

async function retryFailedTransactions({
    address,
    cachedHistory,
    cluster,
    dispatch,
    isCurrent,
    status,
    url,
}: {
    address: Address;
    cachedHistory: AccountHistory;
    cluster: Cluster;
    dispatch: Dispatch;
    isCurrent: () => boolean;
    status: FetchStatus;
    url: string;
}): Promise<void> {
    dispatch({ key: address, status: FetchStatus.Fetching, type: ActionType.Update, url });

    await fetchTransactionsIntoCache({
        address,
        cluster,
        dispatch,
        isCurrent,
        signatures: getFailedSignatures(cachedHistory),
        url,
    });

    if (!isCurrent()) return;

    // The status describes the last page, which the retry did not fetch.
    dispatch({ key: address, status, type: ActionType.Update, url });
}

function fetchTransactionsIntoCache({
    address,
    cluster,
    dispatch,
    isCurrent,
    signatures,
    url,
}: {
    address: Address;
    cluster: Cluster;
    dispatch: Dispatch;
    isCurrent: () => boolean;
    signatures: string[];
    url: string;
}): Promise<void> {
    return fetchParsedTransactions({
        cluster,
        onSettled: (signature, result) => {
            if (!isCurrent()) return;
            dispatch({
                data: { result, signature },
                key: address,
                status: FetchStatus.Fetching,
                type: ActionType.Update,
                url,
            });
        },
        shouldRun: () => isCurrent() && isQueueKeyEnabled(transactionFetchesKey(url, address)),
        signatures,
        url,
    });
}

// The page rows, and the rows of the merged list that no fetch has tried. A refresh whose page does not overlap the
// cached rows drops them from the list, so it does not fetch them.
function getSignaturesToFetch({
    page,
    cachedHistory,
    append,
}: {
    page: HistoryRow[];
    cachedHistory: AccountHistory | undefined;
    append: boolean;
}): string[] {
    const { combined } = combineFetched(page, cachedHistory?.fetched, append);
    const rowsWithoutReason = combined.filter(({ signature }) => !cachedHistory?.missingTransactions?.has(signature));
    const signatures = new Set([...page, ...rowsWithoutReason].map(row => row.signature));
    // A transaction never changes, so a row that has one is not fetched again.
    return [...signatures].filter(signature => !cachedHistory?.transactionMap?.has(signature));
}

function getFailedSignatures(history: AccountHistory): string[] {
    return history.fetched
        .map(({ signature }) => signature)
        .filter(signature => history.missingTransactions?.has(signature));
}
