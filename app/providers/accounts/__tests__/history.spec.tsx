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

// Must import after mocks
import { HistoryProvider, useAccountHistory, useFetchAccountHistory } from '../history';

const ADDRESS = 'rexav5eNTUSNT1K2N7cfRjnthwhcP5BC25v2tA4rW4h';

function sig(signature: string, slot: number) {
    return { blockTime: null, confirmationStatus: 'finalized', err: null, memo: null, signature, slot };
}

const fetchMock = vi.fn();

// Resolve the next fetch call with a getTransactionsForAddress result envelope.
function mockResult(data: ReturnType<typeof sig>[], paginationToken: string | null) {
    fetchMock.mockResolvedValueOnce({
        json: async () => ({ id: 1, jsonrpc: '2.0', result: { data, paginationToken } }),
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
    vi.mocked(Connection).mockImplementation(() => ({}) as unknown as Connection);
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
