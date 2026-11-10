import { act, render, renderHook } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createRootWithoutAct } from '@/app/__tests__/root-without-act';
import { settleRetries, swrWrapper, waitForHook } from '@/app/__tests__/swr-hook';

import { type RowTransactionState, useRowTransaction } from '../use-row-transaction';

const mocks = vi.hoisted(() => ({
    fetchRawTransaction: vi.fn(),
    getCompiledInstructionSummaries: vi.fn(() => []),
    logWarning: vi.fn(),
    useCluster: vi.fn(),
}));

vi.mock('@entities/transaction-data', () => ({
    fetchRawTransaction: mocks.fetchRawTransaction,
    getCompiledInstructionSummaries: mocks.getCompiledInstructionSummaries,
}));
vi.mock('@providers/cluster', () => ({ useCluster: mocks.useCluster }));
vi.mock('@/app/shared/lib/logger', () => ({ Logger: { warn: mocks.logWarning } }));

const MESSAGE_BYTES = new Uint8Array([1, 2, 3]);

afterEach(() => {
    vi.resetAllMocks();
    vi.useRealTimers();
});

describe('useRowTransaction with the rate-limited queue', () => {
    it('should start at most 12 row fetches in 10 s', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'Date'] });
        setClusterUrl('https://budget.queue.test');
        mocks.fetchRawTransaction.mockResolvedValue({ messageBytes: MESSAGE_BYTES });
        const Swr = swrWrapper({ dedupingInterval: 0 });
        const signatures = Array.from({ length: 13 }, (_, index) => `row-${index}`);

        render(
            <Swr>
                {signatures.map(signature => (
                    <Row key={signature} signature={signature} statuses={[]} />
                ))}
            </Swr>,
        );
        await act(() => vi.advanceTimersByTimeAsync(9_999));
        expect(mocks.fetchRawTransaction).toHaveBeenCalledTimes(12);
        await act(() => vi.advanceTimersByTimeAsync(1));

        expect(mocks.fetchRawTransaction).toHaveBeenCalledTimes(13);
    });

    it('should fetch a row that mounts offscreen and then becomes visible', async () => {
        setClusterUrl('https://offscreen.queue.test');
        mocks.fetchRawTransaction.mockResolvedValue({ messageBytes: MESSAGE_BYTES });

        const { rerender, result } = renderHook(({ enabled }) => useRowTransaction('offscreen', enabled), {
            initialProps: { enabled: false },
            wrapper: swrWrapper({ dedupingInterval: 0 }),
        });
        rerender({ enabled: true });

        await waitForHook(() => expect(result.current.status).toBe('loaded'));
    });

    it('should not fetch a row that unmounts while it waits in the queue', async () => {
        setClusterUrl('https://unmount.queue.test');
        const releaseBlocker = blockFetchOf('blocker');
        const wrapper = swrWrapper({ dedupingInterval: 0 });

        const { result: blocker } = renderHook(() => useRowTransaction('blocker'), { wrapper });
        const { unmount } = renderHook(() => useRowTransaction('left'), { wrapper });
        await waitForHook(() => expect(mocks.fetchRawTransaction).toHaveBeenCalledOnce());
        unmount();
        releaseBlocker();
        await waitForHook(() => expect(blocker.current.status).toBe('loaded'));
        await settleRetries();

        expect(mocks.fetchRawTransaction.mock.calls.map(([, signature]) => signature)).toEqual(['blocker']);
        expect(mocks.logWarning).not.toHaveBeenCalled();
    });

    it('should load a row that remounts while its first fetch waits in the queue', async () => {
        setClusterUrl('https://remount.queue.test');
        const releaseBlocker = blockFetchOf('blocker');
        const cache = new Map();
        const wrapper = swrWrapper({ provider: () => cache });

        renderHook(() => useRowTransaction('blocker'), { wrapper });
        const { unmount: unmountFirst } = renderHook(() => useRowTransaction('kept'), { wrapper });
        await waitForHook(() => expect(mocks.fetchRawTransaction).toHaveBeenCalledOnce());
        unmountFirst();
        const { result: remounted } = renderHook(() => useRowTransaction('kept'), { wrapper });
        releaseBlocker();

        await waitForHook(() => expect(remounted.current.status).toBe('loaded'));
        expect(mocks.fetchRawTransaction).toHaveBeenCalledTimes(2);
    });

    it('should fetch a row once under StrictMode', async () => {
        setClusterUrl('https://strict.queue.test');
        mocks.fetchRawTransaction.mockResolvedValue({ messageBytes: MESSAGE_BYTES });
        const Swr = swrWrapper();
        const statuses: RowTransactionState['status'][] = [];

        render(
            <StrictMode>
                <Swr>
                    <Row signature="strict" statuses={statuses} />
                </Swr>
            </StrictMode>,
        );

        await waitForHook(() => expect(statuses.at(-1)).toBe('loaded'));
        expect(mocks.fetchRawTransaction).toHaveBeenCalledOnce();
    });

    it('should fetch a row that mounts into an idle queue, rendered without act', async () => {
        setClusterUrl('https://idle.queue.test');
        mocks.fetchRawTransaction.mockResolvedValue({ messageBytes: MESSAGE_BYTES });
        const Swr = swrWrapper();
        const statuses: RowTransactionState['status'][] = [];

        createRootWithoutAct().render(
            <Swr>
                <Row signature="idle" statuses={statuses} />
            </Swr>,
        );

        await vi.waitFor(() => expect(statuses.at(-1)).toBe('loaded'));
    });
});

function Row({ signature, statuses }: { signature: string; statuses: RowTransactionState['status'][] }) {
    statuses.push(useRowTransaction(signature).status);
    return null;
}

function setClusterUrl(url: string): void {
    mocks.useCluster.mockReturnValue({ url });
}

function blockFetchOf(blockedSignature: string): () => void {
    let release!: () => void;
    const blocked = new Promise<void>(resolve => (release = resolve));
    mocks.fetchRawTransaction.mockImplementation(async (_url: string, signature: string) => {
        if (signature === blockedSignature) await blocked;
        return { messageBytes: MESSAGE_BYTES };
    });
    return release;
}
