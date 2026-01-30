import { Connection } from '@solana/web3.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { mockSingleTransferTransaction } from '../../mocks/single-transfer';
import { getTx } from '../get-tx';

vi.mock('@solana/web3.js', async () => {
    const actual = await vi.importActual('@solana/web3.js');
    return {
        ...actual,
        Connection: vi.fn(),
    };
});

describe('getTx', () => {
    const mockSignature = '5yKzCuw1e9d58HcnzSL31cczfXUux2H4Ga5TAR2RcQLE5W8BiTAC9x9MvhLtc4h99sC9XxLEAjhrXyfKezdMkZFV';

    let mockConnection: {
        getSignatureStatus: ReturnType<typeof vi.fn>;
        getParsedTransaction: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});

        mockConnection = {
            getParsedTransaction: vi.fn(),
            getSignatureStatus: vi.fn(),
        };

        vi.mocked(Connection).mockImplementation(() => mockConnection as unknown as Connection);
    });

    describe('successful cases', () => {
        it('should return transaction and cluster when found', async () => {
            mockConnection.getSignatureStatus.mockResolvedValueOnce({
                value: {
                    confirmationStatus: 'confirmed',
                    slot: 12345,
                },
            });

            mockConnection.getParsedTransaction.mockResolvedValueOnce(mockSingleTransferTransaction);

            const result = await getTx(mockSignature);

            expect(result).toEqual({
                cluster: Cluster.MainnetBeta,
                transaction: mockSingleTransferTransaction,
            });
            expect(mockConnection.getSignatureStatus).toHaveBeenCalledTimes(1);
            expect(mockConnection.getParsedTransaction).toHaveBeenCalledTimes(1);
        });

        it('should return transaction and cluster when found on devnet', async () => {
            mockConnection.getSignatureStatus.mockResolvedValueOnce({ value: null }).mockResolvedValueOnce({
                value: {
                    confirmationStatus: 'confirmed',
                    slot: 67890,
                },
            });

            mockConnection.getParsedTransaction.mockResolvedValueOnce(mockSingleTransferTransaction);

            const result = await getTx(mockSignature);

            expect(result).toEqual({
                cluster: Cluster.Devnet,
                transaction: mockSingleTransferTransaction,
            });
            expect(mockConnection.getSignatureStatus).toHaveBeenCalledTimes(2);
            expect(mockConnection.getParsedTransaction).toHaveBeenCalledTimes(1);
        });
    });

    describe('error handling', () => {
        it('should throw error when cluster is not found', async () => {
            mockConnection.getSignatureStatus.mockResolvedValue({
                value: null,
            });

            await expect(getTx(mockSignature)).rejects.toThrow('Cluster not found');

            expect(mockConnection.getSignatureStatus).toHaveBeenCalledTimes(3);
        });

        it('should throw error when transaction is not found', async () => {
            mockConnection.getSignatureStatus.mockResolvedValue({
                value: {
                    confirmationStatus: 'confirmed',
                    slot: 12345,
                },
            });

            mockConnection.getParsedTransaction.mockResolvedValueOnce(null);
            mockConnection.getParsedTransaction.mockResolvedValueOnce(null);

            await expect(getTx(mockSignature)).rejects.toSatisfy((error: Error) => {
                return (
                    error.message === 'Failed to fetch transaction' &&
                    error.cause instanceof Error &&
                    error.cause.message === 'Transaction not found'
                );
            });
        });

        it('should throw error when getParsedTransaction throws an error', async () => {
            mockConnection.getSignatureStatus.mockResolvedValue({
                value: {
                    confirmationStatus: 'confirmed',
                    slot: 12345,
                },
            });

            const fetchError = new Error('Failed to fetch');
            mockConnection.getParsedTransaction.mockRejectedValueOnce(fetchError);

            await expect(getTx(mockSignature)).rejects.toSatisfy((error: Error) => {
                return error.message === 'Failed to fetch transaction' && error.cause === fetchError;
            });
        });

        it('should handle errors from multiple clusters gracefully', async () => {
            mockConnection.getSignatureStatus.mockRejectedValueOnce(new Error('Forbidden access'));
            mockConnection.getSignatureStatus.mockRejectedValueOnce(new Error('Network error'));
            mockConnection.getSignatureStatus.mockResolvedValueOnce({
                value: null,
            });

            await expect(getTx(mockSignature)).rejects.toThrow('Cluster not found');
        });
    });

    it('should check all clusters', async () => {
        mockConnection.getSignatureStatus.mockResolvedValue({
            value: null,
        });

        await expect(getTx(mockSignature)).rejects.toThrow('Cluster not found');

        expect(Connection).toHaveBeenCalledTimes(3);
        expect(mockConnection.getSignatureStatus).toHaveBeenCalledTimes(3);
    });
});
