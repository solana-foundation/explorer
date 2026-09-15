import { fetchTransactionDetails } from '@entities/transaction-data';
import { findTransactionCluster } from '@entities/transaction-data/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster, serverClusterUrl } from '@/app/utils/cluster';

import { mockSingleTransferTransaction } from '../../mocks/single-transfer';
import { getTx } from '../get-tx';

// Both halves of the read live in the entity now, on separate barrels: the transaction fetch on the
// universal `index.ts`, the cluster probe on the server-only one.
vi.mock('@entities/transaction-data', () => ({ fetchTransactionDetails: vi.fn() }));
vi.mock('@entities/transaction-data/server', () => ({ findTransactionCluster: vi.fn() }));

// Mutable so one case can turn the probe flag off. `vi.mock` is hoisted, so the object has to be hoisted too.
const env = vi.hoisted(() => ({ isClusterProbeEnabled: true }));
vi.mock('../../env', () => env);

describe('getTx', () => {
    const mockSignature = '5yKzCuw1e9d58HcnzSL31cczfXUux2H4Ga5TAR2RcQLE5W8BiTAC9x9MvhLtc4h99sC9XxLEAjhrXyfKezdMkZFV';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        env.isClusterProbeEnabled = true;

        vi.mocked(findTransactionCluster).mockResolvedValue({ kind: 'not-found' });
    });

    describe('successful cases', () => {
        it('should return transaction and cluster when the probe finds mainnet', async () => {
            vi.mocked(findTransactionCluster).mockResolvedValue({ cluster: Cluster.MainnetBeta, kind: 'found' });
            vi.mocked(fetchTransactionDetails).mockResolvedValueOnce(mockSingleTransferTransaction);

            const result = await getTx(mockSignature);

            expect(result).toEqual({
                cluster: Cluster.MainnetBeta,
                transaction: mockSingleTransferTransaction,
            });
            expect(fetchTransactionDetails).toHaveBeenCalledTimes(1);
            expect(fetchTransactionDetails).toHaveBeenCalledWith(serverClusterUrl(Cluster.MainnetBeta), mockSignature);
        });

        it('should return transaction and cluster when the probe finds devnet', async () => {
            vi.mocked(findTransactionCluster).mockResolvedValue({ cluster: Cluster.Devnet, kind: 'found' });
            vi.mocked(fetchTransactionDetails).mockResolvedValueOnce(mockSingleTransferTransaction);

            const result = await getTx(mockSignature);

            expect(result).toEqual({
                cluster: Cluster.Devnet,
                transaction: mockSingleTransferTransaction,
            });
            expect(fetchTransactionDetails).toHaveBeenCalledTimes(1);
            expect(fetchTransactionDetails).toHaveBeenCalledWith(serverClusterUrl(Cluster.Devnet), mockSignature);
        });

        it('should skip the probe when the caller already knows the cluster', async () => {
            vi.mocked(fetchTransactionDetails).mockResolvedValueOnce(mockSingleTransferTransaction);

            const result = await getTx(mockSignature, undefined, Cluster.Devnet);

            expect(result.cluster).toBe(Cluster.Devnet);
            expect(findTransactionCluster).not.toHaveBeenCalled();
        });
    });

    // The cluster list is the whole of receipt's probe policy now that the entity owns no flag, so these two
    // cases are what holds receipt's behaviour identical across the lift.
    describe('cluster probing', () => {
        it('should probe mainnet first and then the fallback clusters', async () => {
            await expect(getTx(mockSignature)).rejects.toThrow('Cluster not found');

            expect(findTransactionCluster).toHaveBeenCalledWith(
                [Cluster.MainnetBeta, Cluster.Devnet, Cluster.Testnet],
                mockSignature,
            );
        });

        it('should probe mainnet only when cluster probing is disabled', async () => {
            env.isClusterProbeEnabled = false;

            await expect(getTx(mockSignature)).rejects.toThrow('Cluster not found');

            expect(findTransactionCluster).toHaveBeenCalledWith([Cluster.MainnetBeta], mockSignature);
        });
    });

    describe('error handling', () => {
        it('should throw error when cluster is not found', async () => {
            await expect(getTx(mockSignature)).rejects.toThrow('Cluster not found');

            expect(fetchTransactionDetails).not.toHaveBeenCalled();
        });

        it('should throw error when transaction is not found', async () => {
            vi.mocked(findTransactionCluster).mockResolvedValue({ cluster: Cluster.MainnetBeta, kind: 'found' });
            vi.mocked(fetchTransactionDetails).mockResolvedValueOnce(null);

            await expect(getTx(mockSignature)).rejects.toSatisfy((error: Error) => {
                return (
                    error.message === 'Failed to fetch transaction' &&
                    error.cause instanceof Error &&
                    error.cause.message === 'Transaction not found'
                );
            });
        });

        it('should throw error when the transaction fetch throws an error', async () => {
            vi.mocked(findTransactionCluster).mockResolvedValue({ cluster: Cluster.MainnetBeta, kind: 'found' });

            const fetchError = new Error('Failed to fetch');
            vi.mocked(fetchTransactionDetails).mockRejectedValueOnce(fetchError);

            await expect(getTx(mockSignature)).rejects.toSatisfy((error: Error) => {
                return error.message === 'Failed to fetch transaction' && error.cause === fetchError;
            });
        });

        it('should throw immediately on mainnet network error', async () => {
            const probeError = new Error('Forbidden access');
            vi.mocked(findTransactionCluster).mockResolvedValue({
                cluster: Cluster.MainnetBeta,
                error: probeError,
                kind: 'error',
            });

            await expect(getTx(mockSignature)).rejects.toSatisfy((error: Error) => {
                return error.message === 'Failed to check the mainnet-beta' && error.cause === probeError;
            });
            expect(fetchTransactionDetails).not.toHaveBeenCalled();
        });

        it('should throw on probe cluster network error', async () => {
            vi.mocked(findTransactionCluster).mockResolvedValue({
                cluster: Cluster.Devnet,
                error: new Error('Network error'),
                kind: 'error',
            });

            await expect(getTx(mockSignature)).rejects.toThrow('Failed to check the devnet');
            expect(fetchTransactionDetails).not.toHaveBeenCalled();
        });
    });
});
