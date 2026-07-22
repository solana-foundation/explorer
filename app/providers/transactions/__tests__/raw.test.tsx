import { ActionType, type Dispatch, FetchStatus } from '@providers/cache';
import { renderHook, waitFor } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type Details, DispatchContext, useFetchRawTransaction } from '../raw';

const MOCK_URL = 'https://api.mainnet-beta.solana.com';

let mockCluster = Cluster.MainnetBeta;
vi.mock('@providers/cluster', () => ({
    useCluster: () => ({ cluster: mockCluster, url: MOCK_URL }),
}));

// Silence Sentry; non-custom clusters call Logger.error in the catch block.
const loggerError = vi.fn();
vi.mock('@/app/shared/lib/logger', () => ({ Logger: { error: (...args: unknown[]) => loggerError(...args) } }));

const getTransaction = vi.fn();
vi.mock('@solana/web3.js', async () => {
    const actual = await vi.importActual<typeof import('@solana/web3.js')>('@solana/web3.js');
    return {
        ...actual,
        Connection: vi.fn().mockImplementation(function () {
            return { getTransaction: (...args: unknown[]) => getTransaction(...args) };
        }),
    };
});

const dispatch = vi.fn();
function wrapper({ children }: { children: React.ReactNode }) {
    return <DispatchContext.Provider value={dispatch as Dispatch<Details>}>{children}</DispatchContext.Provider>;
}

beforeEach(() => {
    vi.clearAllMocks();
    mockCluster = Cluster.MainnetBeta;
});

describe('useFetchRawTransaction', () => {
    it('should dispatch FetchFailed when getTransaction throws', async () => {
        getTransaction.mockRejectedValue(new Error('rpc boom'));
        const { result } = renderHook(() => useFetchRawTransaction(), { wrapper });

        result.current('sig', 'confirmed');

        await waitFor(() =>
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
    });

    it('should thread the commitment through to getTransaction', async () => {
        getTransaction.mockResolvedValue(null);
        const { result } = renderHook(() => useFetchRawTransaction(), { wrapper });

        result.current('sig', 'confirmed');

        await waitFor(() =>
            expect(getTransaction).toHaveBeenCalledWith('sig', {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0,
            }),
        );
    });

    it('should pass undefined commitment by default (unchanged behavior for existing callers)', async () => {
        getTransaction.mockResolvedValue(null);
        const { result } = renderHook(() => useFetchRawTransaction(), { wrapper });

        result.current('sig');

        await waitFor(() =>
            expect(getTransaction).toHaveBeenCalledWith('sig', {
                commitment: undefined,
                maxSupportedTransactionVersion: 0,
            }),
        );
    });

    it('should not log to Sentry on a custom cluster, but still dispatch FetchFailed', async () => {
        mockCluster = Cluster.Custom;
        getTransaction.mockRejectedValue(new Error('rpc boom'));
        const { result } = renderHook(() => useFetchRawTransaction(), { wrapper });

        result.current('sig', 'confirmed');

        await waitFor(() =>
            expect(dispatch).toHaveBeenCalledWith(
                expect.objectContaining({ status: FetchStatus.FetchFailed, type: ActionType.Update }),
            ),
        );
        expect(loggerError).not.toHaveBeenCalled();
    });
});
