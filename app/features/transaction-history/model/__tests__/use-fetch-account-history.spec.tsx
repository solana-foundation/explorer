import { address as toAddress } from '@solana/kit';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@providers/cluster', () => ({
    useCluster: vi.fn(() => ({
        cluster: 0,
        url: 'https://mock.rpc',
    })),
}));

// The kit rpc pattern is rpc.getSignaturesForAddress(address, config).send(); the mock unwraps
// the pending-request layer so tests can queue results with plain mockResolvedValue*.
const rpcMocks = vi.hoisted(() => ({ getSignaturesForAddress: vi.fn() }));

vi.mock('@entities/cluster', async () => {
    const actual = await vi.importActual<typeof import('@entities/cluster')>('@entities/cluster');
    return {
        ...actual,
        getRpc: () => ({
            getSignaturesForAddress: (...args: unknown[]) => ({
                send: () => rpcMocks.getSignaturesForAddress(...args),
            }),
        }),
    };
});

vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn(), warn: vi.fn() } }));

// Must import after mocks
import { FetchStatus } from '@providers/cache';
import { useCluster } from '@providers/cluster';

import { HistoryProvider } from '../history-provider';
import { useAccountHistory, useHistoryFiltersSupported, useResetAccountHistory } from '../use-account-history';
import { useFetchAccountHistory } from '../use-fetch-account-history';

const ADDRESS = 'rexav5eNTUSNT1K2N7cfRjnthwhcP5BC25v2tA4rW4h';
const ADDRESS_B = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';

function sig(signature: string, slot: number) {
    return { blockTime: null, confirmationStatus: 'finalized', err: null, memo: null, signature, slot };
}

function envelope(data: ReturnType<typeof sig>[], paginationToken: string | null) {
    return { json: async () => ({ id: 1, jsonrpc: '2.0', result: { data, paginationToken } }), ok: true, status: 200 };
}

// A promise we resolve by hand, to model a request that is still in flight.
function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(r => {
        resolve = r;
    });
    return { promise, resolve };
}

const fetchMock = vi.fn();

// Resolve the next fetch call with a getTransactionsForAddress result envelope.
function mockResult(data: ReturnType<typeof sig>[], paginationToken: string | null) {
    fetchMock.mockResolvedValueOnce(envelope(data, paginationToken));
}

// Resolve the next fetch call with a JSON-RPC error (e.g. method-not-found).
function mockRpcError(code: number, message: string) {
    // Standard RPC nodes return JSON-RPC errors (including method-not-found) with HTTP 200.
    fetchMock.mockResolvedValueOnce({
        json: async () => ({ error: { code, message }, id: 1, jsonrpc: '2.0' }),
        ok: true,
        status: 200,
    });
}

// Parse the JSON body of the Nth fetch call into [address, options].
function requestParams(call = 0): [string, Record<string, any>] {
    const body = JSON.parse(fetchMock.mock.calls[call][1].body);
    expect(body.method).toBe('getTransactionsForAddress');
    return body.params;
}

function wrapper({ children }: { children: React.ReactNode }) {
    return <HistoryProvider>{children}</HistoryProvider>;
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    // Fallback response; tests queue page-specific results with mockResult (once).
    fetchMock.mockResolvedValue({
        json: async () => ({ id: 1, jsonrpc: '2.0', result: { data: [], paginationToken: null } }),
        ok: true,
        status: 200,
    });
    // An empty getTransactionsForAddress page is confirmed against getSignaturesForAddress,
    // so every test needs this to resolve. "Also empty" keeps the empty result as-is.
    rpcMocks.getSignaturesForAddress.mockResolvedValue([]);
    vi.mocked(useCluster).mockReturnValue({ cluster: 0, url: 'https://mock.rpc' } as any);
});

describe('useFetchAccountHistory — getTransactionsForAddress', () => {
    it('should map slot filters onto the filters object on the initial fetch', async () => {
        const { result } = renderHook(() => useFetchAccountHistory(25, { slot: { gte: 100, lte: 500 } }), {
            wrapper,
        });

        await act(async () => {
            result.current(toAddress(ADDRESS));
        });

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());

        const [address, options] = requestParams();
        expect(address).toBe(ADDRESS);
        expect(options).toMatchObject({
            filters: { slot: { gte: 100, lte: 500 } },
            limit: 25,
            paginationToken: null,
            sortOrder: 'desc',
            transactionDetails: 'signatures',
        });
    });

    it('should map status and block time filters', async () => {
        const { result } = renderHook(
            () =>
                useFetchAccountHistory(25, {
                    blockTime: { gte: 1_700_000_000, lte: 1_700_100_000 },
                    status: 'failed',
                }),
            { wrapper },
        );

        await act(async () => {
            result.current(toAddress(ADDRESS));
        });

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        const [, options] = requestParams();
        expect(options.filters).toEqual({
            blockTime: { gte: 1_700_000_000, lte: 1_700_100_000 },
            status: 'failed',
        });
    });

    it('should omit the filters key when no filter is provided', async () => {
        const { result } = renderHook(() => useFetchAccountHistory(25, {}), { wrapper });

        await act(async () => {
            result.current(toAddress(ADDRESS));
        });

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        const [, options] = requestParams();
        expect(options).toMatchObject({ limit: 25, paginationToken: null });
        expect('filters' in options).toBe(false);
    });

    it('should thread the paginationToken from the previous page when loading more', async () => {
        mockResult(
            Array.from({ length: 25 }, (_, i) => sig(`sig${i}`, 1000 - i)),
            'token-page-2',
        );

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, { slot: { gte: 100 } }),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.data?.fetched?.length).toBe(25));

        fetchMock.mockClear();
        mockResult([], null);

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        const [, options] = requestParams();
        expect(options).toMatchObject({
            filters: { slot: { gte: 100 } },
            limit: 25,
            paginationToken: 'token-page-2',
        });
    });

    it('should keep loading more on a short page that still carries a token', async () => {
        // Fewer items than the limit, but a non-null token means more data exists.
        mockResult([sig('partial', 10)], 'token-page-2');

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, {}),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.data?.fetched?.length).toBe(1));
        expect(result.current.history?.data?.foundOldest).toBe(false);

        // Load More should issue another request, threading the token forward.
        fetchMock.mockClear();
        mockResult([], null);
        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        expect(requestParams()[1]).toMatchObject({ paginationToken: 'token-page-2' });
    });

    it('should stop paginating once a page returns a null token', async () => {
        mockResult([sig('only', 10)], null);

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, {}),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.data?.foundOldest).toBe(true));

        fetchMock.mockClear();

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        // foundOldest short-circuits the load-more, so no further request is made.
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe('useResetAccountHistory', () => {
    it('should discard an in-flight response that resolves after a reset (no stale write)', async () => {
        // First request is left pending to model a page-load still in flight.
        const pending = deferred<ReturnType<typeof envelope>>();
        fetchMock.mockReturnValueOnce(pending.promise);

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, {}),
                history: useAccountHistory(ADDRESS),
                reset: useResetAccountHistory(),
            }),
            { wrapper },
        );

        // Kick off the initial (unfiltered) fetch; it does not resolve yet.
        act(() => {
            result.current.fetch(toAddress(ADDRESS));
        });
        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

        // User applies a filter: reset supersedes the in-flight request, then refetch.
        mockResult([sig('filtered', 200)], null);
        act(() => {
            result.current.reset(ADDRESS);
            result.current.fetch(toAddress(ADDRESS), false, true);
        });

        await waitFor(() => expect(result.current.history?.data?.fetched?.[0]?.signature).toBe('filtered'));

        // Now the original request resolves with unfiltered data — it must be dropped.
        await act(async () => {
            pending.resolve(envelope([sig('stale', 1)], null));
            await pending.promise;
        });

        expect(result.current.history?.data?.fetched).toHaveLength(1);
        expect(result.current.history?.data?.fetched[0].signature).toBe('filtered');
    });

    it('should clear only the target address, leaving other addresses intact', async () => {
        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, {}),
                historyA: useAccountHistory(ADDRESS),
                historyB: useAccountHistory(ADDRESS_B),
                reset: useResetAccountHistory(),
            }),
            { wrapper },
        );

        mockResult([sig('a', 10)], null);
        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });
        mockResult([sig('b', 20)], null);
        await act(async () => {
            result.current.fetch(toAddress(ADDRESS_B));
        });

        await waitFor(() => expect(result.current.historyA?.data?.fetched?.length).toBe(1));
        await waitFor(() => expect(result.current.historyB?.data?.fetched?.length).toBe(1));

        act(() => {
            result.current.reset(ADDRESS);
        });

        expect(result.current.historyA).toBeUndefined();
        expect(result.current.historyB?.data?.fetched?.[0]?.signature).toBe('b');
    });
});

describe('getSignaturesForAddress fallback', () => {
    it('should fall back when getTransactionsForAddress is not found, applying no filters', async () => {
        mockRpcError(-32601, 'Method not found');
        rpcMocks.getSignaturesForAddress.mockResolvedValueOnce([sig('legacy', 5)]);

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, { slot: { gte: 10, lte: 99 } }),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.data?.fetched?.[0]?.signature).toBe('legacy'));
        expect(rpcMocks.getSignaturesForAddress).toHaveBeenCalledTimes(1);
        const [address, opts] = rpcMocks.getSignaturesForAddress.mock.calls[0];
        expect(address).toBe(ADDRESS);
        // Standard RPCs support none of the filters, so slot bounds are not forwarded.
        expect(opts).toEqual({ limit: 25 });
    });

    it('should skip getTransactionsForAddress entirely for a statically disabled address', async () => {
        // wSOL: gTFA times out upstream on this account, so it must never be attempted.
        const WRAPPED_SOL = 'So11111111111111111111111111111111111111112';
        rpcMocks.getSignaturesForAddress.mockResolvedValueOnce([sig('wsol', 7)]);

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, {}),
                history: useAccountHistory(WRAPPED_SOL),
                supported: useHistoryFiltersSupported(),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(toAddress(WRAPPED_SOL));
        });

        await waitFor(() => expect(result.current.history?.data?.fetched?.[0]?.signature).toBe('wsol'));
        expect(fetchMock).not.toHaveBeenCalled();
        // Scoped to this address: filtering stays available for every other account.
        expect(result.current.supported).toBe(true);
    });

    it('should fall back when an unknown method is reported as a generic internal error', async () => {
        // Helius reports an unknown method as -32603, not -32601.
        mockRpcError(-32603, 'Method not found');
        rpcMocks.getSignaturesForAddress.mockResolvedValueOnce([sig('legacy', 5)]);

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, {}),
                history: useAccountHistory(ADDRESS),
                supported: useHistoryFiltersSupported(),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.data?.fetched?.[0]?.signature).toBe('legacy'));
        expect(result.current.supported).toBe(false);
    });

    it('should surface an internal error that is not a missing method', async () => {
        // Same code, genuinely different failure: a slot bound below the endpoint's index floor.
        mockRpcError(-32603, 'Slot <= 460000000 not found');

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, { slot: { lte: 460_000_000 } }),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.status).toBe(FetchStatus.FetchFailed));
        expect(rpcMocks.getSignaturesForAddress).not.toHaveBeenCalled();
    });

    it('should not fall back on a generic RPC error', async () => {
        mockRpcError(-32000, 'boom');

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, {}),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.status).toBe(FetchStatus.FetchFailed));
        expect(rpcMocks.getSignaturesForAddress).not.toHaveBeenCalled();
    });

    it('should confirm an empty getTransactionsForAddress page against the ledger index', async () => {
        // Endpoint answers HTTP 200 with `data: []` because the address falls outside its
        // limited-retention index, while getSignaturesForAddress still has the history.
        mockResult([], null);
        rpcMocks.getSignaturesForAddress.mockResolvedValueOnce([sig('older-than-retention', 5)]);

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, {}),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.data?.fetched?.[0]?.signature).toBe('older-than-retention'));
        expect(result.current.history?.data?.paginationToken).toBeUndefined();
    });

    it('should accept the empty result when the ledger index agrees the account has no history', async () => {
        mockResult([], null);

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, {}),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.status).toBe(FetchStatus.Fetched));
        expect(result.current.history?.data?.fetched).toEqual([]);
        expect(result.current.history?.data?.foundOldest).toBe(true);
        expect(rpcMocks.getSignaturesForAddress).toHaveBeenCalled();
    });

    it('should keep the empty result when the confirmation call itself fails', async () => {
        // The confirmation only verifies an answer we already hold. A rate-limited endpoint
        // must not turn an empty account into "Failed to fetch transaction history".
        mockResult([], null);
        rpcMocks.getSignaturesForAddress.mockRejectedValue(new Error('429 Too Many Requests'));

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, {}),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.status).toBe(FetchStatus.Fetched));
        expect(result.current.history?.data?.fetched).toEqual([]);
    });

    it('should not confirm an empty page that still carries a token when loading more', async () => {
        // A sparse region mid-stream: no rows, but the endpoint hands back a cursor. That is
        // not an end-of-history claim, so the gTFA cursor must survive rather than be traded
        // for the signatures path.
        mockResult(
            Array.from({ length: 25 }, (_, i) => sig(`sig${i}`, 1000 - i)),
            'token-page-2',
        );

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, {}),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });
        await waitFor(() => expect(result.current.history?.data?.fetched?.length).toBe(25));

        // Load More returns an empty page that still advances the cursor.
        rpcMocks.getSignaturesForAddress.mockClear();
        mockResult([], 'token-page-3');
        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.data?.paginationToken).toBe('token-page-3'));
        expect(result.current.history?.data?.foundOldest).toBe(false);
        expect(rpcMocks.getSignaturesForAddress).not.toHaveBeenCalled();
    });

    it('should confirm an empty first page even when it carries a token', async () => {
        // No rows means no cursor the UI can reach: Load More is driven by existing rows, so
        // accepting this page would strand the account on an empty table.
        mockResult([], 'token-page-2');
        rpcMocks.getSignaturesForAddress.mockResolvedValueOnce([sig('from-ledger', 5)]);

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, {}),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.data?.fetched?.[0]?.signature).toBe('from-ledger'));
    });

    it('should not confirm an empty page while a filter is active', async () => {
        // getSignaturesForAddress cannot honour filters, so its rows would answer a different
        // question. An empty filtered page is a legitimate "no matches".
        mockResult([], null);

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, { status: 'failed' }),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.status).toBe(FetchStatus.Fetched));
        expect(result.current.history?.data?.fetched).toEqual([]);
        expect(rpcMocks.getSignaturesForAddress).not.toHaveBeenCalled();
    });

    it('should keep a confirmed address on the signatures path when loading more', async () => {
        // A full page from the ledger index, so foundOldest stays false and Load More runs.
        const page = Array.from({ length: 25 }, (_, i) => sig(`sig${i}`, 1000 - i));
        mockResult([], null);
        rpcMocks.getSignaturesForAddress.mockResolvedValueOnce(page);

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, {}),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.data?.fetched?.length).toBe(25));

        fetchMock.mockClear();
        rpcMocks.getSignaturesForAddress.mockClear();
        rpcMocks.getSignaturesForAddress.mockResolvedValueOnce([sig('next-page', 900)]);

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.data?.fetched?.length).toBe(26));
        // The latch holds: no second getTransactionsForAddress attempt, and the trailing
        // signature drives the cursor rather than a (now null) paginationToken.
        expect(fetchMock).not.toHaveBeenCalled();
        expect(rpcMocks.getSignaturesForAddress).toHaveBeenCalledTimes(1);
        expect(rpcMocks.getSignaturesForAddress.mock.calls[0][1]).toEqual({ before: 'sig24', limit: 25 });
    });

    it('should not let a request in flight across a cluster change latch the new endpoint', async () => {
        // The provider clears the latch on a cluster change, but a request already in flight
        // resolves afterwards and still reports what it proved. That report must not apply to
        // the endpoint that is now selected.
        const pendingConfirm = deferred<ReturnType<typeof sig>[]>();
        mockResult([], null); // endpoint A: gTFA answers empty
        rpcMocks.getSignaturesForAddress.mockReturnValueOnce(pendingConfirm.promise);

        const { result, rerender } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, {}),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        act(() => {
            result.current.fetch(toAddress(ADDRESS));
        });
        // The confirmation is issued but not yet resolved.
        await waitFor(() => expect(rpcMocks.getSignaturesForAddress).toHaveBeenCalledTimes(1));

        // Cluster changes while that confirmation is still open.
        vi.mocked(useCluster).mockReturnValue({ cluster: 0, url: 'https://other.rpc' } as any);
        rerender();

        // Now the stale confirmation lands and reports the address as uncovered.
        await act(async () => {
            pendingConfirm.resolve([sig('from-endpoint-a', 5)]);
            await pendingConfirm.promise;
        });

        // A fresh unfiltered request on the new endpoint must still try gTFA.
        fetchMock.mockClear();
        rpcMocks.getSignaturesForAddress.mockClear();
        mockResult([sig('from-endpoint-b', 9)], null);

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        expect(JSON.parse(fetchMock.mock.calls[0][1].body).method).toBe('getTransactionsForAddress');
        expect(rpcMocks.getSignaturesForAddress).not.toHaveBeenCalled();
    });

    it('should mark filtering unsupported after a method-not-found, and stay supported otherwise', async () => {
        mockRpcError(-32601, 'Method not found');
        rpcMocks.getSignaturesForAddress.mockResolvedValueOnce([sig('legacy', 5)]);

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, {}),
                supported: useHistoryFiltersSupported(),
            }),
            { wrapper },
        );

        // Optimistically supported until the first request reveals otherwise.
        expect(result.current.supported).toBe(true);

        await act(async () => {
            result.current.fetch(toAddress(ADDRESS));
        });

        await waitFor(() => expect(result.current.supported).toBe(false));
    });
});
