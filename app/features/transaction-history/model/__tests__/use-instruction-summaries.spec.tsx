import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    getInstructionSummaries: vi.fn(),
    getParsedTransaction: vi.fn(),
}));

vi.mock('@solana/web3.js', () => ({
    Connection: class {
        getParsedTransaction = mocks.getParsedTransaction;
    },
}));
vi.mock('@entities/transaction-data', () => ({ getInstructionSummaries: mocks.getInstructionSummaries }));
vi.mock('@providers/cluster', () => ({ useCluster: () => ({ url: 'https://api.devnet.solana.com' }) }));

import { useInstructionSummaries } from '../use-instruction-summaries';

// shouldRetryOnError:false keeps a thrown fetch from retrying mid-test; a fresh Map provider isolates the cache.
function wrapper({ children }: { children: ReactNode }) {
    return (
        <SWRConfig value={{ dedupingInterval: 0, provider: () => new Map(), shouldRetryOnError: false }}>
            {children}
        </SWRConfig>
    );
}

afterEach(() => vi.clearAllMocks());

describe('useInstructionSummaries', () => {
    it('should return the summaries for a fetched transaction', async () => {
        const summaries = [{ name: 'Transfer', program: 'System Program' }];
        mocks.getParsedTransaction.mockResolvedValue({ tx: true });
        mocks.getInstructionSummaries.mockReturnValue(summaries);

        const { result } = renderHook(() => useInstructionSummaries('sig'), { wrapper });

        await waitFor(() => expect(result.current).toBe(summaries));
    });

    // The regression guard: a null tx is a transient miss (a node that hasn't indexed the signature),
    // not "no instructions". It must NOT settle as a cached [] — that would blank the row permanently
    // under useSWRImmutable. The fetcher throws instead, leaving data undefined so SWR can retry.
    it('should not cache an empty result when the transaction is missing', async () => {
        // getParsedTransaction returns null for a not-yet-indexed tx
        mocks.getParsedTransaction.mockResolvedValue(null);

        const { result } = renderHook(() => useInstructionSummaries('sig'), { wrapper });

        await waitFor(() => expect(mocks.getParsedTransaction).toHaveBeenCalled());
        expect(mocks.getInstructionSummaries).not.toHaveBeenCalled();
        expect(result.current).toBeUndefined();
    });

    it('should return an empty array for a transaction with no summarizable instructions', async () => {
        mocks.getParsedTransaction.mockResolvedValue({ tx: true });
        mocks.getInstructionSummaries.mockReturnValue([]);

        const { result } = renderHook(() => useInstructionSummaries('sig'), { wrapper });

        await waitFor(() => expect(result.current).toEqual([]));
    });

    it('should not fetch while disabled', () => {
        renderHook(() => useInstructionSummaries('sig', false), { wrapper });

        expect(mocks.getParsedTransaction).not.toHaveBeenCalled();
    });
});
