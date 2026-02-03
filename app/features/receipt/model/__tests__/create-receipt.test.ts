import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

import { getTokenInfo } from '../../api/get-token-info';
import { getTx } from '../../api/get-tx';
import { MULTISIG_AUTHORITY, RECEIVER } from '../../mocks/addresses';
import { mockCustomFeePayerTransaction } from '../../mocks/custom-fee-payer';
import { mockMultipleTransfersTransaction } from '../../mocks/multiple-transfers';
import { mockNoTransferTransaction } from '../../mocks/no-transfers';
import { mockSingleTransferTransaction } from '../../mocks/single-transfer';
import { mockToken2022TransferTransaction } from '../../mocks/token-2022-transfer';
import { mockToken2022Transfer2Transaction } from '../../mocks/token-2022-transfer2';
import { mockUsdcTransferTransaction } from '../../mocks/usdc-checked-transfer';
import { mockJitoOnlyTransferTransaction } from '../../mocks/jito-only-transfer';
import { mockUsdcJitoTransferTransaction } from '../../mocks/usdc-jito-transfer';
import { mockUsdcMultisigTransferTransaction } from '../../mocks/usdc-multisig-transfer';
import { mockUsdcRegularTransferTransaction } from '../../mocks/usdc-regular-transfer';
import { mockZeroTransferTransaction } from '../../mocks/zero-transfer';
import { createReceipt } from '../create-receipt';

vi.mock('../../api/get-tx');
vi.mock('../../api/get-token-info');

describe('createReceipt', () => {
    const mockSignature = '5yKzCuw1e9d58HcnzSL31cczfXUux2H4Ga5TAR2RcQLE5W8BiTAC9x9MvhLtc4h99sC9XxLEAjhrXyfKezdMkZFV';

    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
    });

    describe('SOL transfer receipts', () => {
        it('should create a formatted SOL transfer receipt for a single transfer', async () => {
            vi.mocked(getTx).mockResolvedValueOnce({
                cluster: Cluster.MainnetBeta,
                transaction: mockSingleTransferTransaction,
            });

            const result = await createReceipt(mockSignature);

            expect(result).toMatchObject({
                fee: {
                    formatted: '0.000005',
                    raw: 5000,
                },
                network: 'Mainnet Beta',
                receiver: {
                    truncated: '65MUM..L2Fhk',
                },
                sender: {
                    truncated: 'Hd3f3..R3bD5',
                },
                total: {
                    formatted: '0.3',
                    raw: 300000000,
                    unit: 'SOL',
                },
            });
            expect(result?.date).toBeDefined();
            expect(result?.date.timestamp).toBeDefined();
            expect(result?.date.utc).toBeDefined();
        });

        it('should return null for multiple SOL transfers', async () => {
            vi.mocked(getTx).mockResolvedValueOnce({
                cluster: Cluster.MainnetBeta,
                transaction: mockMultipleTransfersTransaction,
            });

            const result = await createReceipt(mockSignature);

            expect(result).toBeUndefined();
        });

        it('should return null for zero SOL transfer', async () => {
            vi.mocked(getTx).mockResolvedValueOnce({
                cluster: Cluster.MainnetBeta,
                transaction: mockZeroTransferTransaction,
            });

            const result = await createReceipt(mockSignature);

            expect(result).toBeUndefined();
        });

        it('should handle custom fee payer transaction', async () => {
            vi.mocked(getTx).mockResolvedValueOnce({
                cluster: Cluster.MainnetBeta,
                transaction: mockCustomFeePayerTransaction,
            });

            const result = await createReceipt(mockSignature);

            expect(result).toMatchObject({
                fee: {
                    formatted: '0.00001',
                    raw: 10000,
                },
                receiver: {
                    truncated: 'G2Gjo..N6wid',
                },
                sender: {
                    truncated: 'Hd3f3..R3bD5',
                },
                total: {
                    formatted: '0.5',
                    raw: 500000000,
                    unit: 'SOL',
                },
            });
        });

        it('should format receipt for different clusters', async () => {
            vi.mocked(getTx).mockResolvedValueOnce({
                cluster: Cluster.Devnet,
                transaction: mockSingleTransferTransaction,
            });

            const result = await createReceipt(mockSignature);

            expect(result).toMatchObject({
                network: 'Devnet',
            });
        });

        it('when transaction has USDC transferChecked and Jito SOL tip, creates SOL receipt for the tip', async () => {
            vi.mocked(getTx).mockResolvedValueOnce({
                cluster: Cluster.Devnet,
                transaction: mockUsdcJitoTransferTransaction,
            });

            const result = await createReceipt(mockSignature);

            expect(result).toMatchObject({
                fee: {
                    formatted: '0.000005',
                    raw: 5000,
                },
                network: 'Devnet',
                receiver: {
                    truncated: '65MUM..L2Fhk',
                },
                sender: {
                    truncated: 'Hd3f3..R3bD5',
                },
                total: {
                    formatted: '1',
                    raw: 1,
                    unit: 'TOKEN',
                },
            });
        });

        it('should return undefined for Jito-only SOL transfer', async () => {
            vi.mocked(getTx).mockResolvedValueOnce({
                cluster: Cluster.MainnetBeta,
                transaction: mockJitoOnlyTransferTransaction,
            });

            const result = await createReceipt(mockSignature);

            expect(result).toBeUndefined();
        });
    });

    describe('token transfer receipts', () => {
        it('should create a formatted token transfer receipt for transferChecked', async () => {
            const mockTokenInfo = {
                logoURI: 'https://example.com/usdc.png',
                symbol: 'USDC',
            };

            vi.mocked(getTx).mockResolvedValueOnce({
                cluster: Cluster.MainnetBeta,
                transaction: mockUsdcTransferTransaction,
            });
            vi.mocked(getTokenInfo).mockResolvedValueOnce(mockTokenInfo);

            const result = await createReceipt(mockSignature);

            expect(result).toMatchObject({
                fee: {
                    formatted: '0.000005',
                    raw: 5000,
                },
                network: 'Mainnet Beta',
                receiver: {
                    truncated: 'Hd3f3..R3bD5',
                },
                sender: {
                    truncated: 'Hd3f3..R3bD5',
                },
                total: {
                    formatted: '1',
                    raw: 1,
                    unit: 'USDC',
                },
            });
            expect(getTokenInfo).toHaveBeenCalledWith(
                '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
                Cluster.MainnetBeta
            );
        });

        it('should create a formatted token transfer receipt for regular transfer', async () => {
            const mockTokenInfo = {
                symbol: 'USDC',
            };

            vi.mocked(getTx).mockResolvedValueOnce({
                cluster: Cluster.MainnetBeta,
                transaction: mockUsdcRegularTransferTransaction,
            });
            vi.mocked(getTokenInfo).mockResolvedValueOnce(mockTokenInfo);

            const result = await createReceipt(mockSignature);

            expect(result).toMatchObject({
                fee: {
                    formatted: '0.000005',
                    raw: 5000,
                },
                receiver: {
                    truncated: 'Hd3f3..R3bD5',
                },
                sender: {
                    truncated: 'Hd3f3..R3bD5',
                },
                total: {
                    formatted: '1',
                    raw: 1,
                    unit: 'USDC',
                },
            });
        });

        it('should handle token transfer when getTokenInfo returns undefined', async () => {
            vi.mocked(getTx).mockResolvedValueOnce({
                cluster: Cluster.MainnetBeta,
                transaction: mockUsdcTransferTransaction,
            });
            vi.mocked(getTokenInfo).mockResolvedValueOnce(undefined);

            const result = await createReceipt(mockSignature);

            expect(result).toMatchObject({
                total: {
                    unit: 'TOKEN',
                },
            });
        });

        it('should handle token transfer when getTokenInfo throws an error', async () => {
            vi.mocked(getTx).mockResolvedValueOnce({
                cluster: Cluster.MainnetBeta,
                transaction: mockUsdcTransferTransaction,
            });
            vi.mocked(getTokenInfo).mockRejectedValueOnce(new Error('Token info not found'));

            const result = await createReceipt(mockSignature);

            expect(result).toMatchObject({
                total: {
                    unit: 'TOKEN',
                },
            });
        });

        it('should create a formatted token transfer receipt for Token-2022 transfer2', async () => {
            const mockTokenInfo = {
                logoURI: 'https://example.com/t22.png',
                symbol: 'T22',
            };

            vi.mocked(getTx).mockResolvedValueOnce({
                cluster: Cluster.MainnetBeta,
                transaction: mockToken2022Transfer2Transaction,
            });
            vi.mocked(getTokenInfo).mockResolvedValueOnce(mockTokenInfo);

            const result = await createReceipt(mockSignature);

            expect(result).toMatchObject({
                fee: {
                    formatted: '0.000005',
                    raw: 5000,
                },
                network: 'Mainnet Beta',
                receiver: {
                    truncated: '65MUM..L2Fhk',
                },
                sender: {
                    truncated: 'Hd3f3..R3bD5',
                },
                total: {
                    formatted: '100',
                    raw: 100,
                    unit: 'T22',
                },
            });
            expect(getTokenInfo).toHaveBeenCalledWith(
                '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
                Cluster.MainnetBeta
            );
        });

        it('should create a formatted token transfer receipt for Token-2022 transferChecked', async () => {
            const mockTokenInfo = {
                logoURI: 'https://example.com/token-2022.png',
                symbol: 'T2022',
            };

            vi.mocked(getTx).mockResolvedValueOnce({
                cluster: Cluster.MainnetBeta,
                transaction: mockToken2022TransferTransaction,
            });
            vi.mocked(getTokenInfo).mockResolvedValueOnce(mockTokenInfo);

            const result = await createReceipt(mockSignature);

            expect(result).toMatchObject({
                fee: {
                    formatted: '0.000005',
                    raw: 5000,
                },
                network: 'Mainnet Beta',
                receiver: {
                    truncated: '65MUM..L2Fhk',
                },
                sender: {
                    truncated: 'Hd3f3..R3bD5',
                },
                total: {
                    formatted: '100',
                    raw: 100,
                    unit: 'T2022',
                },
            });
            expect(getTokenInfo).toHaveBeenCalledWith(
                'AN8h2reVWuPAWXhfJQounhTMqb5bvwVKumX6pMmSK25U',
                Cluster.MainnetBeta
            );
        });

        it('should create a receipt for multisig token transfer using multisigAuthority as sender', async () => {
            vi.mocked(getTx).mockResolvedValueOnce({
                cluster: Cluster.MainnetBeta,
                transaction: mockUsdcMultisigTransferTransaction,
            });
            vi.mocked(getTokenInfo).mockResolvedValueOnce({ symbol: 'USDC' });

            const result = await createReceipt(mockSignature);

            expect(result).toBeDefined();
            expect(result?.sender.address).toBe(MULTISIG_AUTHORITY.publicKey.toBase58());
            expect(result?.receiver.address).toBe(RECEIVER.publicKey.toBase58());
        });
    });

    describe('no transfer receipts', () => {
        it('should return null for transaction with no transfers', async () => {
            vi.mocked(getTx).mockResolvedValueOnce({
                cluster: Cluster.MainnetBeta,
                transaction: mockNoTransferTransaction,
            });

            const result = await createReceipt(mockSignature);

            expect(result).toBeUndefined();
        });
    });
});
