import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FAST_RETRY, settleRetries, swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';

const mocks = vi.hoisted(() => ({
    fetchRawTransaction: vi.fn(),
    getCompiledInstructionSummaries: vi.fn(),
}));

vi.mock('@entities/transaction-data', () => ({
    fetchRawTransaction: mocks.fetchRawTransaction,
    getCompiledInstructionSummaries: mocks.getCompiledInstructionSummaries,
}));
vi.mock('@providers/cluster', () => ({ useCluster: () => ({ url: 'https://api.devnet.solana.com' }) }));
// withBackoff would retry a rejected fetch on its own and use up the queued `*Once` results.
vi.mock('@utils/with-backoff', () => ({ withBackoff: (fn: () => Promise<unknown>) => fn() }));

import { type RowTransactionState, useRowTransaction } from '../use-row-transaction';

const wrapper = swrWrapper({ ...FAST_RETRY, dedupingInterval: 0 });

const MESSAGE_BYTES = new Uint8Array([1, 2, 3]);
const SUMMARIES = [{ name: 'Transfer', programName: 'System Program' }];
// The first attempt and the three automatic retries.
const ATTEMPTS_PER_CHAIN = 4;

// A fetch left pending holds the module-wide queue slot, so every test releases its own.
let releasePending: ((raw: null) => void) | undefined;

afterEach(async () => {
    releasePending?.(null);
    releasePending = undefined;
    await settleRetries();
    vi.resetAllMocks();
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
        mocks.fetchRawTransaction.mockReturnValueOnce(new Promise(resolve => (releasePending = resolve)));
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
});

function failedState(state: RowTransactionState): { retry: () => void } {
    if (state.status !== 'failed') throw new Error(`expected failed, got ${state.status}`);
    return state;
}
