import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';

const mocks = vi.hoisted(() => ({
    fetchRawTransaction: vi.fn(),
    getCompiledInstructionSummaries: vi.fn(),
}));

vi.mock('@entities/transaction-data', () => ({
    fetchRawTransaction: mocks.fetchRawTransaction,
    getCompiledInstructionSummaries: mocks.getCompiledInstructionSummaries,
}));
vi.mock('@providers/cluster', () => ({ useCluster: () => ({ url: 'https://api.devnet.solana.com' }) }));
// The backoff sleeps between attempts would outlast the wait in these tests.
vi.mock('@utils/with-backoff', () => ({ withBackoff: (fn: () => Promise<unknown>) => fn() }));

import { type RowTransactionState, useRowTransaction } from '../use-row-transaction';

// shouldRetryOnError:false keeps a thrown fetch from retrying mid-test.
const wrapper = swrWrapper({ dedupingInterval: 0, shouldRetryOnError: false });

const MESSAGE_BYTES = new Uint8Array([1, 2, 3]);
const SUMMARIES = [{ name: 'Transfer', programName: 'System Program' }];

afterEach(() => vi.resetAllMocks());

describe('useRowTransaction', () => {
    it('should return the message bytes and the summaries read from them', async () => {
        mocks.fetchRawTransaction.mockResolvedValue({ messageBytes: MESSAGE_BYTES });
        mocks.getCompiledInstructionSummaries.mockReturnValue(SUMMARIES);

        const { result } = renderHook(() => useRowTransaction('sig'), { wrapper });

        await waitForHook(() =>
            expect(result.current).toEqual({ messageBytes: MESSAGE_BYTES, status: 'loaded', summaries: SUMMARIES }),
        );
        expect(mocks.getCompiledInstructionSummaries).toHaveBeenCalledWith(MESSAGE_BYTES);
        expect(mocks.fetchRawTransaction).toHaveBeenCalledOnce();
    });

    // A null tx is a transient miss (a node that hasn't indexed the signature), not "no instructions".
    // Caching [] would blank the row permanently under useSWRImmutable.
    it('should not cache an empty result when the transaction is missing', async () => {
        mocks.fetchRawTransaction.mockResolvedValue(null);

        const { result } = renderHook(() => useRowTransaction('sig'), { wrapper });

        await waitForHook(() => expect(result.current.status).toBe('failed'));
        expect(mocks.getCompiledInstructionSummaries).not.toHaveBeenCalled();
    });

    it('should not fetch while disabled', () => {
        const { result } = renderHook(() => useRowTransaction('sig', false), { wrapper });

        expect(result.current).toEqual({ status: 'loading' });
        expect(mocks.fetchRawTransaction).not.toHaveBeenCalled();
    });

    it('should fetch again and load when a failed fetch is retried', async () => {
        mocks.fetchRawTransaction.mockRejectedValueOnce(new Error('HTTP error (429)'));
        mocks.fetchRawTransaction.mockResolvedValueOnce({ messageBytes: MESSAGE_BYTES });
        mocks.getCompiledInstructionSummaries.mockReturnValue(SUMMARIES);

        const { result } = renderHook(() => useRowTransaction('sig'), { wrapper });
        const failed = await waitForHook(() => failedState(result.current));
        act(() => failed.retry());

        await waitForHook(() => expect(result.current.status).toBe('loaded'));
        expect(mocks.fetchRawTransaction).toHaveBeenCalledTimes(2);
    });

    it('should show loading while a retry runs', async () => {
        mocks.fetchRawTransaction.mockRejectedValueOnce(new Error('HTTP error (429)'));
        mocks.fetchRawTransaction.mockReturnValueOnce(new Promise(() => {}));

        const { result } = renderHook(() => useRowTransaction('sig'), { wrapper });
        const failed = await waitForHook(() => failedState(result.current));
        act(() => failed.retry());

        await waitForHook(() => expect(result.current).toEqual({ status: 'loading' }));
    });
});

function failedState(state: RowTransactionState): { retry: () => void } {
    if (state.status !== 'failed') throw new Error(`expected failed, got ${state.status}`);
    return state;
}
