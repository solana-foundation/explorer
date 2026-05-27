'use client';

import * as Cache from '@providers/cache';
import { ActionType, FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';
import { ConfirmedSignatureInfo, Connection, ParsedTransactionWithMeta, PublicKey } from '@solana/web3.js';
import { Cluster } from '@utils/cluster';
import { fetchAll } from '@utils/fetch-all';
import { fetchOnce } from '@utils/fetch-once';
import { withBackoff } from '@utils/with-backoff';
import React from 'react';

import { mergeTransactionMap } from '@/app/entities/transaction-data';
import { Logger } from '@/app/shared/lib/logger';

type TransactionMap = Map<string, ParsedTransactionWithMeta>;
type FailedTransactionSignatures = Set<string>;

// Mirrors the Triton `getTransactionsForAddress` `filters` object one-to-one, so the
// UI/URL layer and the RPC payload share the same shape and field names. The UI only
// surfaces range bounds (gte/lte); the RPC also accepts gt/lt/eq which we don't use yet.
export type RangeFilter = { gte?: number; lte?: number };
export type HistoryFilters = {
    slot?: RangeFilter; // filters.slot
    blockTime?: RangeFilter; // filters.blockTime (unix seconds)
    status?: 'succeeded' | 'failed'; // filters.status (omit for "any")
};

type AccountHistory = {
    fetched: ConfirmedSignatureInfo[];
    transactionMap?: TransactionMap;
    failedTransactionSignatures?: FailedTransactionSignatures;
    foundOldest: boolean;
    // Opaque cursor returned by the RPC; threaded back to load the next page.
    paginationToken?: string | null;
};

type HistoryUpdate = {
    history?: AccountHistory;
    transactionMap?: TransactionMap;
    failedTransactionSignatures?: FailedTransactionSignatures;
    // true when this page extends the tail (Load More); false on a refresh.
    append?: boolean;
};

type State = Cache.State<AccountHistory>;
type Dispatch = Cache.Dispatch<HistoryUpdate>;

function combineFetched(
    fetched: ConfirmedSignatureInfo[],
    current: ConfirmedSignatureInfo[] | undefined,
    append: boolean,
): { combined: ConfirmedSignatureInfo[]; replaced: boolean } {
    if (current === undefined || current.length === 0) {
        return { combined: fetched, replaced: true };
    }

    // More history was loaded: append, dropping any signatures we already hold.
    if (append) {
        const seen = new Set(current.map(c => c.signature));
        return { combined: current.concat(fetched.filter(f => !seen.has(f.signature))), replaced: false };
    }

    // History was refreshed: prepend the newly-seen prefix if the page overlaps
    // what we already have, otherwise treat it as a full replacement.
    const end = fetched.findIndex(f => f.signature === current[0].signature);
    if (end < 0) return { combined: fetched, replaced: true };
    return { combined: fetched.slice(0, end).concat(current), replaced: false };
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

    const append = update.append ?? false;
    const { combined, replaced } = combineFetched(update.history.fetched, history?.fetched, append);

    // The tail cursor only changes when we extended the tail (append) or replaced
    // the whole list; a refresh that merely prepends new items keeps the old tail.
    const tailFromUpdate = append || replaced;

    const transactionMap = mergeTransactionMap(history?.transactionMap, update.transactionMap);
    const failedTransactionSignatures = mergeFailedTransactionSignatures(
        append ? history?.failedTransactionSignatures : undefined,
        update.failedTransactionSignatures,
    );

    return {
        failedTransactionSignatures,
        fetched: combined,
        foundOldest: tailFromUpdate ? update.history.foundOldest : (history?.foundOldest ?? false),
        paginationToken: tailFromUpdate ? update.history.paginationToken : history?.paginationToken,
        transactionMap,
    };
}

const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<Dispatch | undefined>(undefined);
const InFlightContext = React.createContext<Set<string> | undefined>(undefined);
// Monotonic per-address counter. Bumped whenever a request is superseded (e.g. a
// filter change) so the in-flight response can be discarded instead of overwriting
// the freshly-cleared cache. See `useResetAccountHistory`.
const GenerationContext = React.createContext<Map<string, number> | undefined>(undefined);

// Whether the current endpoint supports getTransactionsForAddress. Flips to false the
// first time the method is not found, so the UI can disable filtering (the
// getSignaturesForAddress fallback can't honour block-time/status filters).
type MethodSupport = { supported: boolean; markUnsupported: () => void };
const MethodSupportContext = React.createContext<MethodSupport | undefined>(undefined);

type HistoryProviderProps = { children: React.ReactNode };
export function HistoryProvider({ children }: HistoryProviderProps) {
    const { url } = useCluster();
    const [state, dispatch] = Cache.useCustomReducer(url, reconcile);
    const inFlightRef = React.useRef(new Set<string>());
    const generationRef = React.useRef(new Map<string, number>());
    const [supported, setSupported] = React.useState(true);

    React.useEffect(() => {
        dispatch({ type: ActionType.Clear, url });
        inFlightRef.current.clear();
        generationRef.current.clear();
        setSupported(true);
    }, [dispatch, url]);

    const markUnsupported = React.useCallback(() => setSupported(false), []);
    const methodSupport = React.useMemo(() => ({ markUnsupported, supported }), [markUnsupported, supported]);

    return (
        <StateContext.Provider value={state}>
            <DispatchContext.Provider value={dispatch}>
                <InFlightContext.Provider value={inFlightRef.current}>
                    <GenerationContext.Provider value={generationRef.current}>
                        <MethodSupportContext.Provider value={methodSupport}>{children}</MethodSupportContext.Provider>
                    </GenerationContext.Provider>
                </InFlightContext.Provider>
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

// Prunes undefined leaves so the RPC never receives an empty range like `{ slot: {} }`.
function pruneRange(range: RangeFilter | undefined): RangeFilter | undefined {
    if (!range) return undefined;
    const out: RangeFilter = {};
    if (range.gte !== undefined) out.gte = range.gte;
    if (range.lte !== undefined) out.lte = range.lte;
    return Object.keys(out).length > 0 ? out : undefined;
}

// `HistoryFilters` already mirrors the RPC `filters` shape, so this just drops empty
// entries. Returns undefined when no filter is active so the key is omitted entirely.
function buildRpcFilters(filters: HistoryFilters): Record<string, unknown> | undefined {
    const out: Record<string, unknown> = {};
    const slot = pruneRange(filters.slot);
    if (slot) out.slot = slot;
    const blockTime = pruneRange(filters.blockTime);
    if (blockTime) out.blockTime = blockTime;
    if (filters.status) out.status = filters.status;
    return Object.keys(out).length > 0 ? out : undefined;
}

type RpcHistoryItem = ConfirmedSignatureInfo & { transactionIndex?: number };
type GetTransactionsForAddressResult = {
    data: RpcHistoryItem[];
    paginationToken: string | null;
};

// Calls the Triton `getTransactionsForAddress` method directly (it is not part of
// web3.js). `signatures` detail level keeps the response shape compatible with the
// existing `ConfirmedSignatureInfo`-based table.
async function getTransactionsForAddress(
    url: string,
    address: string,
    options: { limit: number; paginationToken?: string | null; filters: HistoryFilters },
): Promise<GetTransactionsForAddressResult> {
    const params: Record<string, unknown> = {
        limit: options.limit,
        paginationToken: options.paginationToken ?? null,
        sortOrder: 'desc',
        transactionDetails: 'signatures',
    };
    const filters = buildRpcFilters(options.filters);
    if (filters) params.filters = filters;

    const response = await fetch(url, {
        body: JSON.stringify({
            id: 1,
            jsonrpc: '2.0',
            method: 'getTransactionsForAddress',
            params: [address, params],
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
    });
    const json = await response.json();
    if (json.error) {
        const error = new Error(json.error.message ?? 'getTransactionsForAddress failed') as Error & {
            code?: number;
        };
        error.code = json.error.code;
        throw error;
    }
    return json.result as GetTransactionsForAddressResult;
}

// getTransactionsForAddress is a Triton extension; standard RPC nodes answer with a
// JSON-RPC "method not found" (-32601). We use that to fall back to getSignaturesForAddress.
function isMethodNotFound(error: unknown): boolean {
    const e = error as { code?: number; message?: string };
    if (e?.code === -32601) return true;
    const message = typeof e?.message === 'string' ? e.message.toLowerCase() : '';
    return message.includes('method not found') || message.includes('unsupported method');
}

// Legacy fallback path for endpoints without getTransactionsForAddress. Uses
// getSignaturesForAddress, whose pagination cursor is the trailing `before` signature
// rather than a paginationToken. Slot bounds are passed through as the Hydrant
// `untilSlot`/`beforeSlot` extension (a no-op on nodes that don't support it); block
// time and status filters are not applied on this path.
async function fetchViaSignatures(
    url: string,
    pubkey: PublicKey,
    options: { limit: number; before?: string; filters: HistoryFilters },
): Promise<AccountHistory> {
    const connection = new Connection(url);
    const rpcOptions: Record<string, unknown> = { limit: options.limit };
    if (options.before) rpcOptions.before = options.before;
    if (options.filters.slot?.gte !== undefined) rpcOptions.untilSlot = options.filters.slot.gte;
    if (options.filters.slot?.lte !== undefined) rpcOptions.beforeSlot = options.filters.slot.lte;
    const fetched = await connection.getSignaturesForAddress(
        pubkey,
        rpcOptions as Parameters<Connection['getSignaturesForAddress']>[1],
    );
    return {
        fetched,
        foundOldest: fetched.length < options.limit,
        paginationToken: null,
    };
}

async function fetchAccountHistory(
    dispatch: Dispatch,
    pubkey: PublicKey,
    cluster: Cluster,
    url: string,
    options: {
        limit: number;
        paginationToken?: string | null;
        // Trailing-signature cursor used only by the getSignaturesForAddress fallback.
        before?: string;
        filters: HistoryFilters;
        append: boolean;
    },
    fetchTransactions?: boolean,
    additionalSignatures?: string[],
    // Returns false once this request has been superseded (e.g. by a filter change),
    // in which case its result is dropped rather than written into the cache.
    isCurrent: () => boolean = () => true,
    // Called when the endpoint reports getTransactionsForAddress as unavailable, so the
    // UI can disable filtering before the request falls back to getSignaturesForAddress.
    onMethodNotFound?: () => void,
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
        const result = await getTransactionsForAddress(url, pubkey.toBase58(), {
            filters: options.filters,
            limit: options.limit,
            paginationToken: options.paginationToken,
        });
        history = {
            fetched: result.data,
            // A null/absent paginationToken is the canonical end-of-stream signal; a
            // short page is not, since the server may still hand back a token for more.
            foundOldest: !result.paginationToken,
            paginationToken: result.paginationToken,
        };
        status = FetchStatus.Fetched;
    } catch (error) {
        if (isMethodNotFound(error)) {
            // Endpoint doesn't implement getTransactionsForAddress: disable filtering
            // and fall back to the standard getSignaturesForAddress path.
            onMethodNotFound?.();
            try {
                history = await fetchViaSignatures(url, pubkey, {
                    before: options.before,
                    filters: options.filters,
                    limit: options.limit,
                });
                status = FetchStatus.Fetched;
            } catch (fallbackError) {
                if (cluster !== Cluster.Custom) {
                    Logger.error(fallbackError, { url });
                }
                status = FetchStatus.FetchFailed;
            }
        } else {
            if (cluster !== Cluster.Custom) {
                Logger.error(error, { url });
            }
            status = FetchStatus.FetchFailed;
        }
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

    // A newer request (e.g. triggered by a filter change) has taken over for this
    // address; discard this stale result so it can't overwrite the fresh cache.
    if (!isCurrent()) return;

    dispatch({
        data: {
            append: options.append,
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

export function useClearAccountHistories() {
    const { url } = useCluster();
    const dispatch = React.useContext(DispatchContext);
    if (!dispatch) {
        throw new Error(`useClearAccountHistories must be used within a HistoryProvider`);
    }
    return React.useCallback(() => {
        dispatch({ type: ActionType.Clear, url });
    }, [dispatch, url]);
}

// Resets a single address's history so the next fetch starts from a clean slate.
// Bumps the address generation (so any in-flight request for it is discarded) and
// evicts its in-flight marker (so the immediately-following refetch isn't deduped),
// then clears only that address's cache entry.
export function useResetAccountHistory() {
    const { url } = useCluster();
    const dispatch = React.useContext(DispatchContext);
    const inFlight = React.useContext(InFlightContext);
    const generations = React.useContext(GenerationContext);
    if (!dispatch || !inFlight || !generations) {
        throw new Error(`useResetAccountHistory must be used within a HistoryProvider`);
    }
    return React.useCallback(
        (address: string) => {
            generations.set(address, (generations.get(address) ?? 0) + 1);
            inFlight.delete(address);
            dispatch({ key: address, type: ActionType.Clear, url });
        },
        [dispatch, inFlight, generations, url],
    );
}

export function useAccountHistories() {
    const context = React.useContext(StateContext);

    if (!context) {
        throw new Error(`useAccountHistories must be used within a AccountsProvider`);
    }

    return context.entries;
}

// Whether the current endpoint supports getTransactionsForAddress, and therefore
// filtering. Defaults to true outside a HistoryProvider (e.g. isolated component tests).
export function useHistoryFiltersSupported(): boolean {
    return React.useContext(MethodSupportContext)?.supported ?? true;
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

export function useFetchAccountHistory(limit = 25, filters: HistoryFilters = {}) {
    const { cluster, url } = useCluster();
    const state = React.useContext(StateContext);
    const dispatch = React.useContext(DispatchContext);
    const inFlight = React.useContext(InFlightContext);
    const generations = React.useContext(GenerationContext);
    const methodSupport = React.useContext(MethodSupportContext);
    if (!state || !dispatch || !inFlight || !generations || !methodSupport) {
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
        (pubkey: PublicKey, fetchTransactions?: boolean, refresh?: boolean) => {
            const activeFilters: HistoryFilters = {
                blockTime: { gte: blockTimeGte, lte: blockTimeLte },
                slot: { gte: slotGte, lte: slotLte },
                status,
            };
            const key = pubkey.toBase58();
            // Snapshot the generation at dispatch time; if it advances before the
            // response lands (a filter change), the result is treated as stale.
            const generation = generations.get(key) ?? 0;
            const isCurrent = () => (generations.get(key) ?? 0) === generation;

            const before = state.entries[key];
            if (!refresh && before?.data?.fetched && before.data.fetched.length > 0) {
                if (before.data.foundOldest) return;

                let additionalSignatures: string[] = [];
                if (fetchTransactions) {
                    additionalSignatures = getUnfetchedSignatures(before);
                }

                // Cursor for the next page: paginationToken drives getTransactionsForAddress,
                // the trailing signature drives the getSignaturesForAddress fallback.
                const oldest = before.data.fetched[before.data.fetched.length - 1].signature;
                fetchOnce(key, inFlight, () =>
                    fetchAccountHistory(
                        dispatch,
                        pubkey,
                        cluster,
                        url,
                        {
                            append: true,
                            before: oldest,
                            filters: activeFilters,
                            limit,
                            paginationToken: before.data?.paginationToken,
                        },
                        fetchTransactions,
                        additionalSignatures,
                        isCurrent,
                        markUnsupported,
                    ),
                ).catch(e => Logger.error(e));
            } else {
                fetchOnce(key, inFlight, () =>
                    fetchAccountHistory(
                        dispatch,
                        pubkey,
                        cluster,
                        url,
                        { append: false, filters: activeFilters, limit },
                        fetchTransactions,
                        undefined,
                        isCurrent,
                        markUnsupported,
                    ),
                ).catch(e => Logger.error(e));
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
            markUnsupported,
        ],
    );
}
