import { act, renderHook } from '@testing-library/react';
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
// The backoff sleeps between attempts would outlast the wait in these tests.
vi.mock('@utils/with-backoff', () => ({ withBackoff: (fn: () => Promise<unknown>) => fn() }));

import { useInstructionSummaries } from '../use-instruction-summaries';

// shouldRetryOnError:false keeps a thrown fetch from retrying mid-test.
const wrapper = swrWrapper({ dedupingInterval: 0, shouldRetryOnError: false });

afterEach(() => vi.resetAllMocks());

describe('useInstructionSummaries', () => {
    it('should return the summaries for a fetched transaction', async () => {
        const summaries = [{ name: 'Transfer', programName: 'System Program' }];
        mocks.fetchTransactionDetails.mockResolvedValue({ tx: true });
        mocks.getInstructionSummaries.mockReturnValue(summaries);

        const { result } = renderHook(() => useInstructionSummaries('sig'), { wrapper });

        await waitForHook(() => expect(result.current).toEqual({ status: 'loaded', summaries }));
    });

    // A null tx is a transient miss (a node that hasn't indexed the signature), not "no instructions".
    // Caching [] would blank the row permanently under useSWRImmutable.
    it('should not cache an empty result when the transaction is missing', async () => {
        mocks.fetchTransactionDetails.mockResolvedValue(null);

        const { result } = renderHook(() => useInstructionSummaries('sig'), { wrapper });

        await waitForHook(() => expect(result.current.status).toBe('failed'));
        expect(mocks.getInstructionSummaries).not.toHaveBeenCalled();
    });

    it('should return an empty array for a transaction with no summarizable instructions', async () => {
        mocks.fetchTransactionDetails.mockResolvedValue({ tx: true });
        mocks.getInstructionSummaries.mockReturnValue([]);

        const { result } = renderHook(() => useInstructionSummaries('sig'), { wrapper });

        await waitForHook(() => expect(result.current).toEqual({ status: 'loaded', summaries: [] }));
    });

    it('should not fetch while disabled', () => {
        const { result } = renderHook(() => useInstructionSummaries('sig', false), { wrapper });

        expect(result.current).toEqual({ status: 'loading' });
        expect(mocks.fetchTransactionDetails).not.toHaveBeenCalled();
    });

    it('should fetch again and load when a failed fetch is retried', async () => {
        const summaries = [{ name: 'Transfer', programName: 'System Program' }];
        mocks.fetchTransactionDetails.mockRejectedValueOnce(new Error('HTTP error (429)'));
        mocks.fetchTransactionDetails.mockResolvedValueOnce({ tx: true });
        mocks.getInstructionSummaries.mockReturnValue(summaries);

        const { result } = renderHook(() => useInstructionSummaries('sig'), { wrapper });
        const failed = await waitForHook(() => failedState(result.current));
        act(() => failed.retry());

        await waitForHook(() => expect(result.current).toEqual({ status: 'loaded', summaries }));
        expect(mocks.fetchTransactionDetails).toHaveBeenCalledTimes(2);
    });

    it('should show loading while a retry runs', async () => {
        mocks.fetchTransactionDetails.mockRejectedValueOnce(new Error('HTTP error (429)'));
        mocks.fetchTransactionDetails.mockReturnValueOnce(new Promise(() => {}));

        const { result } = renderHook(() => useInstructionSummaries('sig'), { wrapper });
        const failed = await waitForHook(() => failedState(result.current));
        act(() => failed.retry());

        await waitForHook(() => expect(result.current).toEqual({ status: 'loading' }));
    });
});

function failedState(state: ReturnType<typeof useInstructionSummaries>): { retry: () => void } {
    if (state.status !== 'failed') throw new Error(`expected failed, got ${state.status}`);
    return state;
}
