import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';

const mocks = vi.hoisted(() => ({
    fetchTransactionDetails: vi.fn(),
    getInstructionSummaries: vi.fn(),
}));

vi.mock('@entities/transaction-data', () => ({
    fetchTransactionDetails: mocks.fetchTransactionDetails,
    getInstructionSummaries: mocks.getInstructionSummaries,
}));
vi.mock('@providers/cluster', () => ({ useCluster: () => ({ url: 'https://api.devnet.solana.com' }) }));

import { useInstructionSummaries } from '../use-instruction-summaries';

// shouldRetryOnError:false keeps a thrown fetch from retrying mid-test.
const wrapper = swrWrapper({ dedupingInterval: 0, shouldRetryOnError: false });

afterEach(() => vi.clearAllMocks());

describe('useInstructionSummaries', () => {
    it('should return the summaries for a fetched transaction', async () => {
        const summaries = [{ name: 'Transfer', programName: 'System Program' }];
        mocks.fetchTransactionDetails.mockResolvedValue({ tx: true });
        mocks.getInstructionSummaries.mockReturnValue(summaries);

        const { result } = renderHook(() => useInstructionSummaries('sig'), { wrapper });

        await waitForHook(() => expect(result.current).toBe(summaries));
    });

    // The regression guard: a null tx is a transient miss (a node that hasn't indexed the signature),
    // not "no instructions". It must NOT settle as a cached [] — that would blank the row permanently
    // under useSWRImmutable. The fetcher throws instead, leaving data undefined so SWR can retry.
    it('should not cache an empty result when the transaction is missing', async () => {
        // fetchTransactionDetails returns null for a not-yet-indexed tx
        mocks.fetchTransactionDetails.mockResolvedValue(null);

        const { result } = renderHook(() => useInstructionSummaries('sig'), { wrapper });

        await waitForHook(() => expect(mocks.fetchTransactionDetails).toHaveBeenCalled());
        expect(mocks.getInstructionSummaries).not.toHaveBeenCalled();
        expect(result.current).toBeUndefined();
    });

    it('should return an empty array for a transaction with no summarizable instructions', async () => {
        mocks.fetchTransactionDetails.mockResolvedValue({ tx: true });
        mocks.getInstructionSummaries.mockReturnValue([]);

        const { result } = renderHook(() => useInstructionSummaries('sig'), { wrapper });

        await waitForHook(() => expect(result.current).toEqual([]));
    });

    it('should not fetch while disabled', () => {
        renderHook(() => useInstructionSummaries('sig', false), { wrapper });

        expect(mocks.fetchTransactionDetails).not.toHaveBeenCalled();
    });
});
