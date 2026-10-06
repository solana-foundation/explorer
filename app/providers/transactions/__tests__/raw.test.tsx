import { ActionType, type Dispatch, FetchStatus } from '@providers/cache';
import { renderHook } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { waitForHook } from '@/app/__tests__/swr-hook';
import { Logger } from '@/app/shared/lib/logger';

import { type Details, DispatchContext, useFetchRawTransaction } from '../raw';

const MOCK_URL = 'https://api.mainnet-beta.solana.com';

let mockCluster = Cluster.MainnetBeta;
vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ cluster: mockCluster, url: MOCK_URL }),
}));

const fetchRawTransaction = vi.fn();
vi.mock('@entities/transaction-data', () => ({
    fetchRawTransaction: (...args: unknown[]) => fetchRawTransaction(...args),
}));

const dispatch = vi.fn();
function wrapper({ children }: { children: React.ReactNode }) {
    return <DispatchContext.Provider value={dispatch as Dispatch<Details>}>{children}</DispatchContext.Provider>;
}

beforeEach(() => {
    vi.clearAllMocks();
    mockCluster = Cluster.MainnetBeta;
});

describe('useFetchRawTransaction', () => {
    it('should dispatch FetchFailed when the fetch throws', async () => {
        fetchRawTransaction.mockRejectedValue(new Error('rpc boom'));
        const { result } = renderHook(() => useFetchRawTransaction(), { wrapper });

        result.current('sig', 'confirmed');

        await waitForHook(() =>
            expect(dispatch).toHaveBeenCalledWith({
                key: 'sig',
                status: FetchStatus.FetchFailed,
                type: ActionType.Update,
                url: MOCK_URL,
            }),
        );
        // FetchFailed dispatch carries no data field — consumers read defensively via optional chaining.
        const failedAction = dispatch.mock.calls
            .map(([action]) => action)
            .find(action => action.status === FetchStatus.FetchFailed);
        expect(failedAction).toBeDefined();
        expect(failedAction).not.toHaveProperty('data');
        expect(vi.mocked(Logger.error)).toHaveBeenCalledWith(expect.any(Error), { url: MOCK_URL });
    });

    it.each(['confirmed', undefined] as const)(
        'should pass the %s commitment through to the fetch',
        async commitment => {
            fetchRawTransaction.mockResolvedValue(null);
            const { result } = renderHook(() => useFetchRawTransaction(), { wrapper });

            result.current('sig', commitment);

            await waitForHook(() => expect(fetchRawTransaction).toHaveBeenCalledWith(MOCK_URL, 'sig', commitment));
        },
    );

    it('should dispatch the fetched transaction', async () => {
        const raw = { messageBytes: new Uint8Array([1, 2, 3]), signatures: ['sig'], version: 1 };
        fetchRawTransaction.mockResolvedValue(raw);
        const { result } = renderHook(() => useFetchRawTransaction(), { wrapper });

        result.current('sig');

        await waitForHook(() =>
            expect(dispatch).toHaveBeenCalledWith({
                data: { raw },
                key: 'sig',
                status: FetchStatus.Fetched,
                type: ActionType.Update,
                url: MOCK_URL,
            }),
        );
    });

    it('should not log to Sentry on a custom cluster, but still dispatch FetchFailed', async () => {
        mockCluster = Cluster.Custom;
        fetchRawTransaction.mockRejectedValue(new Error('rpc boom'));
        const { result } = renderHook(() => useFetchRawTransaction(), { wrapper });

        result.current('sig', 'confirmed');

        await waitForHook(() =>
            expect(dispatch).toHaveBeenCalledWith(
                expect.objectContaining({ status: FetchStatus.FetchFailed, type: ActionType.Update }),
            ),
        );
        expect(vi.mocked(Logger.error)).not.toHaveBeenCalled();
    });
});
