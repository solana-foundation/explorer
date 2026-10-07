// @vitest-environment jsdom

import { toConnectableUrl } from '@entities/cluster';
import { getCookie, setCookie } from '@features/cookie';
import { act, renderHook } from '@testing-library/react';
import { Cluster, clusterName, clusterSelection, ClusterStatus, clusterUrl } from '@utils/cluster';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCluster } from '@/app/providers/cluster';

import { useMainnetConfirmation } from '../use-mainnet-confirmation';

vi.mock('@/app/providers/cluster');
vi.mock('@features/cookie');

describe('useMainnetConfirmation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getCookie).mockReturnValue(null);
    });

    describe('when cluster is Mainnet Beta', () => {
        it('should require confirmation before executing action', async () => {
            setup();

            const mockAction = vi.fn(async () => {});

            const { result } = renderHook(() => useMainnetConfirmation());

            expect(result.current.hasPendingAction).toBe(false);
            expect(result.current.isOpen).toBe(false);

            await act(async () => {
                await result.current.requireConfirmation(mockAction, { test: 'context' });
            });

            expect(result.current.hasPendingAction).toBe(true);
            expect(result.current.isOpen).toBe(true);
            expect(mockAction).not.toHaveBeenCalled();

            await act(async () => {
                await result.current.confirm();
            });

            expect(mockAction).toHaveBeenCalledTimes(1);
            expect(result.current.hasPendingAction).toBe(false);
            expect(result.current.isOpen).toBe(false);
        });

        it('should cancel and not execute action when cancel is called', async () => {
            setup();

            const mockAction = vi.fn(async () => {
                // Action should not be called
            });

            const { result } = renderHook(() => useMainnetConfirmation());

            await act(async () => {
                await result.current.requireConfirmation(mockAction);
            });

            expect(result.current.hasPendingAction).toBe(true);
            expect(result.current.isOpen).toBe(true);

            act(() => {
                result.current.cancel();
            });

            expect(mockAction).not.toHaveBeenCalled();
            expect(setCookie).not.toHaveBeenCalled();
            expect(result.current.hasPendingAction).toBe(false);
            expect(result.current.isOpen).toBe(false);
        });
    });

    describe('when cluster is not MainnetBeta', () => {
        it.each([
            { action: async () => {}, cluster: Cluster.Devnet, kind: 'async', name: 'Devnet' },
            { action: async () => {}, cluster: Cluster.Testnet, kind: 'async', name: 'Testnet' },
            { action: () => {}, cluster: Cluster.Devnet, kind: 'sync', name: 'Devnet' },
        ])('should execute $kind action immediately without confirmation for $name', async ({ action, cluster }) => {
            setup(cluster);
            const mockAction = vi.fn(action);

            const { result } = renderHook(() => useMainnetConfirmation());

            await act(async () => {
                await result.current.requireConfirmation(mockAction);
            });

            expect(mockAction).toHaveBeenCalledTimes(1);
            expect(result.current.hasPendingAction).toBe(false);
            expect(result.current.isOpen).toBe(false);
        });
    });

    describe('edge cases', () => {
        it('should handle multiple requireConfirmation calls by replacing pending action', async () => {
            setup();

            const firstAction = vi.fn(async () => {
                // First action should not be called
            });
            const secondAction = vi.fn(async () => {
                // Second action should be called
            });

            const { result } = renderHook(() => useMainnetConfirmation());

            await act(async () => {
                await result.current.requireConfirmation(firstAction);
            });

            expect(result.current.hasPendingAction).toBe(true);

            await act(async () => {
                await result.current.requireConfirmation(secondAction);
            });

            expect(result.current.hasPendingAction).toBe(true);

            await act(async () => {
                await result.current.confirm();
            });

            expect(firstAction).not.toHaveBeenCalled();
            expect(secondAction).toHaveBeenCalledTimes(1);
        });

        it('should handle confirm being called when no pending action exists', async () => {
            setup();

            const { result } = renderHook(() => useMainnetConfirmation());

            await act(async () => {
                await result.current.confirm();
            });

            expect(result.current.hasPendingAction).toBe(false);
            expect(result.current.isOpen).toBe(false);
        });

        it('should handle action errors gracefully', async () => {
            setup();

            const errorAction = vi.fn(async () => {
                throw new Error('Action failed');
            });

            const { result } = renderHook(() => useMainnetConfirmation());

            await act(async () => {
                await result.current.requireConfirmation(errorAction);
            });

            await act(async () => {
                try {
                    await result.current.confirm();
                } catch {
                    // Expected error from action
                }
            });

            expect(errorAction).toHaveBeenCalledTimes(1);
            expect(result.current.hasPendingAction).toBe(false);
            expect(result.current.isOpen).toBe(false);
        });
    });

    describe('cookie persistence', () => {
        it('should set disclaimer cookie when user confirms', async () => {
            setup();

            const mockAction = vi.fn();
            const { result } = renderHook(() => useMainnetConfirmation());

            await act(async () => {
                await result.current.requireConfirmation(mockAction);
            });

            await act(async () => {
                await result.current.confirm();
            });

            expect(setCookie).toHaveBeenCalledWith('idl_mainnet_accepted', 'true', 182 * 24 * 60 * 60);
        });

        it('should skip dialog on mainnet when disclaimer cookie exists', async () => {
            setup();
            vi.mocked(getCookie).mockReturnValue('true');

            const mockAction = vi.fn();
            const { result } = renderHook(() => useMainnetConfirmation());

            await act(async () => {
                await result.current.requireConfirmation(mockAction);
            });

            expect(mockAction).toHaveBeenCalledTimes(1);
            expect(result.current.hasPendingAction).toBe(false);
            expect(result.current.isOpen).toBe(false);
        });
    });
});

function setup(cluster: Cluster = Cluster.MainnetBeta) {
    const selection = clusterSelection(cluster);
    vi.mocked(useCluster).mockReturnValue({
        ...selection,
        connectableUrl: toConnectableUrl(clusterUrl(selection)),
        name: clusterName(cluster),
        selection,
        status: ClusterStatus.Connected,
        url: clusterUrl(selection),
    });
}
