import { act, renderHook, waitFor } from '@testing-library/react';
import { Cluster } from '@utils/cluster';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMainnetConfirmation } from './use-mainnet-confirmation';

const mockUseCluster = vi.fn();
vi.mock('@/app/providers/cluster', () => ({
    useCluster: () => mockUseCluster(),
}));

describe('useMainnetConfirmation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when cluster is Mainnet Beta', () => {
        it('should require confirmation before executing action', async () => {
            setup();

            const mockAction = vi.fn(async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
            });

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

            await waitFor(() => {
                expect(mockAction).toHaveBeenCalledTimes(1);
            });

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
            expect(result.current.hasPendingAction).toBe(false);
            expect(result.current.isOpen).toBe(false);
        });

        it('should store context with pending action', async () => {
            setup();

            const testContext = { instructionName: 'test', params: { foo: 'bar' } };
            const mockAction = vi.fn(async () => {
                // Action executed
            });

            const { result } = renderHook(() => useMainnetConfirmation<typeof testContext>());

            await act(async () => {
                await result.current.requireConfirmation(mockAction, testContext);
            });

            expect(result.current.hasPendingAction).toBe(true);
            await act(async () => {
                await result.current.confirm();
            });

            expect(mockAction).toHaveBeenCalledTimes(1);
        });
    });

    describe('when cluster is not MainnetBeta', () => {
        it('should execute action immediately without confirmation for Devnet', async () => {
            setup(Cluster.Devnet);

            const mockAction = vi.fn(async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
            });

            const { result } = renderHook(() => useMainnetConfirmation());

            await act(async () => {
                await result.current.requireConfirmation(mockAction);
            });

            await waitFor(() => {
                expect(mockAction).toHaveBeenCalledTimes(1);
            });

            expect(result.current.hasPendingAction).toBe(false);
            expect(result.current.isOpen).toBe(false);
        });

        it('should execute action immediately without confirmation for Testnet', async () => {
            setup(Cluster.Testnet);

            const mockAction = vi.fn(async () => {
                // Action executed immediately
            });

            const { result } = renderHook(() => useMainnetConfirmation());

            await act(async () => {
                await result.current.requireConfirmation(mockAction);
            });

            expect(mockAction).toHaveBeenCalledTimes(1);
            expect(result.current.hasPendingAction).toBe(false);
            expect(result.current.isOpen).toBe(false);
        });

        it('should handle synchronous actions immediately', async () => {
            setup(Cluster.Devnet);

            const mockAction = vi.fn(() => {
                // Synchronous action executed
            });

            const { result } = renderHook(() => useMainnetConfirmation());

            await act(async () => {
                await result.current.requireConfirmation(mockAction);
            });

            expect(mockAction).toHaveBeenCalledTimes(1);
            expect(result.current.hasPendingAction).toBe(false);
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
});

function setup(cluster: Cluster = Cluster.MainnetBeta) {
    const clusterConfig = {
        [Cluster.MainnetBeta]: {
            name: 'Mainnet Beta',
            url: 'https://api.mainnet-beta.solana.com',
        },
        [Cluster.Devnet]: {
            name: 'Devnet',
            url: 'https://api.devnet.solana.com',
        },
        [Cluster.Testnet]: {
            name: 'Testnet',
            url: 'https://api.testnet.solana.com',
        },
        [Cluster.Custom]: {
            name: 'Custom',
            url: 'http://localhost:8899',
        },
    };

    const config = clusterConfig[cluster];

    mockUseCluster.mockReturnValue({
        cluster,
        clusterInfo: undefined,
        customUrl: '',
        name: config.name,
        status: 'connected',
        url: config.url,
    });
}
