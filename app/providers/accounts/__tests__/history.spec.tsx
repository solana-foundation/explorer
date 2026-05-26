import { Connection, PublicKey } from '@solana/web3.js';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@providers/cluster', () => ({
    useCluster: vi.fn(() => ({
        cluster: 0,
        url: 'https://mock.rpc',
    })),
}));

vi.mock('@solana/web3.js', async () => {
    const actual = await vi.importActual<typeof import('@solana/web3.js')>('@solana/web3.js');
    return {
        ...actual,
        Connection: vi.fn(),
        PublicKey: actual.PublicKey,
    };
});

vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn() } }));

// Must import after mocks
import { FetchStatus } from '@providers/cache';

import {
    HistoryProvider,
    useAccountHistory,
    useFetchAccountHistory,
    useHistoryFiltersSupported,
    useResetAccountHistory,
} from '../history';

const ADDRESS = 'rexav5eNTUSNT1K2N7cfRjnthwhcP5BC25v2tA4rW4h';
const ADDRESS_B = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d';

function sig(signature: string, slot: number) {
    return { blockTime: null, confirmationStatus: 'finalized', err: null, memo: null, signature, slot };
}

function envelope(data: ReturnType<typeof sig>[], paginationToken: string | null) {
    return { json: async () => ({ id: 1, jsonrpc: '2.0', result: { data, paginationToken } }) };
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
const mockConnection = { getSignaturesForAddress: vi.fn() };

// Resolve the next fetch call with a getTransactionsForAddress result envelope.
function mockResult(data: ReturnType<typeof sig>[], paginationToken: string | null) {
    fetchMock.mockResolvedValueOnce(envelope(data, paginationToken));
}

// Resolve the next fetch call with a JSON-RPC error (e.g. method-not-found).
function mockRpcError(code: number, message: string) {
    fetchMock.mockResolvedValueOnce({ json: async () => ({ error: { code, message }, id: 1, jsonrpc: '2.0' }) });
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
    vi.mocked(Connection).mockImplementation(() => mockConnection as unknown as Connection);
    vi.stubGlobal('fetch', fetchMock);
    // Fallback response; tests queue page-specific results with mockResult (once).
    fetchMock.mockResolvedValue({
        json: async () => ({ id: 1, jsonrpc: '2.0', result: { data: [], paginationToken: null } }),
    });
});

describe('useFetchAccountHistory — getTransactionsForAddress', () => {
    it('maps slot filters onto the filters object on the initial fetch', async () => {
        const { result } = renderHook(() => useFetchAccountHistory(25, { slot: { gte: 100, lte: 500 } }), {
            wrapper,
        });

        await act(async () => {
            result.current(new PublicKey(ADDRESS));
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

    it('maps status and block time filters', async () => {
        const { result } = renderHook(
            () =>
                useFetchAccountHistory(25, {
                    blockTime: { gte: 1_700_000_000, lte: 1_700_100_000 },
                    status: 'failed',
                }),
            { wrapper },
        );

        await act(async () => {
            result.current(new PublicKey(ADDRESS));
        });

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        const [, options] = requestParams();
        expect(options.filters).toEqual({
            blockTime: { gte: 1_700_000_000, lte: 1_700_100_000 },
            status: 'failed',
        });
    });

    it('omits the filters key when no filter is provided', async () => {
        const { result } = renderHook(() => useFetchAccountHistory(25, {}), { wrapper });

        await act(async () => {
            result.current(new PublicKey(ADDRESS));
        });

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        const [, options] = requestParams();
        expect(options).toMatchObject({ limit: 25, paginationToken: null });
        expect('filters' in options).toBe(false);
    });

    it('threads the paginationToken from the previous page when loading more', async () => {
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
            result.current.fetch(new PublicKey(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.data?.fetched?.length).toBe(25));

        fetchMock.mockClear();
        mockResult([], null);

        await act(async () => {
            result.current.fetch(new PublicKey(ADDRESS));
        });

        await waitFor(() => expect(fetchMock).toHaveBeenCalled());
        const [, options] = requestParams();
        expect(options).toMatchObject({
            filters: { slot: { gte: 100 } },
            limit: 25,
            paginationToken: 'token-page-2',
        });
    });

    it('stops paginating once a page returns a null token', async () => {
        mockResult([sig('only', 10)], null);

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, {}),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(new PublicKey(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.data?.foundOldest).toBe(true));

        fetchMock.mockClear();

        await act(async () => {
            result.current.fetch(new PublicKey(ADDRESS));
        });

        // foundOldest short-circuits the load-more, so no further request is made.
        expect(fetchMock).not.toHaveBeenCalled();
    });
});

describe('useResetAccountHistory', () => {
    it('discards an in-flight response that resolves after a reset (no stale write)', async () => {
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
            result.current.fetch(new PublicKey(ADDRESS));
        });
        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

        // User applies a filter: reset supersedes the in-flight request, then refetch.
        mockResult([sig('filtered', 200)], null);
        act(() => {
            result.current.reset(ADDRESS);
            result.current.fetch(new PublicKey(ADDRESS), false, true);
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

    it('clears only the target address, leaving other addresses intact', async () => {
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
            result.current.fetch(new PublicKey(ADDRESS));
        });
        mockResult([sig('b', 20)], null);
        await act(async () => {
            result.current.fetch(new PublicKey(ADDRESS_B));
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
    it('falls back when getTransactionsForAddress is not found, mapping slot bounds', async () => {
        mockRpcError(-32601, 'Method not found');
        mockConnection.getSignaturesForAddress.mockResolvedValueOnce([sig('legacy', 5)]);

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, { slot: { gte: 10, lte: 99 } }),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(new PublicKey(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.data?.fetched?.[0]?.signature).toBe('legacy'));
        expect(mockConnection.getSignaturesForAddress).toHaveBeenCalledTimes(1);
        const [pubkey, opts] = mockConnection.getSignaturesForAddress.mock.calls[0];
        expect(pubkey.toBase58()).toBe(ADDRESS);
        // Slot bounds are passed via the Hydrant untilSlot/beforeSlot extension.
        expect(opts).toMatchObject({ beforeSlot: 99, limit: 25, untilSlot: 10 });
    });

    it('does not fall back on a generic RPC error', async () => {
        mockRpcError(-32000, 'boom');

        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, {}),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(new PublicKey(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.status).toBe(FetchStatus.FetchFailed));
        expect(mockConnection.getSignaturesForAddress).not.toHaveBeenCalled();
    });

    it('marks filtering unsupported after a method-not-found, and stays supported otherwise', async () => {
        mockRpcError(-32601, 'Method not found');
        mockConnection.getSignaturesForAddress.mockResolvedValueOnce([sig('legacy', 5)]);

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
            result.current.fetch(new PublicKey(ADDRESS));
        });

        await waitFor(() => expect(result.current.supported).toBe(false));
    });
});
