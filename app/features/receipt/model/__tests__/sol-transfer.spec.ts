import { describe, expect, it } from 'vitest';

import { RECEIVER, RECEIVER_2, SENDER } from '../../mocks/addresses';
import { mockJitoOnlyTransferTransaction } from '../../mocks/jito-only-transfer';
import { mockMultipleTransfersTransaction } from '../../mocks/multiple-transfers';
import { mockNoTransferTransaction } from '../../mocks/no-transfers';
import { mockSingleTransferTransaction } from '../../mocks/single-transfer';
import { mockZeroTransferTransaction } from '../../mocks/zero-transfer';
import { createSolTransferReceipt } from '../sol-transfer';

describe('createSolTransferReceipt', () => {
    describe('single transfer', () => {
        it('should return a receipt with correct sender, receiver, total, and fee', () => {
            const result = createSolTransferReceipt(mockSingleTransferTransaction);

            expect(result).toMatchObject({
                fee: 5000,
                receiver: RECEIVER.publicKey.toBase58(),
                sender: SENDER.publicKey.toBase58(),
                total: 300000000,
                type: 'sol',
            });
        });

        it('should return undefined transfers for a single instruction', () => {
            const result = createSolTransferReceipt(mockSingleTransferTransaction);

            expect(result?.transfers).toBeUndefined();
        });

        it('should return the block time as date', () => {
            const result = createSolTransferReceipt(mockSingleTransferTransaction);

            expect(result?.date).toBe(mockSingleTransferTransaction.blockTime);
        });
    });

    describe('multiple transfers', () => {
        it('should return a transfers array with one entry per instruction', () => {
            const result = createSolTransferReceipt(mockMultipleTransfersTransaction);

            expect(result?.transfers).toHaveLength(3);
        });

        it('should set total to the sum of all transfer amounts', () => {
            const result = createSolTransferReceipt(mockMultipleTransfersTransaction);

            // 80_000_000 + 50_000_000 + 10_000_000 = 140_000_000
            expect(result?.total).toBe(140000000);
        });

        it('should preserve each transfer receiver and sender', () => {
            const result = createSolTransferReceipt(mockMultipleTransfersTransaction);

            expect(result?.transfers).toEqual([
                {
                    receiver: RECEIVER.publicKey.toBase58(),
                    sender: SENDER.publicKey.toBase58(),
                    total: 80000000,
                },
                {
                    receiver: RECEIVER_2.publicKey.toBase58(),
                    sender: SENDER.publicKey.toBase58(),
                    total: 50000000,
                },
                {
                    receiver: RECEIVER.publicKey.toBase58(),
                    sender: SENDER.publicKey.toBase58(),
                    total: 10000000,
                },
            ]);
        });

        it('should use the first instruction sender and receiver on the receipt root', () => {
            const result = createSolTransferReceipt(mockMultipleTransfersTransaction);

            expect(result?.sender).toBe(SENDER.publicKey.toBase58());
            expect(result?.receiver).toBe(RECEIVER.publicKey.toBase58());
        });
    });

    describe('returns undefined', () => {
        it('should return undefined when there are no SOL transfer instructions', () => {
            const result = createSolTransferReceipt(mockNoTransferTransaction);

            expect(result).toBeUndefined();
        });

        it('should return undefined when the transfer amount is zero', () => {
            const result = createSolTransferReceipt(mockZeroTransferTransaction);

            expect(result).toBeUndefined();
        });

        it('should return undefined when the only transfer is to a Jito tip account', () => {
            const result = createSolTransferReceipt(mockJitoOnlyTransferTransaction);

            expect(result).toBeUndefined();
        });
    });
});
