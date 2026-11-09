import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FAST_RETRY, settleRetries, swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';

const mocks = vi.hoisted(() => ({
    createRateLimitedQueue: vi.fn(() => (task: () => Promise<unknown>) => task()),
    fetchRawTransaction: vi.fn(),
    getCompiledInstructionSummaries: vi.fn(),
    logWarning: vi.fn(),
    useCluster: vi.fn(() => ({ url: 'https://api.devnet.solana.com' })),
}));

vi.mock('@entities/transaction-data', () => ({
    fetchRawTransaction: mocks.fetchRawTransaction,
    getCompiledInstructionSummaries: mocks.getCompiledInstructionSummaries,
}));
vi.mock('@providers/cluster', () => ({ useCluster: mocks.useCluster }));
vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: vi.fn(), warn: mocks.logWarning } }));
// The real queue spends its budget across tests in this file and would pause the later ones.
vi.mock('../../lib/rate-limited-queue', () => ({ createRateLimitedQueue: mocks.createRateLimitedQueue }));

import { type RowTransactionState, useRowTransaction } from '../use-row-transaction';

const wrapper = swrWrapper({ ...FAST_RETRY, dedupingInterval: 0 });

const MESSAGE_BYTES = new Uint8Array([1, 2, 3]);
const SUMMARIES = [{ name: 'Transfer', programName: 'System Program' }];
// The first attempt and the three automatic retries.
const ATTEMPTS_PER_CHAIN = 4;

afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
});

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

    it('should keep loading through the automatic retries and fail once they run out', async () => {
        mocks.fetchRawTransaction.mockRejectedValue(new Error('HTTP error (429)'));
        const statuses: RowTransactionState['status'][] = [];

        const { result } = renderHook(
            () => {
                const state = useRowTransaction('sig');
                if (statuses.at(-1) !== state.status) statuses.push(state.status);
                return state;
            },
            { wrapper },
        );

        await waitForHook(() => expect(result.current.status).toBe('failed'));
        expect(statuses).toEqual(['loading', 'failed']);
        expect(mocks.fetchRawTransaction).toHaveBeenCalledTimes(ATTEMPTS_PER_CHAIN);
    });

    it('should log one warning for Sentry, after the last automatic retry', async () => {
        const warningsAtEachAttempt: number[] = [];
        mocks.fetchRawTransaction.mockImplementation(async () => {
            warningsAtEachAttempt.push(mocks.logWarning.mock.calls.length);
            throw new Error('HTTP error (429)');
        });

        const { result } = renderHook(() => useRowTransaction('sig'), { wrapper });
        await waitForHook(() => expect(result.current.status).toBe('failed'));

        expect(warningsAtEachAttempt).toEqual([0, 0, 0, 0]);
        expect(mocks.logWarning).toHaveBeenCalledOnce();
        expect(mocks.logWarning).toHaveBeenCalledWith(
            '[transaction-history] row fetch failed after its retries',
            expect.objectContaining({
                sentry: 'always',
                sentryExtras: expect.not.objectContaining({ url: expect.anything() }),
            }),
        );
    });

    it('should wait the retry interval before each automatic retry', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout'] });
        mocks.fetchRawTransaction.mockRejectedValue(new Error('HTTP error (500)'));
        const retryEverySecond = swrWrapper({ dedupingInterval: 0, errorRetryInterval: 1000 });

        renderHook(() => useRowTransaction('sig'), { wrapper: retryEverySecond });
        for (const attempts of [2, 3, 4]) {
            await act(() => vi.advanceTimersByTimeAsync(999));
            expect(mocks.fetchRawTransaction).toHaveBeenCalledTimes(attempts - 1);
            await act(() => vi.advanceTimersByTimeAsync(1));
            expect(mocks.fetchRawTransaction).toHaveBeenCalledTimes(attempts);
        }
    });

    it('should send one more chain of attempts per Retry click', async () => {
        mocks.fetchRawTransaction.mockRejectedValue(new Error('HTTP error (429)'));

        const { result } = renderHook(() => useRowTransaction('sig'), { wrapper });
        const failed = await waitForHook(() => failedState(result.current));
        act(() => failed.retry());
        await waitForHook(() => expect(mocks.fetchRawTransaction).toHaveBeenCalledTimes(2 * ATTEMPTS_PER_CHAIN));
        await waitForHook(() => expect(result.current.status).toBe('failed'));
        await settleRetries();

        expect(mocks.fetchRawTransaction).toHaveBeenCalledTimes(2 * ATTEMPTS_PER_CHAIN);
    });

    it('should load when Retry follows a recovered RPC', async () => {
        mocks.fetchRawTransaction.mockRejectedValue(new Error('HTTP error (429)'));
        mocks.getCompiledInstructionSummaries.mockReturnValue(SUMMARIES);

        const { result } = renderHook(() => useRowTransaction('sig'), { wrapper });
        const failed = await waitForHook(() => failedState(result.current));
        mocks.fetchRawTransaction.mockResolvedValue({ messageBytes: MESSAGE_BYTES });
        act(() => failed.retry());

        await waitForHook(() => expect(result.current.status).toBe('loaded'));
    });

    it('should show loading while a retry runs', async () => {
        mocks.fetchRawTransaction.mockRejectedValue(new Error('HTTP error (429)'));

        const { result } = renderHook(() => useRowTransaction('sig'), { wrapper });
        const failed = await waitForHook(() => failedState(result.current));
        mocks.fetchRawTransaction.mockReturnValueOnce(new Promise(() => {}));
        act(() => failed.retry());

        await waitForHook(() => expect(result.current).toEqual({ status: 'loading' }));
    });

    // A null tx is a transient miss (a node that hasn't indexed the signature), not "no instructions".
    // Caching an empty row would blank it permanently under useSWRImmutable.
    it('should not cache an empty row when the transaction is missing', async () => {
        mocks.fetchRawTransaction.mockResolvedValue(null);

        const { result } = renderHook(() => useRowTransaction('sig'), { wrapper });

        await waitForHook(() => expect(result.current.status).toBe('failed'));
        expect(mocks.getCompiledInstructionSummaries).not.toHaveBeenCalled();
    });

    it('should fetch only once enabled', async () => {
        mocks.fetchRawTransaction.mockResolvedValue({ messageBytes: MESSAGE_BYTES });
        mocks.getCompiledInstructionSummaries.mockReturnValue(SUMMARIES);

        const { rerender, result } = renderHook(({ enabled }) => useRowTransaction('sig', enabled), {
            initialProps: { enabled: false },
            wrapper,
        });
        await settleRetries();
        expect(result.current).toEqual({ status: 'loading' });
        expect(mocks.fetchRawTransaction).not.toHaveBeenCalled();

        rerender({ enabled: true });

        await waitForHook(() => expect(result.current.status).toBe('loaded'));
    });

    it('should fetch with the new URL after the cluster changes', async () => {
        mocks.fetchRawTransaction.mockResolvedValue({ messageBytes: MESSAGE_BYTES });
        mocks.getCompiledInstructionSummaries.mockReturnValue(SUMMARIES);

        const { rerender, result } = renderHook(() => useRowTransaction('sig'), { wrapper });
        await waitForHook(() => expect(result.current.status).toBe('loaded'));
        mocks.useCluster.mockReturnValue({ url: 'http://localhost:8899' });
        rerender();

        await waitForHook(() => expect(mocks.fetchRawTransaction).toHaveBeenCalledTimes(2));
        expect(mocks.fetchRawTransaction).toHaveBeenLastCalledWith('http://localhost:8899', 'sig');
    });

    it('should show loading, not failed, after a failed row moves to another cluster', async () => {
        mocks.fetchRawTransaction.mockRejectedValue(new Error('HTTP error (429)'));

        const { rerender, result } = renderHook(() => useRowTransaction('sig'), { wrapper });
        await waitForHook(() => expect(result.current.status).toBe('failed'));
        mocks.fetchRawTransaction.mockReturnValue(new Promise(() => {}));
        mocks.useCluster.mockReturnValue({ url: 'http://localhost:8899' });
        rerender();

        expect(result.current).toEqual({ status: 'loading' });
    });

    it('should share one queue per cluster', async () => {
        mocks.fetchRawTransaction.mockResolvedValue({ messageBytes: MESSAGE_BYTES });
        mocks.getCompiledInstructionSummaries.mockReturnValue(SUMMARIES);

        // The module keeps each cluster's queue across tests, so no other test may use these two URLs.
        mocks.useCluster.mockReturnValue({ url: 'https://api.mainnet-beta.solana.com' });
        const { result: mainnetRows, unmount } = renderHook(
            () => [useRowTransaction('sig-1').status, useRowTransaction('sig-2').status],
            { wrapper },
        );
        await waitForHook(() => expect(mainnetRows.current).toEqual(['loaded', 'loaded']));
        unmount();

        mocks.useCluster.mockReturnValue({ url: 'https://api.testnet.solana.com' });
        const { result: testnetRow } = renderHook(() => useRowTransaction('sig-3').status, { wrapper });
        await waitForHook(() => expect(testnetRow.current).toBe('loaded'));

        expect(mocks.createRateLimitedQueue).toHaveBeenCalledTimes(2);
    });
});

function failedState(state: RowTransactionState): { retry: () => void } {
    if (state.status !== 'failed') throw new Error(`expected failed, got ${state.status}`);
    return state;
}
