'use client';

import type { TransactionWithMeta } from '@entities/transaction-data';
import { ActionType, FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import type { Address } from '@solana/kit';
import { Cluster } from '@utils/cluster';
import { fetchOnce } from '@utils/fetch-once';
import React from 'react';

import { Logger } from '@/app/shared/lib/logger';

import { fetchParsedTransactions } from '../api/fetch-parsed-transactions';
import { hasActiveFilters, type HistoryFilters } from '../lib/history-filters';
import type { AccountHistory } from '../lib/types';
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
            // Snapshot the generation at dispatch time; if it advances before the
            // response lands (a filter change), the result is treated as stale.
            const generation = generations.get(address) ?? 0;
            const isCurrent = () => (generations.get(address) ?? 0) === generation;

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

            const common = {
                address,
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

            const cached = state.entries[address];
            const isLoadMore = !refresh && Boolean(cached?.data?.fetched?.length);
            if (isLoadMore && cached?.data) {
                if (cached.data.foundOldest) return;

                // Cursor for the next page: paginationToken drives getTransactionsForAddress,
                // the trailing signature drives the getSignaturesForAddress fallback.
                const oldest = cached.data.fetched[cached.data.fetched.length - 1].signature;
                fetchOnce(address, inFlight, () =>
                    fetchAccountHistory({
                        ...common,
                        additionalSignatures: fetchTransactions ? getUnfetchedSignatures(cached.data) : [],
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
    additionalSignatures?: string[];
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
    additionalSignatures,
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

    let failedTransactionSignatures;
    let transactionMap;
    if (fetchTransactions && history?.fetched) {
        try {
            const signatures = history.fetched.map(row => row.signature).concat(additionalSignatures ?? []);
            ({ failedTransactionSignatures, transactionMap } = await fetchParsedTransactions({
                cluster,
                signatures,
                url,
            }));
        } catch (error) {
            if (cluster !== Cluster.Custom) {
                Logger.error(error, { url });
            }
            status = FetchStatus.FetchFailed;
        }
    }

    // A newer request (e.g. triggered by a filter change) has taken over for this
    // address; discard this stale result so it can't overwrite the fresh cache.
    if (!isCurrent()) return;

    dispatch({
        data: {
            append,
            failedTransactionSignatures,
            history,
            transactionMap,
        },
        key: address,
        status,
        type: ActionType.Update,
        url,
    });
}

// Signatures on the page whose full transaction has not been fetched (and did not
// previously fail), so a Load More can top up the transaction map in the same request.
function getUnfetchedSignatures(history: AccountHistory | undefined): string[] {
    if (!history) return [];
    const existingMap = history.transactionMap ?? new Map<string, TransactionWithMeta>();
    const failedSigs = history.failedTransactionSignatures ?? new Set<string>();
    return history.fetched.map(row => row.signature).filter(sig => !existingMap.has(sig) && !failedSigs.has(sig));
}
