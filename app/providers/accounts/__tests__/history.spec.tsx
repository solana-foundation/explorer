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

const mockConnection = {
    getSignaturesForAddress: vi.fn(),
};

// Must import after mocks
import { HistoryProvider, useAccountHistory, useFetchAccountHistory } from '../history';

const ADDRESS = 'rexav5eNTUSNT1K2N7cfRjnthwhcP5BC25v2tA4rW4h';

function wrapper({ children }: { children: React.ReactNode }) {
    return <HistoryProvider>{children}</HistoryProvider>;
}

function sig(signature: string, slot: number) {
    return { blockTime: null, err: null, memo: null, signature, slot };
}

beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(Connection).mockImplementation(() => mockConnection as unknown as Connection);
    mockConnection.getSignaturesForAddress.mockResolvedValue([]);
});

describe('useFetchAccountHistory — slot filters', () => {
    it('passes afterSlot and beforeSlot to getSignaturesForAddress on the initial fetch', async () => {
        const { result } = renderHook(
            () => useFetchAccountHistory(25, { afterSlot: 100, beforeSlot: 500 }),
            { wrapper },
        );

        await act(async () => {
            result.current(new PublicKey(ADDRESS));
        });

        await waitFor(() => expect(mockConnection.getSignaturesForAddress).toHaveBeenCalled());

        const [pubkey, options] = mockConnection.getSignaturesForAddress.mock.calls[0];
        expect(pubkey.toBase58()).toBe(ADDRESS);
        expect(options).toMatchObject({ afterSlot: 100, beforeSlot: 500, limit: 25 });
        expect((options as { before?: string }).before).toBeUndefined();
    });

    it('omits filter keys when not provided', async () => {
        const { result } = renderHook(() => useFetchAccountHistory(25, {}), { wrapper });

        await act(async () => {
            result.current(new PublicKey(ADDRESS));
        });

        await waitFor(() => expect(mockConnection.getSignaturesForAddress).toHaveBeenCalled());
        const [, options] = mockConnection.getSignaturesForAddress.mock.calls[0];
        expect(options).toMatchObject({ limit: 25 });
        expect((options as { afterSlot?: number }).afterSlot).toBeUndefined();
        expect((options as { beforeSlot?: number }).beforeSlot).toBeUndefined();
    });

    it('threads slot filters alongside the `before` cursor when loading more', async () => {
        mockConnection.getSignaturesForAddress.mockResolvedValueOnce(
            Array.from({ length: 25 }, (_, i) => sig(`sig${i}`, 1000 - i)),
        );

        // Render the fetch hook + a reader of the same cache so we can observe the first page.
        const { result } = renderHook(
            () => ({
                fetch: useFetchAccountHistory(25, { afterSlot: 100, beforeSlot: 2000 }),
                history: useAccountHistory(ADDRESS),
            }),
            { wrapper },
        );

        await act(async () => {
            result.current.fetch(new PublicKey(ADDRESS));
        });

        await waitFor(() => expect(result.current.history?.data?.fetched?.length).toBe(25));

        mockConnection.getSignaturesForAddress.mockClear();
        mockConnection.getSignaturesForAddress.mockResolvedValueOnce([]);

        await act(async () => {
            result.current.fetch(new PublicKey(ADDRESS));
        });

        await waitFor(() => expect(mockConnection.getSignaturesForAddress).toHaveBeenCalled());
        const [, options] = mockConnection.getSignaturesForAddress.mock.calls[0];
        expect(options).toMatchObject({
            afterSlot: 100,
            before: 'sig24',
            beforeSlot: 2000,
            limit: 25,
        });
    });
});
