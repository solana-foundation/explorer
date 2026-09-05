import { fetchTransactionDetails } from '@entities/transaction-data/api/fetch-transaction-details';
import { createSolanaRpc } from '@solana/kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster, serverClusterUrl } from '@/app/utils/cluster';

import { mockSingleTransferTransaction } from '../../mocks/single-transfer';
import { getTx } from '../get-tx';

vi.mock('@entities/transaction-data/api/fetch-transaction-details', () => ({
    fetchTransactionDetails: vi.fn(),
}));

vi.mock('../../env', () => ({
    isClusterProbeEnabled: true,
}));

describe('getTx', () => {
    const mockSignature = '5yKzCuw1e9d58HcnzSL31cczfXUux2H4Ga5TAR2RcQLE5W8BiTAC9x9MvhLtc4h99sC9XxLEAjhrXyfKezdMkZFV';

    let mockGetSignatureStatuses: ReturnType<typeof vi.fn>;

    function statusResponse(found: boolean) {
        return {
            send: vi.fn().mockResolvedValue({
                value: [found ? { confirmationStatus: 'confirmed', slot: 12345n } : null],
            }),
        };
    }

    function statusFailure(error: Error) {
        return { send: vi.fn().mockRejectedValue(error) };
    }

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});

        mockGetSignatureStatuses = vi.fn();
        vi.mocked(createSolanaRpc).mockReturnValue({
            getSignatureStatuses: mockGetSignatureStatuses,
        } as unknown as ReturnType<typeof createSolanaRpc>);
    });

    describe('successful cases', () => {
        it('should return transaction and cluster when found', async () => {
            mockGetSignatureStatuses.mockReturnValueOnce(statusResponse(true));
            vi.mocked(fetchTransactionDetails).mockResolvedValueOnce(mockSingleTransferTransaction);

            const result = await getTx(mockSignature);

            expect(result).toEqual({
                cluster: Cluster.MainnetBeta,
                transaction: mockSingleTransferTransaction,
            });
            expect(mockGetSignatureStatuses).toHaveBeenCalledTimes(1);
            expect(mockGetSignatureStatuses).toHaveBeenCalledWith([mockSignature], {
                searchTransactionHistory: true,
            });
            expect(fetchTransactionDetails).toHaveBeenCalledTimes(1);
            expect(fetchTransactionDetails).toHaveBeenCalledWith(expect.any(String), mockSignature);
        });

        it('should return transaction and cluster when found on devnet', async () => {
            mockGetSignatureStatuses
                .mockReturnValueOnce(statusResponse(false))
                .mockReturnValueOnce(statusResponse(true));
            vi.mocked(fetchTransactionDetails).mockResolvedValueOnce(mockSingleTransferTransaction);

            const result = await getTx(mockSignature);

            expect(result).toEqual({
                cluster: Cluster.Devnet,
                transaction: mockSingleTransferTransaction,
            });
            expect(mockGetSignatureStatuses).toHaveBeenCalledTimes(2);
            expect(fetchTransactionDetails).toHaveBeenCalledTimes(1);
            expect(fetchTransactionDetails).toHaveBeenCalledWith(serverClusterUrl(Cluster.Devnet), mockSignature);
        });
    });

    describe('error handling', () => {
        it('should throw error when cluster is not found', async () => {
            mockGetSignatureStatuses.mockReturnValue(statusResponse(false));

            await expect(getTx(mockSignature)).rejects.toThrow('Cluster not found');

            expect(mockGetSignatureStatuses).toHaveBeenCalledTimes(3);
        });

        it('should not report a transaction as found when the status response is empty', async () => {
            mockGetSignatureStatuses.mockReturnValue({
                send: vi.fn().mockResolvedValue({ value: [] }),
            });

            await expect(getTx(mockSignature)).rejects.toThrow('Cluster not found');

            expect(mockGetSignatureStatuses).toHaveBeenCalledTimes(3);
            expect(fetchTransactionDetails).not.toHaveBeenCalled();
        });

        it('should throw error when transaction is not found', async () => {
            mockGetSignatureStatuses.mockReturnValue(statusResponse(true));
            vi.mocked(fetchTransactionDetails).mockResolvedValue(null);

            await expect(getTx(mockSignature)).rejects.toSatisfy((error: Error) => {
                return (
                    error.message === 'Failed to fetch transaction' &&
                    error.cause instanceof Error &&
                    error.cause.message === 'Transaction not found'
                );
            });
        });

        it('should throw error when the transaction fetch throws an error', async () => {
            mockGetSignatureStatuses.mockReturnValue(statusResponse(true));

            const fetchError = new Error('Failed to fetch');
            vi.mocked(fetchTransactionDetails).mockRejectedValueOnce(fetchError);

            await expect(getTx(mockSignature)).rejects.toSatisfy((error: Error) => {
                return error.message === 'Failed to fetch transaction' && error.cause === fetchError;
            });
        });

        it('should throw immediately on mainnet network error', async () => {
            mockGetSignatureStatuses.mockReturnValueOnce(statusFailure(new Error('Forbidden access')));

            await expect(getTx(mockSignature)).rejects.toThrow('Failed to check the mainnet-beta');
            expect(mockGetSignatureStatuses).toHaveBeenCalledTimes(1);
        });

        it('should throw on probe cluster network error', async () => {
            // Mainnet succeeds but tx not found
            mockGetSignatureStatuses.mockReturnValueOnce(statusResponse(false));
            // Devnet fails with network error
            mockGetSignatureStatuses.mockReturnValueOnce(statusFailure(new Error('Network error')));

            await expect(getTx(mockSignature)).rejects.toThrow('Failed to check the devnet');
            expect(mockGetSignatureStatuses).toHaveBeenCalledTimes(2);
        });
    });

    it('should check all clusters', async () => {
        mockGetSignatureStatuses.mockReturnValue(statusResponse(false));

        await expect(getTx(mockSignature)).rejects.toThrow('Cluster not found');

        expect(createSolanaRpc).toHaveBeenCalledTimes(3);
        expect(mockGetSignatureStatuses).toHaveBeenCalledTimes(3);
    });
});
